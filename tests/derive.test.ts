import { describe, test, expect } from 'bun:test';
import { applyDerived } from '../src/derive.js';
import type { DerivedDefinition } from '../src/types.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Test helpers ──────────────────────────────────────────────────────────────

function colorMap(entries: Record<string, OklchColor>): Map<string, OklchColor> {
  return new Map(Object.entries(entries));
}

const red:    OklchColor = { l: 0.50, c: 0.20, h: 30 };
const blue:   OklchColor = { l: 0.30, c: 0.15, h: 250 };
const dark:   OklchColor = { l: 0.08, c: 0.02, h: 200 }; // bg1-like
const bright: OklchColor = { l: 0.97, c: 0.05, h: 200 }; // fg1-like

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('derive — applyDerived', () => {

  describe('blend transform', () => {
    test('amount=0 gives all B (blue) lightness', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'blend', a: 'red', b: 'blue', amount: 0 } }],
        colorMap({ red, blue }),
      );
      expect(result.get('out')!.l).toBeCloseTo(blue.l, 2);
    });

    test('amount=1 gives all A (red) lightness', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'blend', a: 'red', b: 'blue', amount: 1 } }],
        colorMap({ red, blue }),
      );
      expect(result.get('out')!.l).toBeCloseTo(red.l, 2);
    });

    test('amount=0.40 gives 40% A + 60% B lightness', () => {
      const result = applyDerived(
        [{ name: 'sel', transform: { type: 'blend', a: 'bright', b: 'dark', amount: 0.40 } }],
        colorMap({ bright, dark }),
      );
      const expectedL = 0.40 * bright.l + 0.60 * dark.l;
      expect(result.get('sel')!.l).toBeCloseTo(expectedL, 2);
    });

    test('missing source A → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'blend', a: 'missing', b: 'blue', amount: 0.5 } }],
        colorMap({ blue }),
      );
      expect(result.has('out')).toBe(false);
    });

    test('missing source B → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'blend', a: 'red', b: 'missing', amount: 0.5 } }],
        colorMap({ red }),
      );
      expect(result.has('out')).toBe(false);
    });
  });

  describe('adjustLightness transform', () => {
    test('positive delta increases L', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adjustLightness', source: 'red', delta: 0.10 } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.l).toBeGreaterThan(red.l);
    });

    test('negative delta decreases L', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adjustLightness', source: 'red', delta: -0.10 } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.l).toBeLessThan(red.l);
    });

    test('delta=0.10 shifts L by ~0.10', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adjustLightness', source: 'red', delta: 0.10 } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.l).toBeCloseTo(red.l + 0.10, 2);
    });

    test('L is clamped to [0, 1] after adjustment', () => {
      const almostMax: OklchColor = { l: 0.98, c: 0.05, h: 100 };
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adjustLightness', source: 'src', delta: 0.10 } }],
        colorMap({ src: almostMax }),
      );
      expect(result.get('out')!.l).toBeLessThanOrEqual(1);
    });

    test('missing source → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adjustLightness', source: 'ghost', delta: 0.1 } }],
        colorMap({}),
      );
      expect(result.has('out')).toBe(false);
    });
  });

  describe('withAlpha transform', () => {
    test('sets alpha on the output color', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withAlpha', source: 'red', alpha: 0.5 } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.alpha).toBeCloseTo(0.5, 3);
    });

    test('preserves source L/C/H unchanged', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withAlpha', source: 'red', alpha: 0.3 } }],
        colorMap({ red }),
      );
      const out = result.get('out')!;
      expect(out.l).toBeCloseTo(red.l, 3);
      expect(out.c).toBeCloseTo(red.c, 3);
    });

    test('alpha=0 produces transparent', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withAlpha', source: 'red', alpha: 0 } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.alpha).toBeCloseTo(0, 3);
    });

    test('missing source → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withAlpha', source: 'ghost', alpha: 0.5 } }],
        colorMap({}),
      );
      expect(result.has('out')).toBe(false);
    });
  });

  describe('ensureContrast transform', () => {
    test('adjusts low-contrast pair to meet minimum', () => {
      // Two similar-lightness colors → low contrast
      const src: OklchColor = { l: 0.20, c: 0.10, h: 30 };
      const bg: OklchColor  = { l: 0.15, c: 0.02, h: 200 };
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'ensureContrast', source: 'src', against: 'bg', min: 4.5 } }],
        colorMap({ src, bg }),
      );
      expect(result.has('out')).toBe(true);
    });

    test('leaves high-contrast pair lightness unchanged', () => {
      // bright vs dark already has ~11:1 contrast
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'ensureContrast', source: 'bright', against: 'dark', min: 4.5 } }],
        colorMap({ bright, dark }),
      );
      expect(result.get('out')!.l).toBeCloseTo(bright.l, 2);
    });

    test('missing source → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'ensureContrast', source: 'ghost', against: 'dark', min: 4.5 } }],
        colorMap({ dark }),
      );
      expect(result.has('out')).toBe(false);
    });

    test('missing against → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'ensureContrast', source: 'bright', against: 'ghost', min: 4.5 } }],
        colorMap({ bright }),
      );
      expect(result.has('out')).toBe(false);
    });
  });

  describe('copy transform', () => {
    test('output has identical L/C/H to source', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'copy', source: 'red' } }],
        colorMap({ red }),
      );
      const out = result.get('out')!;
      expect(out.l).toBeCloseTo(red.l, 3);
      expect(out.c).toBeCloseTo(red.c, 3);
      expect(out.h).toBeCloseTo(red.h, 3);
    });

    test('output is a different object (not same reference)', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'copy', source: 'red' } }],
        colorMap({ red }),
      );
      expect(result.get('out')).not.toBe(red);
    });

    test('missing source → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'copy', source: 'ghost' } }],
        colorMap({}),
      );
      expect(result.has('out')).toBe(false);
    });
  });

  describe('withHexAlpha transform', () => {
    test('"40" → alpha ≈ 0x40/255 ≈ 0.251', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withHexAlpha', source: 'red', hexAlpha: '40' } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.alpha).toBeCloseTo(0x40 / 255, 3);
    });

    test('"ff" → alpha 1.0', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withHexAlpha', source: 'red', hexAlpha: 'ff' } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.alpha).toBeCloseTo(1.0, 3);
    });

    test('"00" → alpha 0.0', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withHexAlpha', source: 'red', hexAlpha: '00' } }],
        colorMap({ red }),
      );
      expect(result.get('out')!.alpha).toBeCloseTo(0.0, 3);
    });

    test('preserves source L/C/H unchanged', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withHexAlpha', source: 'red', hexAlpha: '80' } }],
        colorMap({ red }),
      );
      const out = result.get('out')!;
      expect(out.l).toBeCloseTo(red.l, 3);
      expect(out.h).toBeCloseTo(red.h, 3);
    });

    test('missing source → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'withHexAlpha', source: 'ghost', hexAlpha: '80' } }],
        colorMap({}),
      );
      expect(result.has('out')).toBe(false);
    });
  });

  describe('adaptiveFg transform', () => {
    // Test fixtures
    const darkBg:  OklchColor = { l: 0.08, c: 0.02, h: 200 }; // bg1 dark mode
    const lightBg: OklchColor = { l: 0.96, c: 0.02, h: 200 }; // bg1 light mode
    const fg1:     OklchColor = { l: 0.97, c: 0.05, h: 200 }; // near-white fg
    const fg3:     OklchColor = { l: 0.08, c: 0.08, h: 200 }; // near-bg fg
    const darkAccent:  OklchColor = { l: 0.30, c: 0.25, h: 250 }; // dark accent (L < 0.5)
    const lightAccent: OklchColor = { l: 0.75, c: 0.25, h: 250 }; // light accent (L > 0.5)

    test('dark mode + dark accent → fg1 (light text on dark button)', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'darkAccent' } }],
        colorMap({ bg1: darkBg, fg1, fg3, darkAccent }),
      );
      expect(result.get('out')!.l).toBeCloseTo(fg1.l, 3);
    });

    test('dark mode + light accent → fg3 (near-bg text on light button)', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'lightAccent' } }],
        colorMap({ bg1: darkBg, fg1, fg3, lightAccent }),
      );
      expect(result.get('out')!.l).toBeCloseTo(fg3.l, 3);
    });

    test('light mode + dark accent → fg3 (near-bg text on dark button in light theme)', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'darkAccent' } }],
        colorMap({ bg1: lightBg, fg1, fg3, darkAccent }),
      );
      expect(result.get('out')!.l).toBeCloseTo(fg3.l, 3);
    });

    test('light mode + light accent → fg1 (main text on light button in light theme)', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'lightAccent' } }],
        colorMap({ bg1: lightBg, fg1, fg3, lightAccent }),
      );
      expect(result.get('out')!.l).toBeCloseTo(fg1.l, 3);
    });

    test('missing bg1 → role skipped (no mode detection possible)', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'darkAccent' } }],
        colorMap({ fg1, fg3, darkAccent }), // no bg1
      );
      expect(result.has('out')).toBe(false);
    });

    test('missing fg1 → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'darkAccent' } }],
        colorMap({ bg1: darkBg, fg3, darkAccent }), // no fg1
      );
      expect(result.has('out')).toBe(false);
    });

    test('missing accent → role skipped', () => {
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'missing' } }],
        colorMap({ bg1: darkBg, fg1, fg3 }),
      );
      expect(result.has('out')).toBe(false);
    });

    test('custom bgRole — uses specified role for mode detection instead of bg1', () => {
      // background = lightBg (l=0.96) → light mode; darkAccent (l=0.3) → fg3
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'darkAccent', bgRole: 'background' } }],
        colorMap({ background: lightBg, fg1, fg3, darkAccent }),
      );
      expect(result.get('out')!.l).toBeCloseTo(fg3.l, 3);
    });

    test('custom fgRole — uses specified role as high-contrast foreground', () => {
      const customFg: OklchColor = { l: 0.90, c: 0.10, h: 100 };
      // dark mode + dark accent → pick fgRole (customFg instead of fg1)
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'darkAccent', fgRole: 'customFg' } }],
        colorMap({ bg1: darkBg, fg1, fg3, customFg, darkAccent }),
      );
      expect(result.get('out')!.l).toBeCloseTo(customFg.l, 3);
    });

    test('custom fgAltRole — uses specified role as low-contrast foreground', () => {
      const customAlt: OklchColor = { l: 0.10, c: 0.02, h: 200 };
      // dark mode + light accent → pick fgAltRole (customAlt instead of fg3)
      const result = applyDerived(
        [{ name: 'out', transform: { type: 'adaptiveFg', background: 'lightAccent', fgAltRole: 'customAlt' } }],
        colorMap({ bg1: darkBg, fg1, fg3, customAlt, lightAccent }),
      );
      expect(result.get('out')!.l).toBeCloseTo(customAlt.l, 3);
    });

    test('all three custom roles — shadcn pattern (bgRole=background, fgRole=foreground, fgAltRole=background)', () => {
      const background: OklchColor = { l: 0.08, c: 0.02, h: 0 }; // dark mode background
      const foreground: OklchColor = { l: 0.97, c: 0.03, h: 0 }; // near-white text
      // dark mode + dark primary → fg (foreground)
      const result = applyDerived(
        [{
          name: 'primaryFg',
          transform: {
            type: 'adaptiveFg', background: 'primary',
            bgRole: 'background', fgRole: 'foreground', fgAltRole: 'background',
          },
        }],
        colorMap({ background, foreground, primary: darkAccent }),
      );
      expect(result.get('primaryFg')!.l).toBeCloseTo(foreground.l, 3);
    });
  });

  describe('chaining and composition', () => {
    test('later transform can reference earlier derived color', () => {
      const defs: DerivedDefinition[] = [
        { name: 'step1', transform: { type: 'adjustLightness', source: 'red', delta: 0.10 } },
        { name: 'step2', transform: { type: 'withAlpha', source: 'step1', alpha: 0.5 } },
      ];
      const result = applyDerived(defs, colorMap({ red }));
      const step1 = result.get('step1')!;
      const step2 = result.get('step2')!;
      expect(step1).toBeDefined();
      expect(step2).toBeDefined();
      expect(step2.alpha).toBeCloseTo(0.5, 3);
      expect(step2.l).toBeCloseTo(step1.l, 2);
    });

    test('original assigned colors are preserved in output', () => {
      const result = applyDerived(
        [{ name: 'derived', transform: { type: 'copy', source: 'red' } }],
        colorMap({ red, blue }),
      );
      expect(result.has('red')).toBe(true);
      expect(result.has('blue')).toBe(true);
      expect(result.has('derived')).toBe(true);
    });

    test('empty definitions returns all original colors unchanged', () => {
      const result = applyDerived([], colorMap({ red, blue }));
      expect(result.size).toBe(2);
      expect(result.get('red')!.l).toBeCloseTo(red.l, 3);
    });

    test('all 7 transform types succeed in one pass', () => {
      const fg1r: OklchColor = { l: 0.97, c: 0.05, h: 200 };
      const fg3r: OklchColor = { l: 0.08, c: 0.08, h: 200 };
      const defs: DerivedDefinition[] = [
        { name: 'blended',        transform: { type: 'blend', a: 'bright', b: 'dark', amount: 0.4 } },
        { name: 'lighter',        transform: { type: 'adjustLightness', source: 'dark', delta: 0.1 } },
        { name: 'transparent',    transform: { type: 'withAlpha', source: 'red', alpha: 0.3 } },
        { name: 'contrasted',     transform: { type: 'ensureContrast', source: 'red', against: 'dark', min: 4.5 } },
        { name: 'cloned',         transform: { type: 'copy', source: 'red' } },
        { name: 'hexTransparent', transform: { type: 'withHexAlpha', source: 'red', hexAlpha: '80' } },
        { name: 'adaptive',       transform: { type: 'adaptiveFg', background: 'red' } },
      ];
      const result = applyDerived(defs, colorMap({ red, blue, dark, bright, bg1: dark, fg1: fg1r, fg3: fg3r }));
      expect(result.has('blended')).toBe(true);
      expect(result.has('lighter')).toBe(true);
      expect(result.has('transparent')).toBe(true);
      expect(result.has('contrasted')).toBe(true);
      expect(result.has('cloned')).toBe(true);
      expect(result.has('hexTransparent')).toBe(true);
      expect(result.has('adaptive')).toBe(true);
    });
  });

});

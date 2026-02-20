import { describe, test, expect } from 'bun:test';
import { wcagContrast } from 'culori';
import { createHelixSpec } from '../../src/specs/helix.js';
import { extract } from '../../src/extract.js';
import { SYNTAX_ROLE_NAMES } from '../../src/constraints.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Test helpers ───────────────────────────────────────────────────────────────

function makeCloud(): OklchColor[] {
  const cloud: OklchColor[] = [];
  for (let h = 0; h < 360; h += 10) {
    cloud.push({ l: 0.08, c: 0.02, h });
    cloud.push({ l: 0.97, c: 0.03, h });
    cloud.push({ l: 0.55, c: 0.25, h });
  }
  return cloud;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('specs/helix', () => {

  describe('structure', () => {
    test('spec name is "helix"', () => {
      expect(createHelixSpec().name).toBe('helix');
    });

    test('default ansiMode is "free"', () => {
      expect(createHelixSpec().ansiMode).toBe('free');
    });

    test('ansiMode: "constrained" option is respected', () => {
      expect(createHelixSpec({ ansiMode: 'constrained' }).ansiMode).toBe('constrained');
    });

    test('has cursor role (Helix block cursor)', () => {
      const spec = createHelixSpec();
      expect(spec.roles.some((r) => r.name === 'cursor')).toBe(true);
    });

    test('cursor has priority 68 (between ac1=70 and ac2=65)', () => {
      const spec = createHelixSpec();
      const cursor = spec.roles.find((r) => r.name === 'cursor')!;
      expect(cursor.priority).toBe(68);
    });

    test('cursor has unconstrained L and C', () => {
      const spec = createHelixSpec();
      const cursor = spec.roles.find((r) => r.name === 'cursor')!;
      expect(cursor.dark.l[0]).toBeCloseTo(0, 3);
      expect(cursor.dark.l[1]).toBeCloseTo(1, 3);
      expect(cursor.dark.c[0]).toBeCloseTo(0, 3);
      expect(cursor.dark.c[1]).toBeCloseTo(0.40, 3);
    });

    test('has all 42 syntax roles', () => {
      const spec = createHelixSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of SYNTAX_ROLE_NAMES) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has all 9 core UI roles', () => {
      const spec = createHelixSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['bg1', 'bg2', 'bg3', 'fg1', 'fg2', 'fg3', 'ac1', 'ac2', 'border']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has all 4 status roles', () => {
      const spec = createHelixSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['info', 'error', 'warning', 'success']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has all 8 ANSI base roles', () => {
      const spec = createHelixSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow',
                       'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('total role count is 64 (9 UI + 1 cursor + 4 status + 42 syntax + 8 ANSI)', () => {
      const spec = createHelixSpec();
      expect(spec.roles.length).toBe(64);
    });

    test('comment has no hueGroup — intentionally achromatic', () => {
      const spec = createHelixSpec();
      const comment = spec.roles.find((r) => r.name === 'comment')!;
      expect(comment.hueGroup).toBeUndefined();
    });

    test('function and functionCall share hueGroup "function"', () => {
      const spec = createHelixSpec();
      const fn  = spec.roles.find((r) => r.name === 'function')!;
      const fnC = spec.roles.find((r) => r.name === 'functionCall')!;
      expect(fn.hueGroup).toBe('function');
      expect(fnC.hueGroup).toBe('function');
    });

    test('constrained ANSI roles have hue constraints', () => {
      const spec = createHelixSpec({ ansiMode: 'constrained' });
      const ansiRed = spec.roles.find((r) => r.name === 'ansiRed')!;
      expect(ansiRed.dark.h).toBeDefined();
    });

    test('free ANSI roles have no hue constraints', () => {
      const spec = createHelixSpec({ ansiMode: 'free' });
      const ansiRed = spec.roles.find((r) => r.name === 'ansiRed')!;
      expect(ansiRed.dark.h).toBeUndefined();
    });
  });

  describe('derived colors', () => {
    test('has all 8 bright ANSI derived colors', () => {
      const spec = createHelixSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      for (const n of ['ansiBrightBlack', 'ansiBrightRed', 'ansiBrightGreen', 'ansiBrightYellow',
                       'ansiBrightBlue', 'ansiBrightMagenta', 'ansiBrightCyan', 'ansiBrightWhite']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('ansiBrightRed uses adjustLightness +0.10 from ansiRed', () => {
      const spec = createHelixSpec();
      const def = spec.derived.find((d) => d.name === 'ansiBrightRed')!;
      expect(def.transform.type).toBe('adjustLightness');
      if (def.transform.type === 'adjustLightness') {
        expect(def.transform.source).toBe('ansiRed');
        expect(def.transform.delta).toBeCloseTo(0.10, 3);
      }
    });

    test('has cursorText derived (copy of bg1)', () => {
      const spec = createHelixSpec();
      const def = spec.derived.find((d) => d.name === 'cursorText')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('copy');
      if (def.transform.type === 'copy') {
        expect(def.transform.source).toBe('bg1');
      }
    });

    test('has selectionBg derived (withHexAlpha from ac2, "50")', () => {
      const spec = createHelixSpec();
      const def = spec.derived.find((d) => d.name === 'selectionBg')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('withHexAlpha');
      if (def.transform.type === 'withHexAlpha') {
        expect(def.transform.source).toBe('ac2');
        expect(def.transform.hexAlpha).toBe('50');
      }
    });

    test('has selectionFg derived (copy of fg1)', () => {
      const spec = createHelixSpec();
      const def = spec.derived.find((d) => d.name === 'selectionFg')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('copy');
    });

    test('has lineHighlight derived (withHexAlpha from ac1, "50")', () => {
      const spec = createHelixSpec();
      const def = spec.derived.find((d) => d.name === 'lineHighlight')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('withHexAlpha');
    });

    test('has findMatch derived (withHexAlpha from ac2, "4d")', () => {
      const spec = createHelixSpec();
      const def = spec.derived.find((d) => d.name === 'findMatch')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('withHexAlpha');
      if (def.transform.type === 'withHexAlpha') {
        expect(def.transform.hexAlpha).toBe('4d');
      }
    });

    test('has ac1Fg and ac2Fg adaptive foregrounds', () => {
      const spec = createHelixSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      expect(names.has('ac1Fg')).toBe(true);
      expect(names.has('ac2Fg')).toBe(true);
    });

    test('has infoFg, warningFg, errorFg, successFg adaptive foregrounds', () => {
      const spec = createHelixSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      for (const n of ['infoFg', 'warningFg', 'errorFg', 'successFg']) {
        expect(names.has(n)).toBe(true);
      }
    });
  });

  describe('contrast constraints', () => {
    test('fg1 defaults to 7.5 contrast vs bg1', () => {
      const spec = createHelixSpec();
      const c = spec.constraints.find((c) => c.role === 'fg1' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(7.5, 3);
    });

    test('contrastFg option overrides fg1 constraint', () => {
      const spec = createHelixSpec({ contrastFg: 5.5 });
      const c = spec.constraints.find((c) => c.role === 'fg1' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('cursor has 5.5 contrast vs bg1 (default)', () => {
      const spec = createHelixSpec();
      const c = spec.constraints.find((c) => c.role === 'cursor' && c.against === 'bg1')!;
      expect(c).toBeDefined();
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('comment has min 2.5 and max 3.5 (dark defaults)', () => {
      const spec = createHelixSpec();
      const c = spec.constraints.find((c) => c.role === 'comment')!;
      expect(c.min).toBeCloseTo(2.5, 3);
      expect(c.max).toBeCloseTo(3.5, 3);
    });

    test('comment is the only constraint with a max value', () => {
      const spec = createHelixSpec();
      const withMax = spec.constraints.filter((c) => c.max !== undefined);
      expect(withMax.length).toBe(1);
      expect(withMax[0].role).toBe('comment');
    });

    test('commentMin / commentMax options override comment constraint', () => {
      const spec = createHelixSpec({ commentMin: 1.5, commentMax: 3.0 });
      const c = spec.constraints.find((c) => c.role === 'comment')!;
      expect(c.min).toBeCloseTo(1.5, 3);
      expect(c.max).toBeCloseTo(3.0, 3);
    });

    test('keyword has 5.5 minimum (contrastSyntax default)', () => {
      const spec = createHelixSpec();
      const c = spec.constraints.find((c) => c.role === 'keyword')!;
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('contrastSyntax option overrides all syntax constraints', () => {
      const spec = createHelixSpec({ contrastSyntax: 4.5 });
      const c = spec.constraints.find((c) => c.role === 'keyword')!;
      expect(c.min).toBeCloseTo(4.5, 3);
    });

    test('all 8 ANSI base colors have 4.5 contrast constraint', () => {
      const spec = createHelixSpec();
      for (const name of ['ansiRed', 'ansiGreen', 'ansiBlue', 'ansiYellow',
                          'ansiMagenta', 'ansiCyan', 'ansiBlack', 'ansiWhite']) {
        const c = spec.constraints.find((c) => c.role === name)!;
        expect(c.min).toBeCloseTo(4.5, 3);
      }
    });
  });

  describe('extraction integration', () => {
    test('extract produces a valid dark palette', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      expect(palette.spec).toBe('helix');
      expect(palette.mode).toBe('dark');
    });

    test('extract produces a valid light palette', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'light', { randomSeed: 42 });
      expect(palette.spec).toBe('helix');
      expect(palette.mode).toBe('light');
    });

    test('bg1 is dark in dark mode (L ≤ 0.35)', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('bg1')!.oklch.l).toBeLessThanOrEqual(0.35);
    });

    test('cursor role is in the palette', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('cursor')).toBeDefined();
    });

    test('cursor contrast vs bg1 is at least 5.5', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      expect(wcagContrast(palette.hex('cursor'), palette.hex('bg1'))).toBeGreaterThanOrEqual(5.5);
    });

    test('cursorText matches bg1 in the palette', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      const bg1        = palette.get('bg1')!.oklch;
      const cursorText = palette.get('cursorText')!.oklch;
      expect(cursorText.l).toBeCloseTo(bg1.l, 3);
    });

    test('all 42 syntax roles are present in the palette', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      for (const name of SYNTAX_ROLE_NAMES) {
        expect(palette.get(name)).toBeDefined();
      }
    });

    test('selectionBg has an alpha component (hex length > 7)', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      expect(palette.hex('selectionBg').length).toBeGreaterThan(7);
    });

    test('lineHighlight has an alpha component (hex length > 7)', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      expect(palette.hex('lineHighlight').length).toBeGreaterThan(7);
    });

    test('comment contrast vs bg1 is between 2.5 and 3.5 in dark mode', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      const c = wcagContrast(palette.hex('comment'), palette.hex('bg1'));
      expect(c).toBeGreaterThanOrEqual(2.5);
      expect(c).toBeLessThanOrEqual(3.5);
    });

    test('comment dual-BG: contrast vs bg3 is between 2.5 and 3.5', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      const c = wcagContrast(palette.hex('comment'), palette.hex('bg3'));
      expect(c).toBeGreaterThanOrEqual(2.5);
      expect(c).toBeLessThanOrEqual(3.5);
    });

    test('ansiBrightRed is lighter than ansiRed in dark mode', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      const base   = palette.get('ansiRed')!.oklch.l;
      const bright = palette.get('ansiBrightRed')!.oklch.l;
      expect(bright).toBeGreaterThan(base);
    });

    test('ac1Fg is fg1 or fg3 from the palette (adaptive foreground)', () => {
      const palette = extract(makeCloud(), createHelixSpec(), 'dark', { randomSeed: 42 });
      const ac1FgHex = palette.hex('ac1Fg');
      const fg1Hex   = palette.hex('fg1');
      const fg3Hex   = palette.hex('fg3');
      expect([fg1Hex, fg3Hex]).toContain(ac1FgHex);
    });

    test('same seed produces identical palettes (determinism)', () => {
      const cloud = makeCloud();
      const spec  = createHelixSpec();
      const p1 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      const p2 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      expect(p1.hex('bg1')).toBe(p2.hex('bg1'));
      expect(p1.hex('cursor')).toBe(p2.hex('cursor'));
      expect(p1.hex('comment')).toBe(p2.hex('comment'));
    });
  });

});

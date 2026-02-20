import { describe, test, expect } from 'bun:test';
import { createTerminalSpec } from '../../src/specs/terminal.js';
import { extract } from '../../src/extract.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Test helpers ──────────────────────────────────────────────────────────────

/** Wide OKLCH cloud covering darks, brights, and mid-range chromas */
function makeCloud(): OklchColor[] {
  const cloud: OklchColor[] = [];
  for (let h = 0; h < 360; h += 10) {
    cloud.push({ l: 0.08, c: 0.02, h }); // dark bg territory
    cloud.push({ l: 0.97, c: 0.03, h }); // bright fg territory
    cloud.push({ l: 0.55, c: 0.25, h }); // saturated mid-range
  }
  return cloud;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('specs/terminal', () => {

  describe('structure', () => {
    test('spec name is "terminal"', () => {
      expect(createTerminalSpec().name).toBe('terminal');
    });

    test('default ansiMode is "free"', () => {
      expect(createTerminalSpec().ansiMode).toBe('free');
    });

    test('ansiMode: "constrained" option is respected', () => {
      expect(createTerminalSpec({ ansiMode: 'constrained' }).ansiMode).toBe('constrained');
    });

    test('has cursor role', () => {
      const spec = createTerminalSpec();
      expect(spec.roles.some((r) => r.name === 'cursor')).toBe(true);
    });

    test('cursor has priority 68 (between ac1=70 and ac2=65)', () => {
      const spec = createTerminalSpec();
      const cursor = spec.roles.find((r) => r.name === 'cursor')!;
      expect(cursor.priority).toBe(68);
    });

    test('has all 8 ANSI base roles', () => {
      const spec = createTerminalSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow', 'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has core UI roles (bg1, fg1, fg2, border)', () => {
      const spec = createTerminalSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      expect(names.has('bg1')).toBe(true);
      expect(names.has('fg1')).toBe(true);
      expect(names.has('fg2')).toBe(true);
      expect(names.has('border')).toBe(true);
    });

    test('has all 4 status roles', () => {
      const spec = createTerminalSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      expect(names.has('info')).toBe(true);
      expect(names.has('error')).toBe(true);
      expect(names.has('warning')).toBe(true);
      expect(names.has('success')).toBe(true);
    });

    test('has NO syntax or comment roles — terminals are not editors', () => {
      const spec = createTerminalSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      expect(names.has('keyword')).toBe(false);
      expect(names.has('comment')).toBe(false);
      expect(names.has('string')).toBe(false);
      expect(names.has('function')).toBe(false);
      expect(names.has('variable')).toBe(false);
    });

    test('constrained mode ANSI roles have hue constraints', () => {
      const spec = createTerminalSpec({ ansiMode: 'constrained' });
      const ansiRed = spec.roles.find((r) => r.name === 'ansiRed')!;
      // Constrained mode adds hue constraints
      expect(ansiRed.dark.h).toBeDefined();
    });

    test('free mode ANSI roles have no hue constraints', () => {
      const spec = createTerminalSpec({ ansiMode: 'free' });
      const ansiRed = spec.roles.find((r) => r.name === 'ansiRed')!;
      expect(ansiRed.dark.h).toBeUndefined();
    });
  });

  describe('derived colors', () => {
    test('has all 8 bright ANSI derived colors', () => {
      const spec = createTerminalSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      for (const n of ['ansiBrightBlack', 'ansiBrightRed', 'ansiBrightGreen', 'ansiBrightYellow',
                       'ansiBrightBlue', 'ansiBrightMagenta', 'ansiBrightCyan', 'ansiBrightWhite']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('ansiBrightRed uses adjustLightness +0.10 from ansiRed', () => {
      const spec = createTerminalSpec();
      const def = spec.derived.find((d) => d.name === 'ansiBrightRed')!;
      expect(def.transform.type).toBe('adjustLightness');
      if (def.transform.type === 'adjustLightness') {
        expect(def.transform.source).toBe('ansiRed');
        expect(def.transform.delta).toBeCloseTo(0.10, 3);
      }
    });

    test('has selectionBg derived color', () => {
      const spec = createTerminalSpec();
      expect(spec.derived.some((d) => d.name === 'selectionBg')).toBe(true);
    });

    test('selectionBg blends fg1 (40%) and bg1 (60%)', () => {
      const spec = createTerminalSpec();
      const def = spec.derived.find((d) => d.name === 'selectionBg')!;
      expect(def.transform.type).toBe('blend');
      if (def.transform.type === 'blend') {
        expect(def.transform.a).toBe('fg1');
        expect(def.transform.b).toBe('bg1');
        expect(def.transform.amount).toBeCloseTo(0.40, 3);
      }
    });

    test('has cursorText (copy of bg1)', () => {
      const spec = createTerminalSpec();
      const def = spec.derived.find((d) => d.name === 'cursorText')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('copy');
      if (def.transform.type === 'copy') {
        expect(def.transform.source).toBe('bg1');
      }
    });
  });

  describe('contrast constraints', () => {
    test('fg1 defaults to 7.5 contrast vs bg1 (AAA terminal standard)', () => {
      const spec = createTerminalSpec();
      const c = spec.constraints.find((c) => c.role === 'fg1' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(7.5, 3);
    });

    test('contrastFg option overrides fg1 constraint', () => {
      const spec = createTerminalSpec({ contrastFg: 5.5 });
      const c = spec.constraints.find((c) => c.role === 'fg1' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('ANSI base colors default to 4.5 contrast vs bg1', () => {
      const spec = createTerminalSpec();
      const c = spec.constraints.find((c) => c.role === 'ansiRed' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(4.5, 3);
    });

    test('contrastAnsi option overrides all ANSI constraints', () => {
      const spec = createTerminalSpec({ contrastAnsi: 3.0 });
      const c = spec.constraints.find((c) => c.role === 'ansiBlue' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(3.0, 3);
    });

    test('cursor defaults to 5.5 contrast vs bg1', () => {
      const spec = createTerminalSpec();
      const c = spec.constraints.find((c) => c.role === 'cursor' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('contrastCursor option overrides cursor constraint', () => {
      const spec = createTerminalSpec({ contrastCursor: 7.0 });
      const c = spec.constraints.find((c) => c.role === 'cursor' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(7.0, 3);
    });

    test('no comment constraint (terminal has no comment role)', () => {
      const spec = createTerminalSpec();
      expect(spec.constraints.some((c) => c.role === 'comment')).toBe(false);
    });

    test('no syntax constraints (terminal has no syntax roles)', () => {
      const spec = createTerminalSpec();
      expect(spec.constraints.some((c) => c.role === 'keyword')).toBe(false);
      expect(spec.constraints.some((c) => c.role === 'function')).toBe(false);
    });
  });

  describe('extraction integration', () => {
    test('extract produces valid dark palette', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      expect(palette.spec).toBe('terminal');
      expect(palette.mode).toBe('dark');
    });

    test('bg1 is dark in dark mode (L ≤ 0.35)', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('bg1')!.oklch.l).toBeLessThanOrEqual(0.35);
    });

    test('fg1 is bright in dark mode (L ≥ 0.90)', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('fg1')!.oklch.l).toBeGreaterThanOrEqual(0.90);
    });

    test('all 8 bright ANSI roles are in the palette', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      for (const n of ['ansiBrightRed', 'ansiBrightGreen', 'ansiBrightBlue', 'ansiBrightWhite']) {
        expect(palette.get(n)).toBeDefined();
      }
    });

    test('ansiBrightRed is lighter than ansiRed', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      const base   = palette.get('ansiRed')!.oklch.l;
      const bright = palette.get('ansiBrightRed')!.oklch.l;
      expect(bright).toBeGreaterThan(base);
    });

    test('selectionBg lightness is between bg1 and fg1', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      const bg1L = palette.get('bg1')!.oklch.l;
      const fg1L = palette.get('fg1')!.oklch.l;
      const selL = palette.get('selectionBg')!.oklch.l;
      expect(selL).toBeGreaterThan(bg1L);
      expect(selL).toBeLessThan(fg1L);
    });

    test('cursorText is a copy of bg1', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      const bg1 = palette.get('bg1')!.oklch;
      const cursorText = palette.get('cursorText')!.oklch;
      expect(cursorText.l).toBeCloseTo(bg1.l, 3);
      expect(cursorText.c).toBeCloseTo(bg1.c, 3);
    });

    test('extract in light mode: bg1 is light (L ≥ 0.93)', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'light', { randomSeed: 42 });
      expect(palette.get('bg1')!.oklch.l).toBeGreaterThanOrEqual(0.93);
    });

    test('all critical roles have non-empty hex values', () => {
      const palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
      for (const role of ['bg1', 'fg1', 'cursor', 'ansiRed', 'ansiBrightRed', 'selectionBg', 'cursorText']) {
        expect(palette.hex(role).length).toBeGreaterThan(0);
      }
    });

    test('same seed produces identical palette (determinism)', () => {
      const cloud = makeCloud();
      const spec = createTerminalSpec();
      const p1 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      const p2 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      expect(p1.hex('bg1')).toBe(p2.hex('bg1'));
      expect(p1.hex('ansiRed')).toBe(p2.hex('ansiRed'));
    });
  });

});

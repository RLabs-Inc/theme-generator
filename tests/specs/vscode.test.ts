import { describe, test, expect } from 'bun:test';
import { wcagContrast } from 'culori';
import { createVSCodeSpec } from '../../src/specs/vscode.js';
import { extract } from '../../src/extract.js';
import { SYNTAX_ROLE_NAMES } from '../../src/constraints.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Test helpers ───────────────────────────────────────────────────────────────

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

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('specs/vscode', () => {

  describe('structure', () => {
    test('spec name is "vscode"', () => {
      expect(createVSCodeSpec().name).toBe('vscode');
    });

    test('default ansiMode is "free"', () => {
      expect(createVSCodeSpec().ansiMode).toBe('free');
    });

    test('ansiMode: "constrained" option is respected', () => {
      expect(createVSCodeSpec({ ansiMode: 'constrained' }).ansiMode).toBe('constrained');
    });

    test('has all 42 syntax roles', () => {
      const spec = createVSCodeSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of SYNTAX_ROLE_NAMES) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('syntax role count matches SYNTAX_ROLE_NAMES length (42)', () => {
      expect(SYNTAX_ROLE_NAMES.length).toBe(42);
    });

    test('has "string" role (RLabs extra)', () => {
      const spec = createVSCodeSpec();
      expect(spec.roles.some((r) => r.name === 'string')).toBe(true);
    });

    test('has "namespace" role (RLabs extra)', () => {
      const spec = createVSCodeSpec();
      expect(spec.roles.some((r) => r.name === 'namespace')).toBe(true);
    });

    test('has NO cursor role — cursors are terminal/Zed-specific', () => {
      const spec = createVSCodeSpec();
      expect(spec.roles.some((r) => r.name === 'cursor')).toBe(false);
    });

    test('has all 9 core UI roles', () => {
      const spec = createVSCodeSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['bg1', 'bg2', 'bg3', 'fg1', 'fg2', 'fg3', 'ac1', 'ac2', 'border']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has all 4 status roles', () => {
      const spec = createVSCodeSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['info', 'error', 'warning', 'success']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has all 8 ANSI base roles', () => {
      const spec = createVSCodeSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow',
                       'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('total role count is 63 (9 UI + 4 status + 42 syntax + 8 ANSI)', () => {
      const spec = createVSCodeSpec();
      expect(spec.roles.length).toBe(63);
    });

    test('function and functionCall share hueGroup "function"', () => {
      const spec = createVSCodeSpec();
      const fn   = spec.roles.find((r) => r.name === 'function')!;
      const fnC  = spec.roles.find((r) => r.name === 'functionCall')!;
      expect(fn.hueGroup).toBe('function');
      expect(fnC.hueGroup).toBe('function');
    });

    test('method and methodCall share hueGroup "method"', () => {
      const spec = createVSCodeSpec();
      const m  = spec.roles.find((r) => r.name === 'method')!;
      const mc = spec.roles.find((r) => r.name === 'methodCall')!;
      expect(m.hueGroup).toBe('method');
      expect(mc.hueGroup).toBe('method');
    });

    test('variable, variableReadonly, variableDeclaration share hueGroup "variable"', () => {
      const spec = createVSCodeSpec();
      for (const name of ['variable', 'variableReadonly', 'variableDeclaration']) {
        const role = spec.roles.find((r) => r.name === name)!;
        expect(role.hueGroup).toBe('variable');
      }
    });

    test('type and typeParameter share hueGroup "type"', () => {
      const spec = createVSCodeSpec();
      const t  = spec.roles.find((r) => r.name === 'type')!;
      const tp = spec.roles.find((r) => r.name === 'typeParameter')!;
      expect(t.hueGroup).toBe('type');
      expect(tp.hueGroup).toBe('type');
    });

    test('storage and modifier share hueGroup "storage"', () => {
      const spec = createVSCodeSpec();
      const s = spec.roles.find((r) => r.name === 'storage')!;
      const m = spec.roles.find((r) => r.name === 'modifier')!;
      expect(s.hueGroup).toBe('storage');
      expect(m.hueGroup).toBe('storage');
    });

    test('comment has no hueGroup — intentionally achromatic', () => {
      const spec = createVSCodeSpec();
      const comment = spec.roles.find((r) => r.name === 'comment')!;
      expect(comment.hueGroup).toBeUndefined();
    });

    test('constrained ANSI roles have hue constraints', () => {
      const spec = createVSCodeSpec({ ansiMode: 'constrained' });
      const ansiRed = spec.roles.find((r) => r.name === 'ansiRed')!;
      expect(ansiRed.dark.h).toBeDefined();
    });

    test('free ANSI roles have no hue constraints', () => {
      const spec = createVSCodeSpec({ ansiMode: 'free' });
      const ansiRed = spec.roles.find((r) => r.name === 'ansiRed')!;
      expect(ansiRed.dark.h).toBeUndefined();
    });
  });

  describe('derived colors', () => {
    test('has all 8 bright ANSI derived colors', () => {
      const spec = createVSCodeSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      for (const n of ['ansiBrightBlack', 'ansiBrightRed', 'ansiBrightGreen', 'ansiBrightYellow',
                       'ansiBrightBlue', 'ansiBrightMagenta', 'ansiBrightCyan', 'ansiBrightWhite']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('ansiBrightRed uses adjustLightness +0.10 from ansiRed', () => {
      const spec = createVSCodeSpec();
      const def = spec.derived.find((d) => d.name === 'ansiBrightRed')!;
      expect(def.transform.type).toBe('adjustLightness');
      if (def.transform.type === 'adjustLightness') {
        expect(def.transform.source).toBe('ansiRed');
        expect(def.transform.delta).toBeCloseTo(0.10, 3);
      }
    });

    test('has selectionBg derived (withHexAlpha from ac2, "50")', () => {
      const spec = createVSCodeSpec();
      const def = spec.derived.find((d) => d.name === 'selectionBg')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('withHexAlpha');
      if (def.transform.type === 'withHexAlpha') {
        expect(def.transform.source).toBe('ac2');
        expect(def.transform.hexAlpha).toBe('50');
      }
    });

    test('has selectionFg derived (copy of fg1)', () => {
      const spec = createVSCodeSpec();
      const def = spec.derived.find((d) => d.name === 'selectionFg')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('copy');
      if (def.transform.type === 'copy') {
        expect(def.transform.source).toBe('fg1');
      }
    });

    test('has lineHighlight derived (withHexAlpha from ac1, "50")', () => {
      const spec = createVSCodeSpec();
      const def = spec.derived.find((d) => d.name === 'lineHighlight')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('withHexAlpha');
      if (def.transform.type === 'withHexAlpha') {
        expect(def.transform.source).toBe('ac1');
        expect(def.transform.hexAlpha).toBe('50');
      }
    });

    test('has findMatch derived (withHexAlpha from ac2, "4d")', () => {
      const spec = createVSCodeSpec();
      const def = spec.derived.find((d) => d.name === 'findMatch')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('withHexAlpha');
      if (def.transform.type === 'withHexAlpha') {
        expect(def.transform.source).toBe('ac2');
        expect(def.transform.hexAlpha).toBe('4d');
      }
    });

    test('has ac1Fg adaptive foreground for ac1 backgrounds', () => {
      const spec = createVSCodeSpec();
      const def = spec.derived.find((d) => d.name === 'ac1Fg')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('adaptiveFg');
      if (def.transform.type === 'adaptiveFg') {
        expect(def.transform.background).toBe('ac1');
      }
    });

    test('has ac2Fg adaptive foreground for ac2 backgrounds', () => {
      const spec = createVSCodeSpec();
      const def = spec.derived.find((d) => d.name === 'ac2Fg')!;
      expect(def).toBeDefined();
      expect(def.transform.type).toBe('adaptiveFg');
      if (def.transform.type === 'adaptiveFg') {
        expect(def.transform.background).toBe('ac2');
      }
    });

    test('has infoFg, warningFg, errorFg, successFg adaptive foregrounds', () => {
      const spec = createVSCodeSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      for (const n of ['infoFg', 'warningFg', 'errorFg', 'successFg']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has NO cursorText — that is Zed-specific', () => {
      const spec = createVSCodeSpec();
      expect(spec.derived.some((d) => d.name === 'cursorText')).toBe(false);
    });
  });

  describe('contrast constraints', () => {
    test('fg1 defaults to 7.5 contrast vs bg1', () => {
      const spec = createVSCodeSpec();
      const c = spec.constraints.find((c) => c.role === 'fg1' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(7.5, 3);
    });

    test('contrastFg option overrides fg1 constraint', () => {
      const spec = createVSCodeSpec({ contrastFg: 5.5 });
      const c = spec.constraints.find((c) => c.role === 'fg1' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('fg2 is fixed at 5.5 contrast vs bg1', () => {
      const spec = createVSCodeSpec();
      const c = spec.constraints.find((c) => c.role === 'fg2' && c.against === 'bg1')!;
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('ac1 and ac2 have 2.5 minimum contrast vs bg1', () => {
      const spec = createVSCodeSpec();
      const ac1 = spec.constraints.find((c) => c.role === 'ac1')!;
      const ac2 = spec.constraints.find((c) => c.role === 'ac2')!;
      expect(ac1.min).toBeCloseTo(2.5, 3);
      expect(ac2.min).toBeCloseTo(2.5, 3);
    });

    test('comment has min 2.5 (dark default)', () => {
      const spec = createVSCodeSpec();
      const c = spec.constraints.find((c) => c.role === 'comment')!;
      expect(c.min).toBeCloseTo(2.5, 3);
    });

    test('comment has max 3.5 (dark default)', () => {
      const spec = createVSCodeSpec();
      const c = spec.constraints.find((c) => c.role === 'comment')!;
      expect(c.max).toBeCloseTo(3.5, 3);
    });

    test('comment is the only constraint with a max value', () => {
      const spec = createVSCodeSpec();
      const withMax = spec.constraints.filter((c) => c.max !== undefined);
      expect(withMax.length).toBe(1);
      expect(withMax[0].role).toBe('comment');
    });

    test('commentMin / commentMax options override comment constraint', () => {
      const spec = createVSCodeSpec({ commentMin: 1.5, commentMax: 3.0 });
      const c = spec.constraints.find((c) => c.role === 'comment')!;
      expect(c.min).toBeCloseTo(1.5, 3);
      expect(c.max).toBeCloseTo(3.0, 3);
    });

    test('keyword has 5.5 minimum (contrastSyntax default)', () => {
      const spec = createVSCodeSpec();
      const c = spec.constraints.find((c) => c.role === 'keyword')!;
      expect(c.min).toBeCloseTo(5.5, 3);
    });

    test('function, variable, type have 5.5 minimum (contrastSyntax default)', () => {
      const spec = createVSCodeSpec();
      for (const name of ['function', 'variable', 'type']) {
        const c = spec.constraints.find((c) => c.role === name)!;
        expect(c.min).toBeCloseTo(5.5, 3);
      }
    });

    test('contrastSyntax option overrides all syntax constraints', () => {
      const spec = createVSCodeSpec({ contrastSyntax: 4.5 });
      const c = spec.constraints.find((c) => c.role === 'keyword')!;
      expect(c.min).toBeCloseTo(4.5, 3);
    });

    test('all 8 ANSI base colors have 4.5 contrast constraint', () => {
      const spec = createVSCodeSpec();
      for (const name of ['ansiRed', 'ansiGreen', 'ansiBlue', 'ansiYellow',
                          'ansiMagenta', 'ansiCyan', 'ansiBlack', 'ansiWhite']) {
        const c = spec.constraints.find((c) => c.role === name)!;
        expect(c.min).toBeCloseTo(4.5, 3);
      }
    });

    test('no cursor constraint — VSCode has no cursor role', () => {
      const spec = createVSCodeSpec();
      expect(spec.constraints.some((c) => c.role === 'cursor')).toBe(false);
    });
  });

  describe('extraction integration', () => {
    test('extract produces a valid dark palette', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      expect(palette.spec).toBe('vscode');
      expect(palette.mode).toBe('dark');
    });

    test('extract produces a valid light palette', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'light', { randomSeed: 42 });
      expect(palette.spec).toBe('vscode');
      expect(palette.mode).toBe('light');
    });

    test('bg1 is dark in dark mode (L ≤ 0.35)', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('bg1')!.oklch.l).toBeLessThanOrEqual(0.35);
    });

    test('bg1 is light in light mode (L ≥ 0.93)', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'light', { randomSeed: 42 });
      expect(palette.get('bg1')!.oklch.l).toBeGreaterThanOrEqual(0.93);
    });

    test('all 42 syntax roles are present in the palette', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      for (const name of SYNTAX_ROLE_NAMES) {
        expect(palette.get(name)).toBeDefined();
      }
    });

    test('selectionBg has an alpha component (hex length > 7)', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      const hex = palette.hex('selectionBg');
      expect(hex.length).toBeGreaterThan(7);
    });

    test('lineHighlight has an alpha component (hex length > 7)', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      const hex = palette.hex('lineHighlight');
      expect(hex.length).toBeGreaterThan(7);
    });

    test('findMatch has an alpha component (hex length > 7)', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      const hex = palette.hex('findMatch');
      expect(hex.length).toBeGreaterThan(7);
    });

    test('ac1Fg is present in the palette', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('ac1Fg')).toBeDefined();
    });

    test('ac2Fg is present in the palette', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('ac2Fg')).toBeDefined();
    });

    test('infoFg / warningFg / errorFg / successFg all present', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      for (const name of ['infoFg', 'warningFg', 'errorFg', 'successFg']) {
        expect(palette.get(name)).toBeDefined();
      }
    });

    test('ac1Fg equals either fg1 or fg3 from the palette', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      const ac1FgHex = palette.hex('ac1Fg');
      const fg1Hex   = palette.hex('fg1');
      const fg3Hex   = palette.hex('fg3');
      expect([fg1Hex, fg3Hex]).toContain(ac1FgHex);
    });

    test('comment contrast vs bg1 is between 2.5 and 3.5 in dark mode', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      const commentHex = palette.hex('comment');
      const bg1Hex     = palette.hex('bg1');
      const c = wcagContrast(commentHex, bg1Hex);
      expect(c).toBeGreaterThanOrEqual(2.5);
      expect(c).toBeLessThanOrEqual(3.5);
    });

    test('comment contrast vs bg3 is between 2.5 and 3.5 in dark mode (dual-BG enforcement)', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      const commentHex = palette.hex('comment');
      const bg3Hex     = palette.hex('bg3');
      const c = wcagContrast(commentHex, bg3Hex);
      expect(c).toBeGreaterThanOrEqual(2.5);
      expect(c).toBeLessThanOrEqual(3.5);
    });

    test('ansiBrightRed is lighter than ansiRed in dark mode', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      const base   = palette.get('ansiRed')!.oklch.l;
      const bright = palette.get('ansiBrightRed')!.oklch.l;
      expect(bright).toBeGreaterThan(base);
    });

    test('all 8 bright ANSI roles are in the palette', () => {
      const palette = extract(makeCloud(), createVSCodeSpec(), 'dark', { randomSeed: 42 });
      for (const n of ['ansiBrightRed', 'ansiBrightGreen', 'ansiBrightBlue', 'ansiBrightWhite']) {
        expect(palette.get(n)).toBeDefined();
      }
    });

    test('same seed produces identical palettes (determinism)', () => {
      const cloud = makeCloud();
      const spec  = createVSCodeSpec();
      const p1 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      const p2 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      expect(p1.hex('bg1')).toBe(p2.hex('bg1'));
      expect(p1.hex('keyword')).toBe(p2.hex('keyword'));
      expect(p1.hex('comment')).toBe(p2.hex('comment'));
    });
  });

});

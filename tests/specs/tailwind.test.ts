import { describe, test, expect } from 'bun:test';
import { createTailwindSpec, DEFAULT_TAILWIND_FAMILIES } from '../../src/specs/tailwind.js';
import { extract } from '../../src/extract.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Test helpers ───────────────────────────────────────────────────────────────

/** Wide cloud with mid-L saturated colors (anchor territory) plus extremes */
function makeCloud(): OklchColor[] {
  const cloud: OklchColor[] = [];
  for (let h = 0; h < 360; h += 8) {
    cloud.push({ l: 0.50, c: 0.25, h }); // 500-level territory
    cloud.push({ l: 0.45, c: 0.01, h }); // neutral territory (low chroma)
    cloud.push({ l: 0.95, c: 0.01, h }); // for extrapolated light shades
    cloud.push({ l: 0.05, c: 0.01, h }); // for extrapolated dark shades
    // Semantic hue coverage
    cloud.push({ l: 0.50, c: 0.25, h: 130 }); // success green
    cloud.push({ l: 0.50, c: 0.25, h: 60  }); // warning amber
    cloud.push({ l: 0.50, c: 0.25, h: 10  }); // error red
  }
  return cloud;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('specs/tailwind', () => {

  describe('structure', () => {
    test('spec name is "tailwind"', () => {
      expect(createTailwindSpec().name).toBe('tailwind');
    });

    test('DEFAULT_TAILWIND_FAMILIES has 7 families', () => {
      expect(DEFAULT_TAILWIND_FAMILIES.length).toBe(7);
    });

    test('DEFAULT_TAILWIND_FAMILIES includes primary, secondary, accent, neutral, success, warning, error', () => {
      const set = new Set(DEFAULT_TAILWIND_FAMILIES);
      for (const f of ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error']) {
        expect(set.has(f as any)).toBe(true);
      }
    });

    test('default: 7 anchor roles (one per family)', () => {
      const spec = createTailwindSpec();
      expect(spec.roles.length).toBe(7);
    });

    test('anchor roles are named {family}500', () => {
      const spec = createTailwindSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const f of DEFAULT_TAILWIND_FAMILIES) {
        expect(names.has(`${f}500`)).toBe(true);
      }
    });

    test('custom families option overrides defaults', () => {
      const spec = createTailwindSpec({ families: ['brand', 'neutral'] });
      expect(spec.roles.length).toBe(2);
      const names = new Set(spec.roles.map((r) => r.name));
      expect(names.has('brand500')).toBe(true);
      expect(names.has('neutral500')).toBe(true);
      expect(names.has('primary500')).toBe(false);
    });

    test('neutral500 has near-zero chroma (achromatic)', () => {
      const spec = createTailwindSpec();
      const n500 = spec.roles.find((r) => r.name === 'neutral500')!;
      expect(n500.dark.c[1]).toBeLessThanOrEqual(0.03);
    });

    test('success500 has green hue constraint', () => {
      const spec = createTailwindSpec();
      const s500 = spec.roles.find((r) => r.name === 'success500')!;
      expect(s500.dark.h).toBeDefined();
      if (s500.dark.h) {
        expect(s500.dark.h[0]).toBe(90);
        expect(s500.dark.h[1]).toBe(170);
      }
    });

    test('warning500 has amber hue constraint', () => {
      const spec = createTailwindSpec();
      const w500 = spec.roles.find((r) => r.name === 'warning500')!;
      expect(w500.dark.h).toBeDefined();
      if (w500.dark.h) {
        expect(w500.dark.h[0]).toBe(33);
        expect(w500.dark.h[1]).toBe(100);
      }
    });

    test('error500 has red hue constraint (wrapping 350–30)', () => {
      const spec = createTailwindSpec();
      const e500 = spec.roles.find((r) => r.name === 'error500')!;
      expect(e500.dark.h).toBeDefined();
      if (e500.dark.h) {
        expect(e500.dark.h[0]).toBe(350);
        expect(e500.dark.h[1]).toBe(30);
      }
    });

    test('anchor roles target mid-lightness L [0.38, 0.62]', () => {
      const spec = createTailwindSpec();
      for (const role of spec.roles) {
        expect(role.dark.l[0]).toBeCloseTo(0.38, 3);
        expect(role.dark.l[1]).toBeCloseTo(0.62, 3);
      }
    });
  });

  describe('derived shade scale', () => {
    test('default: 7 families × 10 shades = 70 derived colors', () => {
      const spec = createTailwindSpec();
      expect(spec.derived.length).toBe(70);
    });

    test('each family has derived shades: 50, 100, 200, 300, 400, 600, 700, 800, 900, 950', () => {
      const spec = createTailwindSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      for (const shade of ['50', '100', '200', '300', '400', '600', '700', '800', '900', '950']) {
        expect(names.has(`primary${shade}`)).toBe(true);
        expect(names.has(`neutral${shade}`)).toBe(true);
      }
    });

    test('500 is NOT in derived — it is the assigned role itself', () => {
      const spec = createTailwindSpec();
      expect(spec.derived.some((d) => d.name === 'primary500')).toBe(false);
    });

    test('lighter shades have positive delta (50 is lightest)', () => {
      const spec = createTailwindSpec();
      const shade50 = spec.derived.find((d) => d.name === 'primary50')!;
      expect(shade50.transform.type).toBe('adjustLightness');
      if (shade50.transform.type === 'adjustLightness') {
        expect(shade50.transform.delta).toBeGreaterThan(0);
        expect(shade50.transform.source).toBe('primary500');
      }
    });

    test('darker shades have negative delta (950 is darkest)', () => {
      const spec = createTailwindSpec();
      const shade950 = spec.derived.find((d) => d.name === 'primary950')!;
      expect(shade950.transform.type).toBe('adjustLightness');
      if (shade950.transform.type === 'adjustLightness') {
        expect(shade950.transform.delta).toBeLessThan(0);
        expect(shade950.transform.source).toBe('primary500');
      }
    });

    test('shade 50 has larger positive delta than shade 100', () => {
      const spec = createTailwindSpec();
      const s50  = spec.derived.find((d) => d.name === 'primary50')!;
      const s100 = spec.derived.find((d) => d.name === 'primary100')!;
      if (s50.transform.type === 'adjustLightness' && s100.transform.type === 'adjustLightness') {
        expect(s50.transform.delta).toBeGreaterThan(s100.transform.delta);
      }
    });

    test('shade 950 has larger negative delta than shade 900', () => {
      const spec = createTailwindSpec();
      const s950 = spec.derived.find((d) => d.name === 'primary950')!;
      const s900 = spec.derived.find((d) => d.name === 'primary900')!;
      if (s950.transform.type === 'adjustLightness' && s900.transform.type === 'adjustLightness') {
        expect(s950.transform.delta).toBeLessThan(s900.transform.delta);
      }
    });

    test('all derived shades reference their family anchor as source', () => {
      const spec = createTailwindSpec();
      for (const family of DEFAULT_TAILWIND_FAMILIES) {
        const familyDerived = spec.derived.filter((d) => d.name.startsWith(family));
        for (const d of familyDerived) {
          if (d.transform.type === 'adjustLightness') {
            expect(d.transform.source).toBe(`${family}500`);
          }
        }
      }
    });

    test('custom families produce correct derived count', () => {
      const spec = createTailwindSpec({ families: ['brand', 'gray'] });
      expect(spec.derived.length).toBe(20); // 2 families × 10 shades
    });
  });

  describe('constraints', () => {
    test('has no contrast constraints (composable design tokens)', () => {
      const spec = createTailwindSpec();
      expect(spec.constraints.length).toBe(0);
    });
  });

  describe('extraction integration', () => {
    test('extract produces a valid dark palette', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'dark', { randomSeed: 42 });
      expect(palette.spec).toBe('tailwind');
      expect(palette.mode).toBe('dark');
    });

    test('extract produces a valid light palette', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'light', { randomSeed: 42 });
      expect(palette.spec).toBe('tailwind');
    });

    test('all 7 anchor colors (500-level) are in the palette', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'dark', { randomSeed: 42 });
      for (const family of DEFAULT_TAILWIND_FAMILIES) {
        expect(palette.get(`${family}500`)).toBeDefined();
      }
    });

    test('lighter shades have higher L than the 500-level anchor', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'dark', { randomSeed: 42 });
      const l500 = palette.get('primary500')!.oklch.l;
      const l50  = palette.get('primary50')!.oklch.l;
      const l100 = palette.get('primary100')!.oklch.l;
      expect(l50).toBeGreaterThan(l500);
      expect(l100).toBeGreaterThan(l500);
    });

    test('darker shades have lower L than the 500-level anchor', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'dark', { randomSeed: 42 });
      const l500 = palette.get('primary500')!.oklch.l;
      const l900 = palette.get('primary900')!.oklch.l;
      const l950 = palette.get('primary950')!.oklch.l;
      expect(l900).toBeLessThan(l500);
      expect(l950).toBeLessThan(l900);
    });

    test('shade scale is monotonically ordered (50 > 100 > ... > 900 > 950)', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'dark', { randomSeed: 42 });
      const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      const lValues = shades.map((s) => palette.get(`primary${s}`)!.oklch.l);
      for (let i = 0; i < lValues.length - 1; i++) {
        expect(lValues[i]).toBeGreaterThan(lValues[i + 1]);
      }
    });

    test('neutral shades maintain near-zero chroma (achromatic scale)', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'dark', { randomSeed: 42 });
      // The 500 anchor is achromatic; derived shades only adjust L, not C
      const neutralAnchor = palette.get('neutral500')!.oklch;
      expect(neutralAnchor.c).toBeLessThanOrEqual(0.035);
    });

    test('total palette entries: 7 anchors + 70 derived = 77', () => {
      const palette = extract(makeCloud(), createTailwindSpec(), 'dark', { randomSeed: 42 });
      // 7 anchor roles + 70 derived + fg1 and fg3 (used by adaptiveFg but spec has no adaptiveFg)
      // Actually: just count the roles in spec = 7 + derived = 70 = 77 total
      const allNames = Object.keys(palette.colors);
      expect(allNames.length).toBe(77);
    });

    test('same seed produces identical palettes (determinism)', () => {
      const cloud = makeCloud();
      const spec  = createTailwindSpec();
      const p1 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      const p2 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      expect(p1.hex('primary500')).toBe(p2.hex('primary500'));
      expect(p1.hex('primary50')).toBe(p2.hex('primary50'));
      expect(p1.hex('neutral500')).toBe(p2.hex('neutral500'));
    });
  });

});

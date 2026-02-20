import { describe, test, expect } from 'bun:test';
import { createBrandingSpec } from '../../src/specs/branding.js';
import { extract } from '../../src/extract.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Test helpers ───────────────────────────────────────────────────────────────

function makeCloud(): OklchColor[] {
  const cloud: OklchColor[] = [];
  for (let h = 0; h < 360; h += 12) {
    cloud.push({ l: 0.05, c: 0.01, h });  // near-black
    cloud.push({ l: 0.25, c: 0.01, h });  // dark neutral
    cloud.push({ l: 0.50, c: 0.01, h });  // mid neutral
    cloud.push({ l: 0.75, c: 0.01, h });  // light neutral
    cloud.push({ l: 0.95, c: 0.01, h });  // near-white
    cloud.push({ l: 0.55, c: 0.28, h });  // saturated brand color
  }
  return cloud;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('specs/branding', () => {

  describe('structure', () => {
    test('spec name is "branding"', () => {
      expect(createBrandingSpec().name).toBe('branding');
    });

    test('has core brand roles: brandPrimary, brandSecondary, brandAccent', () => {
      const spec = createBrandingSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['brandPrimary', 'brandSecondary', 'brandAccent']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('default neutralCount is 5 — neutral1 through neutral5', () => {
      const spec = createBrandingSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['neutral1', 'neutral2', 'neutral3', 'neutral4', 'neutral5']) {
        expect(names.has(n)).toBe(true);
      }
      expect(names.has('neutral6')).toBe(false);
    });

    test('neutralCount option controls number of neutral roles', () => {
      const spec3 = createBrandingSpec({ neutralCount: 3 });
      const names3 = new Set(spec3.roles.map((r) => r.name));
      expect(names3.has('neutral1')).toBe(true);
      expect(names3.has('neutral3')).toBe(true);
      expect(names3.has('neutral4')).toBe(false);

      const spec7 = createBrandingSpec({ neutralCount: 7 });
      const names7 = new Set(spec7.roles.map((r) => r.name));
      expect(names7.has('neutral7')).toBe(true);
    });

    test('total role count: 3 brand + 5 neutral = 8 (default)', () => {
      const spec = createBrandingSpec();
      expect(spec.roles.length).toBe(8);
    });

    test('total role count with neutralCount: 3 brand + N neutral', () => {
      expect(createBrandingSpec({ neutralCount: 3 }).roles.length).toBe(6);
      expect(createBrandingSpec({ neutralCount: 7 }).roles.length).toBe(10);
    });

    test('neutral1 has the highest L range (lightest)', () => {
      const spec = createBrandingSpec();
      const n1 = spec.roles.find((r) => r.name === 'neutral1')!;
      const n5 = spec.roles.find((r) => r.name === 'neutral5')!;
      // neutral1 should have higher L range than neutral5
      expect(n1.dark.l[0]).toBeGreaterThan(n5.dark.l[0]);
      expect(n1.dark.l[1]).toBeGreaterThan(n5.dark.l[1]);
    });

    test('neutral5 has the lowest L range (darkest)', () => {
      const spec = createBrandingSpec();
      const n5 = spec.roles.find((r) => r.name === 'neutral5')!;
      expect(n5.dark.l[0]).toBeCloseTo(0, 3);
    });

    test('all neutrals have near-zero chroma (achromatic, c ≤ 0.03)', () => {
      const spec = createBrandingSpec();
      for (const role of spec.roles.filter((r) => r.name.startsWith('neutral'))) {
        expect(role.dark.c[1]).toBeLessThanOrEqual(0.03);
      }
    });

    test('brand colors have high chroma (c ≥ 0.10)', () => {
      const spec = createBrandingSpec();
      for (const name of ['brandPrimary', 'brandSecondary', 'brandAccent']) {
        const role = spec.roles.find((r) => r.name === name)!;
        expect(role.dark.c[0]).toBeGreaterThanOrEqual(0.10);
      }
    });

    test('neutral L ranges divide [0,1] into equal bands', () => {
      const spec = createBrandingSpec({ neutralCount: 4 });
      const neutrals = spec.roles
        .filter((r) => r.name.startsWith('neutral'))
        .sort((a, b) => {
          const ia = parseInt(a.name.replace('neutral', ''));
          const ib = parseInt(b.name.replace('neutral', ''));
          return ia - ib;
        });
      expect(neutrals.length).toBe(4);
      // Each band should be 0.25 wide
      for (const n of neutrals) {
        const bandwidth = n.dark.l[1] - n.dark.l[0];
        expect(bandwidth).toBeCloseTo(0.25, 3);
      }
    });

    test('has no ANSI roles', () => {
      const spec = createBrandingSpec();
      const hasAnsi = spec.roles.some((r) => r.name.startsWith('ansi'));
      expect(hasAnsi).toBe(false);
    });
  });

  describe('derived colors', () => {
    test('has no derived colors — branding is compositional, text-on-accent is consumer responsibility', () => {
      const spec = createBrandingSpec();
      expect(spec.derived.length).toBe(0);
    });

    test('derived count is always 0 regardless of neutralCount', () => {
      expect(createBrandingSpec({ neutralCount: 3 }).derived.length).toBe(0);
      expect(createBrandingSpec({ neutralCount: 9 }).derived.length).toBe(0);
    });
  });

  describe('constraints', () => {
    test('has no contrast constraints (compositional palette)', () => {
      const spec = createBrandingSpec();
      expect(spec.constraints.length).toBe(0);
    });
  });

  describe('extraction integration', () => {
    test('extract produces a valid dark palette', () => {
      const palette = extract(makeCloud(), createBrandingSpec(), 'dark', { randomSeed: 42 });
      expect(palette.spec).toBe('branding');
      expect(palette.mode).toBe('dark');
    });

    test('extract produces a valid light palette', () => {
      const palette = extract(makeCloud(), createBrandingSpec(), 'light', { randomSeed: 42 });
      expect(palette.spec).toBe('branding');
      expect(palette.mode).toBe('light');
    });

    test('all brand colors are present in the palette', () => {
      const palette = extract(makeCloud(), createBrandingSpec(), 'dark', { randomSeed: 42 });
      for (const n of ['brandPrimary', 'brandSecondary', 'brandAccent']) {
        expect(palette.get(n)).toBeDefined();
      }
    });

    test('all 5 neutrals are present in the palette', () => {
      const palette = extract(makeCloud(), createBrandingSpec(), 'dark', { randomSeed: 42 });
      for (let i = 1; i <= 5; i++) {
        expect(palette.get(`neutral${i}`)).toBeDefined();
      }
    });

    test('neutral1 is lighter than neutral5 in the extracted palette', () => {
      const palette = extract(makeCloud(), createBrandingSpec(), 'dark', { randomSeed: 42 });
      const l1 = palette.get('neutral1')!.oklch.l;
      const l5 = palette.get('neutral5')!.oklch.l;
      expect(l1).toBeGreaterThan(l5);
    });

    test('neutral neutrals are near-achromatic (c ≤ 0.03)', () => {
      const palette = extract(makeCloud(), createBrandingSpec(), 'dark', { randomSeed: 42 });
      for (let i = 1; i <= 5; i++) {
        const c = palette.get(`neutral${i}`)!.oklch.c;
        expect(c).toBeLessThanOrEqual(0.035); // small tolerance
      }
    });

    test('no derived colors in palette (branding has no derived)', () => {
      const palette = extract(makeCloud(), createBrandingSpec(), 'dark', { randomSeed: 42 });
      // All palette entries are directly extracted role colors, none are derived
      const roleNames = new Set(['brandPrimary', 'brandSecondary', 'brandAccent',
        ...Array.from({ length: 5 }, (_, i) => `neutral${i + 1}`)]);
      for (const key of Object.keys(palette.colors)) {
        expect(roleNames.has(key)).toBe(true);
      }
    });

    test('custom neutralCount works end-to-end', () => {
      const palette = extract(makeCloud(), createBrandingSpec({ neutralCount: 3 }), 'dark', { randomSeed: 42 });
      for (let i = 1; i <= 3; i++) {
        expect(palette.get(`neutral${i}`)).toBeDefined();
      }
      expect(palette.get('neutral4')).toBeUndefined();
    });

    test('same seed produces identical palettes (determinism)', () => {
      const cloud = makeCloud();
      const spec  = createBrandingSpec();
      const p1 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      const p2 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      expect(p1.hex('brandPrimary')).toBe(p2.hex('brandPrimary'));
      expect(p1.hex('neutral3')).toBe(p2.hex('neutral3'));
    });
  });

});

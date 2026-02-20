import { describe, test, expect } from 'bun:test';
import { wcagContrast } from 'culori';
import { createShadcnSpec } from '../../src/specs/shadcn.js';
import { extract } from '../../src/extract.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Test helpers ───────────────────────────────────────────────────────────────

function makeCloud(): OklchColor[] {
  const cloud: OklchColor[] = [];
  for (let h = 0; h < 360; h += 10) {
    cloud.push({ l: 0.08, c: 0.02, h });
    cloud.push({ l: 0.97, c: 0.03, h });
    cloud.push({ l: 0.55, c: 0.25, h });
    cloud.push({ l: 0.15, c: 0.02, h }); // card-level darks
    cloud.push({ l: 0.50, c: 0.05, h }); // muted-foreground range
  }
  return cloud;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('specs/shadcn', () => {

  describe('structure', () => {
    test('spec name is "shadcn"', () => {
      expect(createShadcnSpec().name).toBe('shadcn');
    });

    test('has core roles: background, foreground, card, popover', () => {
      const spec = createShadcnSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['background', 'foreground', 'card', 'popover']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has semantic roles: primary, secondary, muted, accent, destructive', () => {
      const spec = createShadcnSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['primary', 'secondary', 'muted', 'accent', 'destructive']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has layout roles: border, input, ring', () => {
      const spec = createShadcnSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['border', 'input', 'ring']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('has mutedForeground role', () => {
      const spec = createShadcnSpec();
      expect(spec.roles.some((r) => r.name === 'mutedForeground')).toBe(true);
    });

    test('default chartColors is 5 (chart1–chart5)', () => {
      const spec = createShadcnSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      for (const n of ['chart1', 'chart2', 'chart3', 'chart4', 'chart5']) {
        expect(names.has(n)).toBe(true);
      }
      expect(names.has('chart6')).toBe(false);
    });

    test('chartColors option controls how many chart roles are created', () => {
      const spec = createShadcnSpec({ chartColors: 3 });
      const names = new Set(spec.roles.map((r) => r.name));
      expect(names.has('chart1')).toBe(true);
      expect(names.has('chart3')).toBe(true);
      expect(names.has('chart4')).toBe(false);
    });

    test('default includeSidebar is true — sidebar roles present', () => {
      const spec = createShadcnSpec();
      const names = new Set(spec.roles.map((r) => r.name));
      expect(names.has('sidebarBackground')).toBe(true);
      expect(names.has('sidebarAccent')).toBe(true);
    });

    test('includeSidebar: false removes sidebar roles', () => {
      const spec = createShadcnSpec({ includeSidebar: false });
      const names = new Set(spec.roles.map((r) => r.name));
      expect(names.has('sidebarBackground')).toBe(false);
      expect(names.has('sidebarAccent')).toBe(false);
    });

    test('role count with defaults: 13 base + 5 chart + 2 sidebar = 20', () => {
      const spec = createShadcnSpec();
      // background, foreground, card, popover, primary, secondary, muted,
      // mutedForeground, accent, destructive, border, input, ring = 13
      // + chart1-5 = 5
      // + sidebarBackground, sidebarAccent = 2
      expect(spec.roles.length).toBe(20);
    });

    test('role count without sidebar: 13 + 5 = 18', () => {
      const spec = createShadcnSpec({ includeSidebar: false });
      expect(spec.roles.length).toBe(18);
    });

    test('background has high priority (100)', () => {
      const spec = createShadcnSpec();
      const bg = spec.roles.find((r) => r.name === 'background')!;
      expect(bg.priority).toBe(100);
    });

    test('destructive has red hue constraint (wrapping 350–30)', () => {
      const spec = createShadcnSpec();
      const d = spec.roles.find((r) => r.name === 'destructive')!;
      expect(d.dark.h).toBeDefined();
      if (d.dark.h) {
        expect(d.dark.h[0]).toBe(350);
        expect(d.dark.h[1]).toBe(30);
      }
    });
  });

  describe('derived colors', () => {
    test('has cardForeground and popoverForeground (copies of foreground)', () => {
      const spec = createShadcnSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      expect(names.has('cardForeground')).toBe(true);
      expect(names.has('popoverForeground')).toBe(true);
    });

    test('cardForeground is a copy of foreground', () => {
      const spec = createShadcnSpec();
      const def = spec.derived.find((d) => d.name === 'cardForeground')!;
      expect(def.transform.type).toBe('copy');
      if (def.transform.type === 'copy') {
        expect(def.transform.source).toBe('foreground');
      }
    });

    test('has adaptive foregrounds: primaryForeground, secondaryForeground, accentForeground, destructiveForeground', () => {
      const spec = createShadcnSpec();
      const names = new Set(spec.derived.map((d) => d.name));
      for (const n of ['primaryForeground', 'secondaryForeground', 'accentForeground', 'destructiveForeground']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('primaryForeground uses adaptiveFg for primary', () => {
      const spec = createShadcnSpec();
      const def = spec.derived.find((d) => d.name === 'primaryForeground')!;
      expect(def.transform.type).toBe('adaptiveFg');
      if (def.transform.type === 'adaptiveFg') {
        expect(def.transform.background).toBe('primary');
      }
    });

    test('has sidebar derived colors when includeSidebar is true', () => {
      const spec = createShadcnSpec({ includeSidebar: true });
      const names = new Set(spec.derived.map((d) => d.name));
      for (const n of ['sidebarForeground', 'sidebarPrimary', 'sidebarPrimaryForeground',
                        'sidebarAccentForeground', 'sidebarBorder', 'sidebarRing']) {
        expect(names.has(n)).toBe(true);
      }
    });

    test('no sidebar derived when includeSidebar is false', () => {
      const spec = createShadcnSpec({ includeSidebar: false });
      const names = new Set(spec.derived.map((d) => d.name));
      expect(names.has('sidebarForeground')).toBe(false);
    });

    test('sidebarPrimary is a copy of primary', () => {
      const spec = createShadcnSpec();
      const def = spec.derived.find((d) => d.name === 'sidebarPrimary')!;
      expect(def.transform.type).toBe('copy');
      if (def.transform.type === 'copy') {
        expect(def.transform.source).toBe('primary');
      }
    });

    test('sidebarBorder is a copy of border', () => {
      const spec = createShadcnSpec();
      const def = spec.derived.find((d) => d.name === 'sidebarBorder')!;
      expect(def.transform.type).toBe('copy');
      if (def.transform.type === 'copy') {
        expect(def.transform.source).toBe('border');
      }
    });

    test('derived count with defaults: 6 base + 6 sidebar = 12', () => {
      const spec = createShadcnSpec();
      // cardForeground, popoverForeground, primaryForeground, secondaryForeground,
      // accentForeground, destructiveForeground = 6
      // sidebarForeground, sidebarPrimary, sidebarPrimaryForeground,
      // sidebarAccentForeground, sidebarBorder, sidebarRing = 6
      expect(spec.derived.length).toBe(12);
    });

    test('derived count without sidebar: 6', () => {
      const spec = createShadcnSpec({ includeSidebar: false });
      expect(spec.derived.length).toBe(6);
    });
  });

  describe('contrast constraints', () => {
    test('foreground has 7.5 minimum contrast vs background', () => {
      const spec = createShadcnSpec();
      const c = spec.constraints.find((c) => c.role === 'foreground' && c.against === 'background')!;
      expect(c.min).toBeCloseTo(7.5, 3);
    });

    test('primary and accent have 2.5 minimum contrast vs background', () => {
      const spec = createShadcnSpec();
      const primary = spec.constraints.find((c) => c.role === 'primary')!;
      const accent  = spec.constraints.find((c) => c.role === 'accent')!;
      expect(primary.min).toBeCloseTo(2.5, 3);
      expect(accent.min).toBeCloseTo(2.5, 3);
    });

    test('destructive has 4.5 minimum contrast vs background', () => {
      const spec = createShadcnSpec();
      const c = spec.constraints.find((c) => c.role === 'destructive')!;
      expect(c.min).toBeCloseTo(4.5, 3);
    });

    test('mutedForeground has min 3.0 and max 5.5 (medium contrast range)', () => {
      const spec = createShadcnSpec();
      const c = spec.constraints.find((c) => c.role === 'mutedForeground')!;
      expect(c.min).toBeCloseTo(3.0, 3);
      expect(c.max).toBeCloseTo(5.5, 3);
    });

    test('mutedForeground is the only constraint with a max value', () => {
      const spec = createShadcnSpec();
      const withMax = spec.constraints.filter((c) => c.max !== undefined);
      expect(withMax.length).toBe(1);
      expect(withMax[0].role).toBe('mutedForeground');
    });

    test('chart colors have 3.0 minimum contrast vs background', () => {
      const spec = createShadcnSpec();
      for (const name of ['chart1', 'chart2', 'chart3']) {
        const c = spec.constraints.find((c) => c.role === name)!;
        expect(c.min).toBeCloseTo(3.0, 3);
      }
    });
  });

  describe('extraction integration', () => {
    test('extract produces a valid dark palette', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      expect(palette.spec).toBe('shadcn');
      expect(palette.mode).toBe('dark');
    });

    test('extract produces a valid light palette', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'light', { randomSeed: 42 });
      expect(palette.spec).toBe('shadcn');
      expect(palette.mode).toBe('light');
    });

    test('background is dark in dark mode (L ≤ 0.20)', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      expect(palette.get('background')!.oklch.l).toBeLessThanOrEqual(0.20);
    });

    test('background is light in light mode (L ≥ 0.95)', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'light', { randomSeed: 42 });
      expect(palette.get('background')!.oklch.l).toBeGreaterThanOrEqual(0.95);
    });

    test('foreground contrast vs background is at least 7.5', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      expect(wcagContrast(palette.hex('foreground'), palette.hex('background'))).toBeGreaterThanOrEqual(7.5);
    });

    test('cardForeground matches foreground in the palette', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      expect(palette.hex('cardForeground')).toBe(palette.hex('foreground'));
    });

    test('popoverForeground matches foreground in the palette', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      expect(palette.hex('popoverForeground')).toBe(palette.hex('foreground'));
    });

    test('primaryForeground is either foreground or background (adaptive)', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      const primaryFgHex   = palette.hex('primaryForeground');
      const foregroundHex  = palette.hex('foreground');
      const backgroundHex  = palette.hex('background');
      expect([foregroundHex, backgroundHex]).toContain(primaryFgHex);
    });

    test('all chart colors are present in the palette', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      for (const name of ['chart1', 'chart2', 'chart3', 'chart4', 'chart5']) {
        expect(palette.get(name)).toBeDefined();
      }
    });

    test('sidebar roles are in the palette when includeSidebar is true', () => {
      const palette = extract(makeCloud(), createShadcnSpec({ includeSidebar: true }), 'dark', { randomSeed: 42 });
      expect(palette.get('sidebarBackground')).toBeDefined();
      expect(palette.get('sidebarForeground')).toBeDefined();
      expect(palette.get('sidebarPrimary')).toBeDefined();
    });

    test('sidebarPrimary matches primary in the palette', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      expect(palette.hex('sidebarPrimary')).toBe(palette.hex('primary'));
    });

    test('sidebarBorder matches border in the palette', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      expect(palette.hex('sidebarBorder')).toBe(palette.hex('border'));
    });

    test('mutedForeground contrast vs background is between 3.0 and 5.5', () => {
      const palette = extract(makeCloud(), createShadcnSpec(), 'dark', { randomSeed: 42 });
      const c = wcagContrast(palette.hex('mutedForeground'), palette.hex('background'));
      expect(c).toBeGreaterThanOrEqual(3.0);
      expect(c).toBeLessThanOrEqual(5.5);
    });

    test('same seed produces identical palettes (determinism)', () => {
      const cloud = makeCloud();
      const spec  = createShadcnSpec();
      const p1 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      const p2 = extract(cloud, spec, 'dark', { randomSeed: 7 });
      expect(p1.hex('background')).toBe(p2.hex('background'));
      expect(p1.hex('primary')).toBe(p2.hex('primary'));
    });
  });

});

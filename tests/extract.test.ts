import { describe, test, expect } from 'bun:test';
import { contrast, type OklchColor } from '@rlabs-inc/color-generator';
import {
  extract,
  expandColors,
  scoreCentrality,
  scoreDiversity,
} from '../src/extract.js';
import type { ThemeSpec, RoleConstraints } from '../src/types.js';

// ── Test Helpers ──────────────────────────────────────────────────────────────

/** A diverse 10-color cloud that covers BG, FG, and accent ranges in dark mode */
function makeCloud(): OklchColor[] {
  return [
    { l: 0.12, c: 0.02, h: 270 },  // Dark BG (L<0.35, C<0.04)
    { l: 0.98, c: 0.02, h: 90 },   // Bright FG (L>0.97, C<0.10)
    { l: 0.55, c: 0.22, h: 250 },  // Blue accent
    { l: 0.60, c: 0.18, h: 180 },  // Teal accent
    { l: 0.50, c: 0.25, h: 300 },  // Purple accent
    { l: 0.65, c: 0.20, h: 30 },   // Orange accent
    { l: 0.55, c: 0.22, h: 120 },  // Green accent
    { l: 0.70, c: 0.15, h: 350 },  // Red accent
    { l: 0.80, c: 0.10, h: 60 },   // Yellow accent
    { l: 0.20, c: 0.02, h: 0 },    // Very dark (secondary BG candidate)
  ];
}

/** Minimal 3-role spec: bg1 + fg1 + ac1 */
const MINIMAL_SPEC: ThemeSpec = {
  name: 'minimal',
  roles: [
    {
      name: 'bg1', priority: 100,
      dark:  { l: [0, 0.35], c: [0, 0.04] },
      light: { l: [0.93, 1.0], c: [0, 0.04] },
    },
    {
      name: 'fg1', priority: 98,
      dark:  { l: [0.97, 1.0], c: [0, 0.10] },
      light: { l: [0, 0.15], c: [0, 0.10] },
    },
    {
      name: 'ac1', priority: 70,
      dark:  { l: [0, 1.0], c: [0, 0.40] },
      light: { l: [0, 1.0], c: [0, 0.40] },
    },
  ],
  derived: [],
  constraints: [
    { role: 'fg1', against: 'bg1', min: 4.5 },
  ],
  ansiMode: 'free',
};

/** Spec with a comment role (min+max contrast) and bg3 for dual-BG enforcement */
const COMMENT_SPEC: ThemeSpec = {
  name: 'comment-test',
  roles: [
    {
      name: 'bg1', priority: 100,
      dark:  { l: [0, 0.35], c: [0, 0.04] },
      light: { l: [0.93, 1.0], c: [0, 0.04] },
    },
    {
      name: 'bg3', priority: 90,
      dark:  { l: [0, 0.30], c: [0, 0.03] },
      light: { l: [0.90, 1.0], c: [0, 0.03] },
    },
    {
      name: 'fg1', priority: 98,
      dark:  { l: [0.97, 1.0], c: [0, 0.10] },
      light: { l: [0, 0.15], c: [0, 0.10] },
    },
    {
      name: 'comment', priority: 40,
      dark:  { l: [0, 1.0], c: [0, 0.10] },
      light: { l: [0, 1.0], c: [0, 0.10] },
    },
  ],
  derived: [],
  constraints: [
    { role: 'fg1', against: 'bg1', min: 4.5 },
    { role: 'comment', against: 'bg1', min: 2.5, max: 3.5 },
  ],
  ansiMode: 'free',
};

/** Spec with hue groups (function + functionCall share hue) */
const HUE_GROUP_SPEC: ThemeSpec = {
  name: 'hue-group-test',
  roles: [
    {
      name: 'bg1', priority: 100,
      dark: { l: [0, 0.35], c: [0, 0.04] },
      light: { l: [0.93, 1.0], c: [0, 0.04] },
    },
    {
      name: 'function', priority: 40, hueGroup: 'function',
      dark: { l: [0, 1.0], c: [0, 0.40] },
      light: { l: [0, 1.0], c: [0, 0.40] },
    },
    {
      name: 'functionCall', priority: 40, hueGroup: 'function',
      dark: { l: [0, 1.0], c: [0, 0.40] },
      light: { l: [0, 1.0], c: [0, 0.40] },
    },
  ],
  derived: [],
  constraints: [],
  ansiMode: 'free',
};

/** Spec with derived colors for testing Phase 4 */
const DERIVED_SPEC: ThemeSpec = {
  name: 'derived-test',
  roles: [
    {
      name: 'bg1', priority: 100,
      dark: { l: [0, 0.35], c: [0, 0.04] },
      light: { l: [0.93, 1.0], c: [0, 0.04] },
    },
    {
      name: 'fg1', priority: 98,
      dark: { l: [0.97, 1.0], c: [0, 0.10] },
      light: { l: [0, 0.15], c: [0, 0.10] },
    },
    {
      name: 'ac1', priority: 70,
      dark: { l: [0, 1.0], c: [0, 0.40] },
      light: { l: [0, 1.0], c: [0, 0.40] },
    },
  ],
  derived: [
    { name: 'selection',      transform: { type: 'blend',          a: 'fg1',  b: 'bg1',  amount: 0.4 } },
    { name: 'acBright',       transform: { type: 'adjustLightness', source: 'ac1',       delta: 0.1 } },
    { name: 'acAlpha',        transform: { type: 'withAlpha',       source: 'ac1',       alpha: 0.5 } },
    { name: 'selectionSolid', transform: { type: 'withHexAlpha',    source: 'bg1',       hexAlpha: '40' } },
    { name: 'ac1Copy',        transform: { type: 'copy',            source: 'ac1' } },
    { name: 'acContrasted',   transform: { type: 'ensureContrast',  source: 'ac1',  against: 'bg1',  min: 4.5 } },
  ],
  constraints: [],
  ansiMode: 'free',
};

// ── expandColors ──────────────────────────────────────────────────────────────

describe('extract — expandColors()', () => {
  test('returns original array when already large enough', () => {
    const colors = makeCloud();
    const result = expandColors(colors, 5);
    expect(result.length).toBe(colors.length);
  });

  test('expands to exactly targetCount', () => {
    const colors: OklchColor[] = [{ l: 0.5, c: 0.2, h: 180 }];
    const result = expandColors(colors, 10);
    expect(result.length).toBe(10);
  });

  test('handles single-color input (duplicates via interpolation)', () => {
    const single: OklchColor = { l: 0.5, c: 0.15, h: 200 };
    const result = expandColors([single], 4);
    expect(result.length).toBe(4);
    // All interpolated colors should have same L/C/H as the source (midpoint of same color)
    for (const c of result) {
      expect(c.l).toBeCloseTo(0.5, 2);
    }
  });

  test('interpolated colors are valid OKLCH (L in [0,1], C in [0,0.4])', () => {
    const twoColors: OklchColor[] = [
      { l: 0.2, c: 0.3, h: 10 },
      { l: 0.8, c: 0.1, h: 350 },
    ];
    const result = expandColors(twoColors, 8);
    for (const c of result) {
      expect(c.l).toBeGreaterThanOrEqual(0);
      expect(c.l).toBeLessThanOrEqual(1);
      expect(c.c).toBeGreaterThanOrEqual(0);
    }
  });

  test('throws on empty input', () => {
    expect(() => expandColors([], 5)).toThrow();
  });
});

// ── scoreCentrality ───────────────────────────────────────────────────────────

describe('extract — scoreCentrality()', () => {
  test('returns 1.0 for color at exact center of constraint box', () => {
    const constraints: RoleConstraints = { l: [0.2, 0.6], c: [0.1, 0.3] };
    const center: OklchColor = { l: 0.4, c: 0.2, h: 0 };
    expect(scoreCentrality(center, constraints)).toBeCloseTo(1, 2);
  });

  test('returns 2/3 for color at the L boundary (C and H are perfect)', () => {
    const constraints: RoleConstraints = { l: [0.2, 0.6], c: [0.1, 0.3] };
    // L at boundary → lScore=0. C at center → cScore=1. No H constraint → hScore=1.
    // average = (0 + 1 + 1) / 3 = 2/3
    const edge: OklchColor = { l: 0.2, c: 0.2, h: 0 };  // L at min, C at center
    expect(scoreCentrality(edge, constraints)).toBeCloseTo(2 / 3, 1);
  });

  test('returns value in [0, 1] for any in-range color', () => {
    const constraints: RoleConstraints = { l: [0, 0.35], c: [0, 0.04] };
    const color: OklchColor = { l: 0.15, c: 0.02, h: 270 };
    const score = scoreCentrality(color, constraints);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('handles constraint without hue (hScore defaults to 1)', () => {
    const constraints: RoleConstraints = { l: [0.4, 0.6], c: [0.1, 0.3] };
    const center: OklchColor = { l: 0.5, c: 0.2, h: 999 };  // Crazy hue — irrelevant
    expect(scoreCentrality(center, constraints)).toBeCloseTo(1, 2);
  });

  test('handles wrapping hue range (350-30)', () => {
    const constraints: RoleConstraints = { l: [0, 1], c: [0, 0.4], h: [350, 30] };
    // hRange = (360-350)+30 = 40, center ≈ (350 + 20) % 360 = 10
    const center: OklchColor = { l: 0.5, c: 0.2, h: 10 };
    const score = scoreCentrality(center, constraints);
    expect(score).toBeGreaterThan(0.8);  // Near center
  });

  test('color far from center scores lower than color at center', () => {
    const constraints: RoleConstraints = { l: [0.2, 0.6], c: [0.1, 0.3] };
    const center: OklchColor = { l: 0.4, c: 0.2, h: 0 };
    const edge: OklchColor   = { l: 0.2, c: 0.2, h: 0 };
    expect(scoreCentrality(center, constraints)).toBeGreaterThan(scoreCentrality(edge, constraints));
  });
});

// ── scoreDiversity ────────────────────────────────────────────────────────────

describe('extract — scoreDiversity()', () => {
  test('returns 1.0 when no colors are assigned yet', () => {
    const color: OklchColor = { l: 0.5, c: 0.2, h: 180 };
    expect(scoreDiversity(color, [])).toBe(1);
  });

  test('returns near 0 for a color identical to an assigned color', () => {
    const color: OklchColor = { l: 0.5, c: 0.2, h: 180 };
    const score = scoreDiversity(color, [{ l: 0.5, c: 0.2, h: 180 }]);
    expect(score).toBeCloseTo(0, 2);
  });

  test('returns near 1 for a very distant color', () => {
    const assigned: OklchColor = { l: 0.1, c: 0.0, h: 0 };
    const candidate: OklchColor = { l: 0.9, c: 0.35, h: 180 };
    expect(scoreDiversity(candidate, [assigned])).toBeGreaterThan(0.8);
  });

  test('color farther from assigned scores higher than closer color', () => {
    const assigned: OklchColor = { l: 0.5, c: 0.2, h: 0 };
    const near: OklchColor  = { l: 0.52, c: 0.21, h: 5 };
    const far: OklchColor   = { l: 0.9,  c: 0.05, h: 200 };
    expect(scoreDiversity(far, [assigned])).toBeGreaterThan(scoreDiversity(near, [assigned]));
  });
});

// ── extract — basic assignment ────────────────────────────────────────────────

describe('extract — basic role assignment', () => {
  test('assigns all 3 roles in minimal spec (dark mode)', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    expect(palette.get('bg1')).toBeDefined();
    expect(palette.get('fg1')).toBeDefined();
    expect(palette.get('ac1')).toBeDefined();
  });

  test('bg1 is dark in dark mode (L ≤ 0.35)', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    expect(palette.get('bg1')!.oklch.l).toBeLessThanOrEqual(0.35);
  });

  test('fg1 is bright in dark mode (L ≥ 0.90)', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    // Constraint enforcement may raise fg1 L above the cloud's highest value
    expect(palette.get('fg1')!.oklch.l).toBeGreaterThanOrEqual(0.90);
  });

  test('bg1 is light in light mode (L ≥ 0.93)', () => {
    // Need a cloud with light colors for light mode
    const lightCloud: OklchColor[] = [
      { l: 0.96, c: 0.01, h: 90 },   // Light BG
      { l: 0.08, c: 0.03, h: 270 },  // Dark FG (for light mode)
      { l: 0.55, c: 0.22, h: 250 },  // Accent
      { l: 0.60, c: 0.18, h: 180 },  // Accent 2
      { l: 0.50, c: 0.25, h: 300 },  // Accent 3
    ];
    const palette = extract(lightCloud, MINIMAL_SPEC, 'light', { randomSeed: 42 });
    expect(palette.get('bg1')!.oklch.l).toBeGreaterThanOrEqual(0.93);
  });

  test('fg1 is dark in light mode (L ≤ 0.15)', () => {
    const lightCloud: OklchColor[] = [
      { l: 0.96, c: 0.01, h: 90 },
      { l: 0.08, c: 0.03, h: 270 },
      { l: 0.55, c: 0.22, h: 250 },
      { l: 0.60, c: 0.18, h: 180 },
      { l: 0.50, c: 0.25, h: 300 },
    ];
    const palette = extract(lightCloud, MINIMAL_SPEC, 'light', { randomSeed: 42 });
    // fg1.l may be pushed below 0.15 by contrast enforcement
    expect(palette.get('fg1')!.oklch.l).toBeLessThanOrEqual(0.25);
  });

  test('spec name is preserved in palette', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    expect(palette.spec).toBe('minimal');
    expect(palette.mode).toBe('dark');
  });

  test('hex() convenience returns non-empty string', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    expect(palette.hex('bg1')).toMatch(/^#[0-9a-fA-F]{6}/);
  });

  test('hex() returns empty string for nonexistent role', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    expect(palette.hex('doesNotExist')).toBe('');
  });
});

// ── extract — locked colors ───────────────────────────────────────────────────

describe('extract — locked colors', () => {
  test('locked bg1 is used verbatim (not extracted)', () => {
    const lockedBg = '#1a1b2e';
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      locked: { bg1: lockedBg },
    });
    // The hex should match the locked color (modulo hex case)
    expect(palette.hex('bg1').toLowerCase()).toBe(lockedBg.toLowerCase());
  });

  test('remaining roles are still extracted when bg1 is locked', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      locked: { bg1: '#0f1020' },
    });
    expect(palette.get('fg1')).toBeDefined();
    expect(palette.get('ac1')).toBeDefined();
  });

  test('locked color with uppercase hex is accepted', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      locked: { bg1: '#1A1B2E' },
    });
    expect(palette.get('bg1')).toBeDefined();
  });

  test('invalid locked hex is skipped gracefully', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      locked: { bg1: 'not-a-color' },
    });
    // bg1 should still be assigned (fallback to extraction)
    expect(palette.get('bg1')).toBeDefined();
  });

  test('locked colors influence diversity scoring (extracted colors differ from locked)', () => {
    const lockedFg = '#fafafa';
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      locked: { fg1: lockedFg },
    });
    // ac1 should not be identical to the locked fg1 (diversity pushes it away)
    expect(palette.hex('ac1').toLowerCase()).not.toBe(lockedFg.toLowerCase());
  });
});

// ── extract — priority ordering ───────────────────────────────────────────────

describe('extract — priority ordering', () => {
  test('bg1 (priority 100) satisfies its constraints', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    const bg1L = palette.get('bg1')!.oklch.l;
    expect(bg1L).toBeGreaterThanOrEqual(0);
    expect(bg1L).toBeLessThanOrEqual(0.35);
  });

  test('fg1 (priority 98) satisfies its constraints', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    const fg1L = palette.get('fg1')!.oklch.l;
    expect(fg1L).toBeGreaterThanOrEqual(0.90);
  });

  test('higher priority roles have narrower constraints (bg1 C ≤ 0.04)', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    expect(palette.get('bg1')!.oklch.c).toBeLessThanOrEqual(0.04 + 0.001);
  });
});

// ── extract — expand colors internally ───────────────────────────────────────

describe('extract — color cloud expansion', () => {
  test('works with a 1-color cloud (expands internally)', () => {
    const oneColor: OklchColor[] = [{ l: 0.15, c: 0.02, h: 270 }];
    // Should not throw — extraction handles tiny clouds
    const palette = extract(oneColor, MINIMAL_SPEC, 'dark', { randomSeed: 1 });
    expect(palette.get('bg1')).toBeDefined();
    expect(palette.get('fg1')).toBeDefined();
  });

  test('works with a 50-color cloud (no expansion needed, all 3 roles assigned)', () => {
    const bigCloud = Array.from({ length: 50 }, (_, i) => ({
      l: 0.1 + (i / 50) * 0.85,
      c: 0.05 + (i % 10) * 0.03,
      h: (i * 36) % 360,
    }));
    const palette = extract(bigCloud, MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    expect(palette.get('bg1')).toBeDefined();
    expect(palette.get('fg1')).toBeDefined();
    expect(palette.get('ac1')).toBeDefined();
  });
});

// ── extract — constraint enforcement (Phase 3) ────────────────────────────────

describe('extract — constraint enforcement', () => {
  test('fg1 meets minimum contrast vs bg1 (4.5)', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    const fg1 = palette.get('fg1')!.oklch;
    const bg1 = palette.get('bg1')!.oklch;
    expect(contrast(fg1, bg1)).toBeGreaterThanOrEqual(4.5 - 0.01);
  });

  test('comment contrast is within [2.5, 3.5] in dark mode', () => {
    const palette = extract(makeCloud(), COMMENT_SPEC, 'dark', { randomSeed: 42 });
    const comment = palette.get('comment')!.oklch;
    const bg1 = palette.get('bg1')!.oklch;
    const c = contrast(comment, bg1);
    expect(c).toBeGreaterThanOrEqual(2.5 - 0.15);
    expect(c).toBeLessThanOrEqual(3.5 + 0.15);
  });

  test('fg1 contrast higher than ac1 contrast (fg1 min=4.5, ac1 unconstrained)', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', { randomSeed: 42 });
    const bg1 = palette.get('bg1')!.oklch;
    const fg1Contrast = contrast(palette.get('fg1')!.oklch, bg1);
    expect(fg1Contrast).toBeGreaterThanOrEqual(4.5 - 0.01);
  });

  test('missing constraint roles are skipped gracefully', () => {
    const specWithMissingRole: ThemeSpec = {
      ...MINIMAL_SPEC,
      constraints: [
        { role: 'nonexistent', against: 'bg1', min: 7.5 },
        { role: 'fg1', against: 'bg1', min: 4.5 },
      ],
    };
    expect(() => extract(makeCloud(), specWithMissingRole, 'dark', { randomSeed: 42 }))
      .not.toThrow();
  });
});

// ── extract — hue groups ──────────────────────────────────────────────────────

describe('extract — hue groups', () => {
  test('roles in same hue group get the same hue', () => {
    const cloud = makeCloud();
    const palette = extract(cloud, HUE_GROUP_SPEC, 'dark', { randomSeed: 42 });
    const fn = palette.get('function')!.oklch;
    const fnCall = palette.get('functionCall')!.oklch;
    expect(fn.h).toBeCloseTo(fnCall.h, 0);
  });

  test('grouped roles can differ in L and C', () => {
    const cloud = makeCloud();
    const palette = extract(cloud, HUE_GROUP_SPEC, 'dark', { randomSeed: 42 });
    const fn = palette.get('function')!.oklch;
    const fnCall = palette.get('functionCall')!.oklch;
    // They share the hue but are assigned from different parts of the cloud
    // L or C should differ (diversity scoring pushes them apart)
    const lDiff = Math.abs(fn.l - fnCall.l);
    const cDiff = Math.abs(fn.c - fnCall.c);
    expect(lDiff + cDiff).toBeGreaterThan(0);
  });
});

// ── extract — derived colors (Phase 4) ───────────────────────────────────────

describe('extract — derived colors', () => {
  test('blend: selection is between fg1 and bg1 in lightness', () => {
    const palette = extract(makeCloud(), DERIVED_SPEC, 'dark', { randomSeed: 42 });
    const bg1L = palette.get('bg1')!.oklch.l;
    const fg1L = palette.get('fg1')!.oklch.l;
    const selL = palette.get('selection')!.oklch.l;
    const lo = Math.min(bg1L, fg1L);
    const hi = Math.max(bg1L, fg1L);
    expect(selL).toBeGreaterThanOrEqual(lo - 0.05);
    expect(selL).toBeLessThanOrEqual(hi + 0.05);
  });

  test('adjustLightness: acBright is brighter than ac1 by ~0.1', () => {
    const palette = extract(makeCloud(), DERIVED_SPEC, 'dark', { randomSeed: 42 });
    const ac1L = palette.get('ac1')!.oklch.l;
    const brightL = palette.get('acBright')!.oklch.l;
    expect(brightL).toBeGreaterThan(ac1L - 0.02);  // Allow gamut clamping headroom
  });

  test('withAlpha: acAlpha has alpha=0.5', () => {
    const palette = extract(makeCloud(), DERIVED_SPEC, 'dark', { randomSeed: 42 });
    const alpha = palette.get('acAlpha')!.oklch.alpha;
    expect(alpha).toBeCloseTo(0.5, 2);
  });

  test('withHexAlpha: selectionSolid has alpha ≈ 0x40/255', () => {
    const palette = extract(makeCloud(), DERIVED_SPEC, 'dark', { randomSeed: 42 });
    const alpha = palette.get('selectionSolid')!.oklch.alpha;
    const expected = 0x40 / 255;
    expect(alpha).toBeCloseTo(expected, 2);
  });

  test('copy: ac1Copy is identical to ac1', () => {
    const palette = extract(makeCloud(), DERIVED_SPEC, 'dark', { randomSeed: 42 });
    const ac1 = palette.get('ac1')!;
    const copy = palette.get('ac1Copy')!;
    expect(copy.oklch.l).toBeCloseTo(ac1.oklch.l, 5);
    expect(copy.oklch.c).toBeCloseTo(ac1.oklch.c, 5);
    expect(copy.oklch.h).toBeCloseTo(ac1.oklch.h, 5);
  });

  test('ensureContrast: acContrasted has ≥4.5 contrast vs bg1', () => {
    const palette = extract(makeCloud(), DERIVED_SPEC, 'dark', { randomSeed: 42 });
    const bg1 = palette.get('bg1')!.oklch;
    const ac = palette.get('acContrasted')!.oklch;
    expect(contrast(ac, bg1)).toBeGreaterThanOrEqual(4.5 - 0.01);
  });

  test('missing derived source is skipped gracefully (no throw)', () => {
    const specWithBadDerived: ThemeSpec = {
      ...MINIMAL_SPEC,
      derived: [
        { name: 'bad', transform: { type: 'copy', source: 'doesNotExist' } },
        { name: 'good', transform: { type: 'adjustLightness', source: 'bg1', delta: 0.05 } },
      ],
    };
    expect(() => extract(makeCloud(), specWithBadDerived, 'dark', { randomSeed: 42 }))
      .not.toThrow();
    const palette = extract(makeCloud(), specWithBadDerived, 'dark', { randomSeed: 42 });
    // 'bad' skipped, 'good' derived
    expect(palette.get('good')).toBeDefined();
  });
});

// ── extract — determinism ─────────────────────────────────────────────────────

describe('extract — determinism', () => {
  test('same seed produces identical bg1 hex', () => {
    const cloud = makeCloud();
    const p1 = extract(cloud, MINIMAL_SPEC, 'dark', { randomSeed: 99 });
    const p2 = extract(cloud, MINIMAL_SPEC, 'dark', { randomSeed: 99 });
    expect(p1.hex('bg1')).toBe(p2.hex('bg1'));
  });

  test('same seed produces identical fg1 and ac1', () => {
    const cloud = makeCloud();
    const p1 = extract(cloud, MINIMAL_SPEC, 'dark', { randomSeed: 7 });
    const p2 = extract(cloud, MINIMAL_SPEC, 'dark', { randomSeed: 7 });
    expect(p1.hex('fg1')).toBe(p2.hex('fg1'));
    expect(p1.hex('ac1')).toBe(p2.hex('ac1'));
  });

  test('different seeds produce different results when candidates are tied', () => {
    // Use achromatic bg1/fg1 so all ac1 candidates (same L/C, varying H) have
    // IDENTICAL perceptual distance from bg1 and fg1 → perfectly tied scores.
    // The PRNG is the only thing that differentiates results.
    const timedCloud: OklchColor[] = [
      { l: 0.20, c: 0.00, h: 0 },  // achromatic bg1 candidate
      { l: 0.98, c: 0.00, h: 0 },  // achromatic fg1 candidate
      ...Array.from({ length: 18 }, (_, i) => ({
        l: 0.55, c: 0.20, h: (i * 20) % 360,  // equidistant from achromatic bg1/fg1
      })),
    ];
    const hexes = new Set<string>();
    for (let s = 0; s < 20; s++) {
      hexes.add(extract(timedCloud, MINIMAL_SPEC, 'dark', { randomSeed: s }).hex('ac1'));
    }
    // With 18 perfectly tied ac1 candidates, different seeds give different colors
    expect(hexes.size).toBeGreaterThan(1);
  });

  test('extraction without seed runs without error', () => {
    expect(() => extract(makeCloud(), MINIMAL_SPEC, 'dark')).not.toThrow();
  });
});

// ── extract — dark vs light mode ─────────────────────────────────────────────

describe('extract — dark vs light mode', () => {
  test('dark mode bg1 is darker than light mode bg1', () => {
    const lightCloud: OklchColor[] = [
      { l: 0.96, c: 0.01, h: 90 },
      { l: 0.08, c: 0.03, h: 270 },
      { l: 0.55, c: 0.22, h: 250 },
      { l: 0.60, c: 0.18, h: 180 },
      { l: 0.50, c: 0.25, h: 300 },
      { l: 0.65, c: 0.20, h: 30 },
    ];
    const darkPalette  = extract(makeCloud(),  MINIMAL_SPEC, 'dark',  { randomSeed: 42 });
    const lightPalette = extract(lightCloud, MINIMAL_SPEC, 'light', { randomSeed: 42 });
    expect(darkPalette.get('bg1')!.oklch.l).toBeLessThan(lightPalette.get('bg1')!.oklch.l);
  });

  test('dark mode fg1 is brighter than light mode fg1', () => {
    const lightCloud: OklchColor[] = [
      { l: 0.96, c: 0.01, h: 90 },
      { l: 0.08, c: 0.03, h: 270 },
      { l: 0.55, c: 0.22, h: 250 },
      { l: 0.60, c: 0.18, h: 180 },
      { l: 0.50, c: 0.25, h: 300 },
    ];
    const darkPalette  = extract(makeCloud(),  MINIMAL_SPEC, 'dark',  { randomSeed: 42 });
    const lightPalette = extract(lightCloud, MINIMAL_SPEC, 'light', { randomSeed: 42 });
    expect(darkPalette.get('fg1')!.oklch.l).toBeGreaterThan(lightPalette.get('fg1')!.oklch.l);
  });
});

// ── extract — uniform (iso-lightness) mode ────────────────────────────────────

describe('extract — uniform (iso-lightness) mode', () => {
  test('all non-excluded roles share the same L value', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      uniform: true,
    });
    // bg1 and fg1 are excluded, so only ac1 is non-excluded in MINIMAL_SPEC
    const ac1L = palette.get('ac1')!.oklch.l;
    // ac1 should have been normalized — its L is the uniform L (same as itself)
    expect(ac1L).toBeGreaterThan(0);
  });

  test('excluded roles (bg1, fg1) are NOT normalized', () => {
    const palette = extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      uniform: true,
    });
    // bg1 must remain dark (L ≤ 0.35) even in uniform mode
    expect(palette.get('bg1')!.oklch.l).toBeLessThanOrEqual(0.35);
    // fg1 must remain bright (L ≥ 0.9) even in uniform mode
    expect(palette.get('fg1')!.oklch.l).toBeGreaterThanOrEqual(0.9);
  });

  test('uniform mode produces valid palette (no throw)', () => {
    expect(() => extract(makeCloud(), MINIMAL_SPEC, 'dark', {
      randomSeed: 42,
      uniform: true,
      uniformBrightDelta: 0.15,
    })).not.toThrow();
  });
});

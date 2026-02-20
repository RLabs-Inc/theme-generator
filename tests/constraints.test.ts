import { describe, test, expect } from 'bun:test';
import { contrast, type OklchColor } from '@rlabs-inc/color-generator';
import {
  ANSI_HUE_RANGES,
  UI_ROLES,
  STATUS_ROLES,
  SYNTAX_ROLE_NAMES,
  SYNTAX_HUE_GROUPS,
  buildSyntaxRoles,
  buildAnsiRolesFree,
  buildAnsiRolesConstrained,
  buildDefaultConstraints,
  getActiveConstraints,
  satisfiesConstraints,
  projectIntoConstraints,
  enforceContrast,
  enforceCommentContrast,
} from '../src/constraints.js';

// ── Test Helpers ────────────────────────────────────────────────────────────

const darkBg: OklchColor = { l: 0.15, c: 0.02, h: 270 };
const lightBg: OklchColor = { l: 0.95, c: 0.01, h: 90 };
const brightFg: OklchColor = { l: 0.95, c: 0.03, h: 200 };
const darkFg: OklchColor = { l: 0.10, c: 0.03, h: 200 };
const midColor: OklchColor = { l: 0.50, c: 0.15, h: 150 };

// ── Role Definitions ────────────────────────────────────────────────────────

describe('constraints — UI_ROLES', () => {
  test('has 9 roles', () => {
    expect(UI_ROLES).toHaveLength(9);
  });

  test('bg1 has highest priority', () => {
    const bg1 = UI_ROLES.find((r) => r.name === 'bg1')!;
    expect(bg1.priority).toBe(100);
  });

  test('all roles have valid dark L ranges', () => {
    for (const role of UI_ROLES) {
      expect(role.dark.l[0]).toBeGreaterThanOrEqual(0);
      expect(role.dark.l[1]).toBeLessThanOrEqual(1);
      expect(role.dark.l[0]).toBeLessThanOrEqual(role.dark.l[1]);
    }
  });

  test('all roles have valid light L ranges', () => {
    for (const role of UI_ROLES) {
      expect(role.light.l[0]).toBeGreaterThanOrEqual(0);
      expect(role.light.l[1]).toBeLessThanOrEqual(1);
      expect(role.light.l[0]).toBeLessThanOrEqual(role.light.l[1]);
    }
  });

  test('all roles have valid C ranges', () => {
    for (const role of UI_ROLES) {
      expect(role.dark.c[0]).toBeGreaterThanOrEqual(0);
      expect(role.dark.c[1]).toBeLessThanOrEqual(0.40);
      expect(role.light.c[0]).toBeGreaterThanOrEqual(0);
      expect(role.light.c[1]).toBeLessThanOrEqual(0.40);
    }
  });

  test('bg1 L ranges match RLabs calibrated values', () => {
    const bg1 = UI_ROLES.find((r) => r.name === 'bg1')!;
    // RLabs uses [0, 35%] dark / [93, 100%] light
    expect(bg1.dark.l[0]).toBe(0);
    expect(bg1.dark.l[1]).toBe(0.35);
    expect(bg1.light.l[0]).toBe(0.93);
    expect(bg1.light.l[1]).toBe(1.0);
  });

  test('fg1 and fg2 L ranges match RLabs calibrated values', () => {
    const fg1 = UI_ROLES.find((r) => r.name === 'fg1')!;
    const fg2 = UI_ROLES.find((r) => r.name === 'fg2')!;
    // RLabs dark: fg1=[97,100%], fg2=[95,100%] — near-white foregrounds only
    expect(fg1.dark.l[0]).toBe(0.97);
    expect(fg1.dark.l[1]).toBe(1.0);
    expect(fg2.dark.l[0]).toBe(0.95);
    expect(fg2.dark.l[1]).toBe(1.0);
    // Light: fg1=[0,15%], fg2=[0,30%] — near-black
    expect(fg1.light.l[1]).toBe(0.15);
    expect(fg2.light.l[1]).toBe(0.30);
  });

  test('fg3 is inverted (near-bg in both modes — disabled/placeholder)', () => {
    const fg3 = UI_ROLES.find((r) => r.name === 'fg3')!;
    // Dark: near-dark (blends with bg) | Light: near-light (blends with bg)
    expect(fg3.dark.l[1]).toBeLessThanOrEqual(0.30);
    expect(fg3.light.l[0]).toBeGreaterThanOrEqual(0.85);
  });
});

describe('constraints — STATUS_ROLES', () => {
  test('has 4 roles (info, error, warning, success)', () => {
    expect(STATUS_ROLES).toHaveLength(4);
    const names = STATUS_ROLES.map((r) => r.name);
    expect(names).toContain('info');
    expect(names).toContain('error');
    expect(names).toContain('warning');
    expect(names).toContain('success');
  });

  test('all status roles have hue constraints', () => {
    for (const role of STATUS_ROLES) {
      expect(role.dark.h).toBeDefined();
      expect(role.light.h).toBeDefined();
    }
  });

  test('info is in blue hue range', () => {
    const info = STATUS_ROLES.find((r) => r.name === 'info')!;
    expect(info.dark.h![0]).toBeGreaterThanOrEqual(200);
    expect(info.dark.h![1]).toBeLessThanOrEqual(280);
  });
});

describe('constraints — SYNTAX_ROLE_NAMES', () => {
  test('has 42+ role names', () => {
    expect(SYNTAX_ROLE_NAMES.length).toBeGreaterThanOrEqual(42);
  });

  test('includes all critical syntax roles', () => {
    const names = [...SYNTAX_ROLE_NAMES];
    expect(names).toContain('comment');
    expect(names).toContain('keyword');
    expect(names).toContain('function');
    expect(names).toContain('variable');
    expect(names).toContain('type');
    expect(names).toContain('string');
    expect(names).toContain('operator');
    expect(names).toContain('tag');
    expect(names).toContain('punctuation');
    expect(names).toContain('controlFlow');
    expect(names).toContain('controlImport');
    expect(names).toContain('tagPunctuation');
    expect(names).toContain('supportFunction');
  });
});

describe('constraints — buildSyntaxRoles()', () => {
  test('returns same count as SYNTAX_ROLE_NAMES', () => {
    const roles = buildSyntaxRoles();
    expect(roles).toHaveLength(SYNTAX_ROLE_NAMES.length);
  });

  test('all syntax roles have priority 40', () => {
    const roles = buildSyntaxRoles();
    for (const role of roles) {
      expect(role.priority).toBe(40);
    }
  });

  test('non-comment syntax roles allow full L and C range', () => {
    const roles = buildSyntaxRoles().filter((r) => r.name !== 'comment');
    for (const role of roles) {
      expect(role.dark.l).toEqual([0, 1.0]);
      expect(role.dark.c).toEqual([0, 0.40]);
    }
  });

  test('comment role has low chroma constraint (muted appearance)', () => {
    const roles = buildSyntaxRoles();
    const comment = roles.find((r) => r.name === 'comment')!;
    expect(comment).toBeDefined();
    // Comment must be near-achromatic: C max ≤ 0.10
    expect(comment.dark.c[1]).toBeLessThanOrEqual(0.10);
    expect(comment.light.c[1]).toBeLessThanOrEqual(0.10);
    // L still full range — contrast enforcement handles final placement
    expect(comment.dark.l).toEqual([0, 1.0]);
    expect(comment.light.l).toEqual([0, 1.0]);
    // Comment has no hueGroup — it's achromatic, hue is irrelevant
    expect(comment.hueGroup).toBeUndefined();
  });

  test('related roles share hueGroup (function/functionCall, method/methodCall, etc.)', () => {
    const roles = buildSyntaxRoles();
    const byName = Object.fromEntries(roles.map((r) => [r.name, r]));

    // Function family
    expect(byName['function'].hueGroup).toBe('function');
    expect(byName['functionCall'].hueGroup).toBe('function');

    // Method family — distinct from function
    expect(byName['method'].hueGroup).toBe('method');
    expect(byName['methodCall'].hueGroup).toBe('method');
    expect(byName['method'].hueGroup).not.toBe(byName['function'].hueGroup);

    // Variable family
    expect(byName['variable'].hueGroup).toBe('variable');
    expect(byName['variableReadonly'].hueGroup).toBe('variable');
    expect(byName['variableDeclaration'].hueGroup).toBe('variable');

    // Property family
    expect(byName['property'].hueGroup).toBe('property');
    expect(byName['propertyDeclaration'].hueGroup).toBe('property');
    expect(byName['variableProperty'].hueGroup).toBe('property');

    // Support family
    expect(byName['support'].hueGroup).toBe('support');
    expect(byName['supportFunction'].hueGroup).toBe('support');
    expect(byName['supportMethod'].hueGroup).toBe('support');
    expect(byName['supportVariable'].hueGroup).toBe('support');
    expect(byName['supportProperty'].hueGroup).toBe('support');

    // Control family
    expect(byName['control'].hueGroup).toBe('control');
    expect(byName['controlFlow'].hueGroup).toBe('control');
    expect(byName['controlImport'].hueGroup).toBe('control');

    // Tag family
    expect(byName['tag'].hueGroup).toBe('tag');
    expect(byName['tagPunctuation'].hueGroup).toBe('tag');

    // Punctuation family
    expect(byName['punctuation'].hueGroup).toBe('punctuation');
    expect(byName['punctuationQuote'].hueGroup).toBe('punctuation');
    expect(byName['punctuationBrace'].hueGroup).toBe('punctuation');
    expect(byName['punctuationComma'].hueGroup).toBe('punctuation');

    // Storage/modifier family
    expect(byName['storage'].hueGroup).toBe('storage');
    expect(byName['modifier'].hueGroup).toBe('storage');
  });

  test('independent roles have no hueGroup (each gets its own hue)', () => {
    const roles = buildSyntaxRoles();
    const byName = Object.fromEntries(roles.map((r) => [r.name, r]));
    // These roles are unique enough to warrant independent hues
    expect(byName['keyword'].hueGroup).toBeUndefined();
    expect(byName['operator'].hueGroup).toBeUndefined();
    expect(byName['class'].hueGroup).toBeUndefined();
    expect(byName['constant'].hueGroup).toBeUndefined();
    expect(byName['selector'].hueGroup).toBeUndefined();
    expect(byName['string'].hueGroup).toBeUndefined();
    expect(byName['attribute'].hueGroup).toBeUndefined();
  });

  test('SYNTAX_HUE_GROUPS covers all grouped roles', () => {
    // Every grouped role in buildSyntaxRoles should appear in SYNTAX_HUE_GROUPS
    const roles = buildSyntaxRoles();
    for (const role of roles) {
      if (role.hueGroup) {
        expect(SYNTAX_HUE_GROUPS[role.name as keyof typeof SYNTAX_HUE_GROUPS]).toBe(role.hueGroup);
      }
    }
  });
});

describe('constraints — buildAnsiRoles', () => {
  test('free mode returns 8 roles without hue constraints', () => {
    const roles = buildAnsiRolesFree();
    expect(roles).toHaveLength(8);
    for (const role of roles) {
      expect(role.dark.h).toBeUndefined();
      expect(role.light.h).toBeUndefined();
    }
  });

  test('constrained mode returns 8 roles', () => {
    const roles = buildAnsiRolesConstrained();
    expect(roles).toHaveLength(8);
  });

  test('constrained ansiRed has wrapping hue range', () => {
    const roles = buildAnsiRolesConstrained();
    const red = roles.find((r) => r.name === 'ansiRed')!;
    expect(red.dark.h).toBeDefined();
    expect(red.dark.h![0]).toBe(350);
    expect(red.dark.h![1]).toBe(30);
  });

  test('constrained ansiBlack/ansiWhite have lightness constraints (no hue)', () => {
    const roles = buildAnsiRolesConstrained();
    const black = roles.find((r) => r.name === 'ansiBlack')!;
    const white = roles.find((r) => r.name === 'ansiWhite')!;
    expect(black.dark.h).toBeUndefined();
    expect(white.dark.h).toBeUndefined();
    expect(black.dark.l[1]).toBeLessThan(0.2); // Dark end
    expect(white.dark.l[0]).toBeGreaterThan(0.8); // Light end
  });

  test('all ANSI roles have priority 45', () => {
    const roles = buildAnsiRolesFree();
    for (const role of roles) {
      expect(role.priority).toBe(45);
    }
  });
});

describe('constraints — ANSI_HUE_RANGES', () => {
  test('has 8 ANSI entries', () => {
    expect(Object.keys(ANSI_HUE_RANGES)).toHaveLength(8);
  });

  test('black and white have null (by lightness)', () => {
    expect(ANSI_HUE_RANGES.ansiBlack).toBeNull();
    expect(ANSI_HUE_RANGES.ansiWhite).toBeNull();
  });

  test('colored ANSI have defined ranges', () => {
    expect(ANSI_HUE_RANGES.ansiRed).toEqual([350, 30]);
    expect(ANSI_HUE_RANGES.ansiGreen).toEqual([90, 160]);
    expect(ANSI_HUE_RANGES.ansiBlue).toEqual([200, 270]);
  });
});

// ── Constraint Enforcement ──────────────────────────────────────────────────

describe('constraints — buildDefaultConstraints()', () => {
  test('dark mode generates constraints', () => {
    const constraints = buildDefaultConstraints('dark');
    expect(constraints.length).toBeGreaterThan(10);
  });

  test('fg1-bg1 defaults to 5.5 (editor default — terminal passes 7.5 explicitly)', () => {
    const constraints = buildDefaultConstraints('dark');
    const fgBg = constraints.find((c) => c.role === 'fg1' && c.against === 'bg1');
    expect(fgBg).toBeDefined();
    expect(fgBg!.min).toBe(5.5);
  });

  test('fg1-bg1 can be raised to 7.5 for terminal targets', () => {
    const constraints = buildDefaultConstraints('dark', { contrastFg: 7.5 });
    const fgBg = constraints.find((c) => c.role === 'fg1' && c.against === 'bg1');
    expect(fgBg!.min).toBe(7.5);
  });

  test('comment has min AND max', () => {
    const constraints = buildDefaultConstraints('dark');
    const comment = constraints.find((c) => c.role === 'comment');
    expect(comment).toBeDefined();
    expect(comment!.min).toBe(2.5);
    expect(comment!.max).toBe(3.5);
  });

  test('light mode has different comment constraints', () => {
    const constraints = buildDefaultConstraints('light');
    const comment = constraints.find((c) => c.role === 'comment');
    expect(comment!.min).toBe(1.5);
    expect(comment!.max).toBe(3.0);
  });

  test('options override default values', () => {
    const constraints = buildDefaultConstraints('dark', { contrastFg: 5.5 });
    const fgBg = constraints.find((c) => c.role === 'fg1' && c.against === 'bg1');
    expect(fgBg!.min).toBe(5.5);
  });

  test('includes ANSI constraints', () => {
    const constraints = buildDefaultConstraints('dark');
    const ansiRed = constraints.find((c) => c.role === 'ansiRed');
    expect(ansiRed).toBeDefined();
    expect(ansiRed!.min).toBe(4.5);
  });

  test('includes syntax constraints (not comment)', () => {
    const constraints = buildDefaultConstraints('dark');
    const keyword = constraints.find((c) => c.role === 'keyword');
    expect(keyword).toBeDefined();
    expect(keyword!.min).toBe(5.5);
    expect(keyword!.max).toBeUndefined();
  });
});

describe('constraints — getActiveConstraints()', () => {
  test('returns dark constraints for dark mode', () => {
    const role = UI_ROLES.find((r) => r.name === 'bg1')!;
    const active = getActiveConstraints(role, 'dark');
    expect(active.l[1]).toBe(0.35);
  });

  test('returns light constraints for light mode', () => {
    const role = UI_ROLES.find((r) => r.name === 'bg1')!;
    const active = getActiveConstraints(role, 'light');
    expect(active.l[0]).toBe(0.93);
  });
});

describe('constraints — satisfiesConstraints()', () => {
  test('color within bounds passes', () => {
    const constraints = { l: [0, 0.2] as [number, number], c: [0, 0.04] as [number, number] };
    expect(satisfiesConstraints({ l: 0.15, c: 0.02, h: 270 }, constraints)).toBe(true);
  });

  test('color outside L range fails', () => {
    const constraints = { l: [0, 0.2] as [number, number], c: [0, 0.04] as [number, number] };
    expect(satisfiesConstraints({ l: 0.50, c: 0.02, h: 270 }, constraints)).toBe(false);
  });

  test('color outside C range fails', () => {
    const constraints = { l: [0, 0.2] as [number, number], c: [0, 0.04] as [number, number] };
    expect(satisfiesConstraints({ l: 0.15, c: 0.20, h: 270 }, constraints)).toBe(false);
  });

  test('hue within normal range passes', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.4] as [number, number], h: [90, 160] as [number, number] };
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 120 }, constraints)).toBe(true);
  });

  test('hue outside normal range fails', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.4] as [number, number], h: [90, 160] as [number, number] };
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 200 }, constraints)).toBe(false);
  });

  test('hue within wrapping range passes (e.g., 350-30)', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.4] as [number, number], h: [350, 30] as [number, number] };
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 355 }, constraints)).toBe(true);
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 10 }, constraints)).toBe(true);
  });

  test('hue outside wrapping range fails', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.4] as [number, number], h: [350, 30] as [number, number] };
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 180 }, constraints)).toBe(false);
  });

  test('no hue constraint accepts any hue', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.4] as [number, number] };
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 0 }, constraints)).toBe(true);
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 180 }, constraints)).toBe(true);
    expect(satisfiesConstraints({ l: 0.5, c: 0.2, h: 359 }, constraints)).toBe(true);
  });
});

describe('constraints — projectIntoConstraints()', () => {
  test('color within bounds unchanged (L and C)', () => {
    const constraints = { l: [0, 0.2] as [number, number], c: [0, 0.04] as [number, number] };
    const result = projectIntoConstraints({ l: 0.15, c: 0.02, h: 270 }, constraints);
    expect(result.l).toBeCloseTo(0.15, 2);
    expect(result.c).toBeCloseTo(0.02, 2);
  });

  test('L clamped into range', () => {
    const constraints = { l: [0, 0.2] as [number, number], c: [0, 0.04] as [number, number] };
    const result = projectIntoConstraints({ l: 0.80, c: 0.02, h: 270 }, constraints);
    expect(result.l).toBeCloseTo(0.20, 2);
  });

  test('C clamped into range', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.04] as [number, number] };
    const result = projectIntoConstraints({ l: 0.50, c: 0.30, h: 270 }, constraints);
    expect(result.c).toBeLessThanOrEqual(0.04);
  });

  test('hue projected to nearest boundary', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.4] as [number, number], h: [90, 160] as [number, number] };
    // h=80 is closer to 90 than to 160
    const result = projectIntoConstraints({ l: 0.5, c: 0.2, h: 80 }, constraints);
    expect(result.h).toBeCloseTo(90, 0);
  });

  test('result is always valid OKLCH', () => {
    const constraints = { l: [0.3, 0.7] as [number, number], c: [0.05, 0.15] as [number, number] };
    const result = projectIntoConstraints({ l: 1.5, c: 0.5, h: 400 }, constraints);
    expect(result.l).toBeGreaterThanOrEqual(0);
    expect(result.l).toBeLessThanOrEqual(1);
    expect(result.c).toBeGreaterThanOrEqual(0);
    expect(result.c).toBeLessThanOrEqual(0.4);
  });
});

describe('constraints — enforceContrast()', () => {
  test('colors already meeting min contrast unchanged', () => {
    const result = enforceContrast(brightFg, darkBg, 4.5);
    expect(contrast(result, darkBg)).toBeGreaterThanOrEqual(4.5);
  });

  test('low-contrast pair adjusted to meet minimum', () => {
    // mid color against dark bg might not have enough contrast
    const low: OklchColor = { l: 0.25, c: 0.05, h: 200 };
    const result = enforceContrast(low, darkBg, 4.5);
    expect(contrast(result, darkBg)).toBeGreaterThanOrEqual(4.5);
  });

  test('enforced contrast with high target (7.5)', () => {
    const dim: OklchColor = { l: 0.40, c: 0.05, h: 100 };
    const result = enforceContrast(dim, darkBg, 7.5);
    expect(contrast(result, darkBg)).toBeGreaterThanOrEqual(7.5);
  });

  test('max contrast enforcement reduces contrast', () => {
    // Very bright color against dark bg = very high contrast
    const veryBright: OklchColor = { l: 0.99, c: 0.01, h: 200 };
    const result = enforceContrast(veryBright, darkBg, 2.5, 3.5);
    const resultContrast = contrast(result, darkBg);
    // Should be within [2.5, 3.5] or close to it
    expect(resultContrast).toBeLessThan(contrast(veryBright, darkBg));
  });

  test('result is valid OKLCH', () => {
    const result = enforceContrast(midColor, darkBg, 7.5);
    expect(result.l).toBeGreaterThanOrEqual(0);
    expect(result.l).toBeLessThanOrEqual(1);
  });
});

describe('constraints — enforceCommentContrast()', () => {
  test('adjusts comment to be within min/max vs bg1 in dark mode', () => {
    const bg1: OklchColor = { l: 0.15, c: 0.02, h: 270 };
    const bg3: OklchColor = { l: 0.20, c: 0.01, h: 270 };
    const comment: OklchColor = { l: 0.95, c: 0.02, h: 200 }; // Very bright = too much contrast
    const result = enforceCommentContrast(comment, bg1, bg3, 'dark');
    const c1 = contrast(result, bg1);
    const c3 = contrast(result, bg3);
    // Should have reduced contrast to be within bounds (or approaching them)
    expect(c1).toBeLessThan(contrast(comment, bg1));
  });

  test('adjusts faint comment up in dark mode', () => {
    const bg1: OklchColor = { l: 0.15, c: 0.02, h: 270 };
    const bg3: OklchColor = { l: 0.20, c: 0.01, h: 270 };
    const faint: OklchColor = { l: 0.18, c: 0.02, h: 200 }; // Very close to bg = too faint
    const result = enforceCommentContrast(faint, bg1, bg3, 'dark');
    expect(result.l).toBeGreaterThan(faint.l);
  });

  test('works in light mode', () => {
    const bg1: OklchColor = { l: 0.95, c: 0.01, h: 90 };
    const bg3: OklchColor = { l: 0.92, c: 0.01, h: 90 };
    const comment: OklchColor = { l: 0.10, c: 0.02, h: 200 }; // Very dark = too much contrast
    const result = enforceCommentContrast(comment, bg1, bg3, 'light');
    const originalContrast = contrast(comment, bg1);
    const resultContrast = contrast(result, bg1);
    expect(resultContrast).toBeLessThan(originalContrast);
  });

  test('already-valid comment left mostly unchanged', () => {
    const bg1: OklchColor = { l: 0.15, c: 0.02, h: 270 };
    const bg3: OklchColor = { l: 0.20, c: 0.01, h: 270 };
    // A comment with moderate lightness should have ~2.5-3.5 contrast
    const comment: OklchColor = { l: 0.38, c: 0.03, h: 200 };
    const result = enforceCommentContrast(comment, bg1, bg3, 'dark');
    // Should be close to original (small adjustment or none)
    expect(Math.abs(result.l - comment.l)).toBeLessThan(0.15);
  });

  test('accepts custom min/max overrides from spec ContrastConstraint', () => {
    const bg1: OklchColor = { l: 0.15, c: 0.02, h: 270 };
    const bg3: OklchColor = { l: 0.20, c: 0.01, h: 270 };
    const comment: OklchColor = { l: 0.95, c: 0.02, h: 200 };
    // Use custom n-nvim style constraints (lower threshold)
    const result = enforceCommentContrast(comment, bg1, bg3, 'dark', { min: 2.0, max: 3.0 });
    const c1 = contrast(result, bg1);
    expect(c1).toBeLessThanOrEqual(3.0 + 0.1); // within tolerance of max
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe('constraints — edge cases', () => {
  test('enforceContrast with L=0 (pure black)', () => {
    const black: OklchColor = { l: 0, c: 0, h: 0 };
    const result = enforceContrast(black, darkBg, 7.5);
    expect(result.l).toBeGreaterThanOrEqual(0);
    expect(result.l).toBeLessThanOrEqual(1);
  });

  test('enforceContrast with L=1 (pure white)', () => {
    const white: OklchColor = { l: 1, c: 0, h: 0 };
    const result = enforceContrast(white, lightBg, 7.5);
    expect(result.l).toBeGreaterThanOrEqual(0);
    expect(result.l).toBeLessThanOrEqual(1);
  });

  test('satisfiesConstraints with achromatic color (C=0)', () => {
    const constraints = { l: [0, 1] as [number, number], c: [0, 0.4] as [number, number] };
    expect(satisfiesConstraints({ l: 0.5, c: 0, h: 0 }, constraints)).toBe(true);
  });

  test('projectIntoConstraints preserves alpha', () => {
    const constraints = { l: [0.3, 0.7] as [number, number], c: [0.05, 0.15] as [number, number] };
    const result = projectIntoConstraints({ l: 0.5, c: 0.1, h: 200, alpha: 0.5 }, constraints);
    expect(result.alpha).toBe(0.5);
  });
});

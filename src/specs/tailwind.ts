import type {
  ThemeSpec,
  RoleDefinition,
  DerivedDefinition,
  TailwindSpecOptions,
} from '../types.js';

// ── Default families ──────────────────────────────────────────────────────────

export const DEFAULT_TAILWIND_FAMILIES = [
  'primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error',
] as const;

// ── Shade scale deltas ────────────────────────────────────────────────────────

/**
 * Lightness deltas from the 500-level anchor for each Tailwind shade.
 *
 * The 500-level color is extracted with L ∈ [0.38, 0.62].
 * Positive deltas → lighter shades; negative deltas → darker shades.
 * Values are tuned for perceptual distribution in OKLCH space.
 */
const SHADE_DELTAS: Record<string, number> = {
  '50':  +0.46,
  '100': +0.38,
  '200': +0.28,
  '300': +0.18,
  '400': +0.08,
  // '500' is the anchor role itself (no derived)
  '600': -0.08,
  '700': -0.18,
  '800': -0.28,
  '900': -0.38,
  '950': -0.44,
};

const SHADE_LEVELS = ['50', '100', '200', '300', '400', '600', '700', '800', '900', '950'];

// ── Role and derived builders ─────────────────────────────────────────────────

/** Hue constraints for semantic families */
const FAMILY_HUE_RANGES: Partial<Record<string, [number, number]>> = {
  success: [90, 170],
  warning: [33, 100],
  error:   [350, 30], // wraps around 0
};

/**
 * Build the 500-level anchor role for a family.
 *
 * - neutral: achromatic (c ∈ [0, 0.03]), no hue constraint
 * - semantic families (success/warning/error): hue-constrained
 * - all others (primary/secondary/accent): any saturated color
 */
function buildFamilyAnchor(family: string): RoleDefinition {
  const isNeutral = family === 'neutral';
  const hueRange  = FAMILY_HUE_RANGES[family];

  const cRange: [number, number] = isNeutral ? [0, 0.03] : [0.08, 0.40];

  return {
    name: `${family}500`,
    priority: 40,
    dark: {
      l: [0.38, 0.62],
      c: cRange,
      ...(hueRange ? { h: hueRange } : {}),
    },
    light: {
      l: [0.38, 0.62],
      c: cRange,
      ...(hueRange ? { h: hueRange } : {}),
    },
  };
}

/** Build 10 derived shade roles from the 500-level anchor */
function buildFamilyShades(family: string): DerivedDefinition[] {
  return SHADE_LEVELS.map((shade) => ({
    name: `${family}${shade}`,
    transform: {
      type: 'adjustLightness' as const,
      source: `${family}500`,
      delta: SHADE_DELTAS[shade],
    },
  }));
}

// ── Spec factory ──────────────────────────────────────────────────────────────

/**
 * Create a ThemeSpec for a Tailwind-style color system.
 *
 * Generates a complete shade scale for each color family using a two-step approach:
 * 1. Extract one "500-level" anchor color per family from the OKLCH color cloud
 *    (L ∈ [0.38, 0.62], saturated for chromatic families, achromatic for neutral).
 * 2. Derive the full shade scale (50–950) via adjustLightness transforms from each anchor.
 *
 * The result is a palette with N families × 11 shades = N × 11 entries total
 * (1 extracted + 10 derived per family). Shade naming follows Tailwind convention:
 * `{family}50`, `{family}100`, ..., `{family}500`, ..., `{family}950`.
 *
 * Default families (7): primary, secondary, accent, neutral, success, warning, error
 * - neutral: achromatic (c ≤ 0.03), no hue constraint
 * - success: green hue range (H 90–170)
 * - warning: amber hue range (H 33–100)
 * - error: red hue range (H 350–30, wraps around)
 * - others: any saturated color (c ∈ [0.08, 0.40])
 *
 * Shade delta scale (OKLCH lightness offsets from 500-anchor):
 * 50=+0.46, 100=+0.38, 200=+0.28, 300=+0.18, 400=+0.08,
 * 600=-0.08, 700=-0.18, 800=-0.28, 900=-0.38, 950=-0.44
 *
 * No contrast constraints are enforced — Tailwind color families are composable
 * design tokens. Semantic usage (accessibility) is handled by the consuming app.
 */
export function createTailwindSpec(options?: TailwindSpecOptions): ThemeSpec {
  const families = options?.families ?? [...DEFAULT_TAILWIND_FAMILIES];

  // ── Roles (one anchor per family) ─────────────────────────────────────────

  const roles: RoleDefinition[] = families.map(buildFamilyAnchor);

  // ── Derived (10 shades per family) ────────────────────────────────────────

  const derived: DerivedDefinition[] = families.flatMap(buildFamilyShades);

  return {
    name: 'tailwind',
    roles,
    derived,
    constraints: [], // Tailwind color families are composable — no enforcement
    ansiMode: 'free', // not used in Tailwind themes
  };
}

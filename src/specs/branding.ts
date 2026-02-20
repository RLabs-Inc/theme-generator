import type {
  ThemeSpec,
  RoleDefinition,
  DerivedDefinition,
  BrandingSpecOptions,
} from '../types.js';

// ── Core brand roles ──────────────────────────────────────────────────────────

const BRAND_ROLES: RoleDefinition[] = [
  {
    name: 'brandPrimary', priority: 70,
    dark:  { l: [0, 1.0], c: [0.10, 0.40] },
    light: { l: [0, 1.0], c: [0.10, 0.40] },
  },
  {
    name: 'brandSecondary', priority: 65,
    dark:  { l: [0, 1.0], c: [0.10, 0.40] },
    light: { l: [0, 1.0], c: [0.10, 0.40] },
  },
  {
    name: 'brandAccent', priority: 60,
    dark:  { l: [0, 1.0], c: [0.10, 0.40] },
    light: { l: [0, 1.0], c: [0.10, 0.40] },
  },
];

// Branding palettes are compositional — no bg1/fg1/fg3 structure exists.
// Foreground-on-brand-color decisions are left to the consumer (design system,
// component library, or brand guideline tooling). The extracted brand colors
// are the primary deliverable; text-on-accent is context-dependent.
const BRAND_DERIVED: DerivedDefinition[] = [];

// ── Neutral scale builder ─────────────────────────────────────────────────────

/**
 * Build N neutral roles spanning the full lightness range.
 *
 * neutral1 = lightest (near-white), neutral{N} = darkest (near-black).
 * Each neutral has near-zero chroma (achromatic / near-gray).
 * L range for each step: band = 1.0 / N; step i has L [(N-1-i)/N, (N-i)/N].
 *
 * For neutralCount = 5:
 *   neutral1: L [0.80, 1.0]  (near-white)
 *   neutral2: L [0.60, 0.80]
 *   neutral3: L [0.40, 0.60]  (mid-gray)
 *   neutral4: L [0.20, 0.40]
 *   neutral5: L [0.00, 0.20]  (near-black)
 */
function buildNeutralRoles(count: number): RoleDefinition[] {
  const band = 1.0 / count;
  return Array.from({ length: count }, (_, i) => {
    const lMin = (count - 1 - i) * band;
    const lMax = (count - i) * band;
    return {
      name: `neutral${i + 1}`,
      priority: 45 - i, // lighter neutrals get slightly higher priority
      dark:  { l: [lMin, lMax], c: [0, 0.03] },
      light: { l: [lMin, lMax], c: [0, 0.03] },
    };
  });
}

// ── Spec factory ──────────────────────────────────────────────────────────────

/**
 * Create a ThemeSpec for branding palettes.
 *
 * A branding palette defines a brand's core identity colors plus a neutral
 * scale for typography and surfaces. Unlike editor or UI framework specs, there
 * is no canonical "background" to contrast against — these are design tokens
 * meant to be composed into brand guidelines, design systems, or marketing materials.
 *
 * Includes:
 * - Brand colors: brandPrimary, brandSecondary, brandAccent
 *   (all saturated, any hue — extracted freely from the color cloud)
 * - Neutral scale: neutral1 (lightest) through neutral{N} (darkest)
 *   N = neutralCount option (default: 5)
 *   Each neutral is achromatic (c ≤ 0.03) and spans an equal lightness band.
 *
 * Derived:
 * - brandPrimaryFg   → adaptiveFg: readable text on top of brandPrimary
 * - brandSecondaryFg → adaptiveFg: readable text on top of brandSecondary
 * - brandAccentFg    → adaptiveFg: readable text on top of brandAccent
 *
 * No contrast constraints are enforced — branding palettes are compositional
 * rather than prescriptive. The L/C constraints in role definitions guide
 * extraction toward appropriate lightness distribution.
 */
export function createBrandingSpec(options?: BrandingSpecOptions): ThemeSpec {
  const neutralCount = options?.neutralCount ?? 5;

  // ── Roles ──────────────────────────────────────────────────────────────────

  const roles: RoleDefinition[] = [
    ...BRAND_ROLES,
    ...buildNeutralRoles(neutralCount),
  ];

  // ── Derived Colors ─────────────────────────────────────────────────────────

  const derived: DerivedDefinition[] = [
    ...BRAND_DERIVED,
  ];

  return {
    name: 'branding',
    roles,
    derived,
    constraints: [], // branding palettes are compositional — no UI contrast enforcement
    ansiMode: 'free', // not used in branding themes
  };
}

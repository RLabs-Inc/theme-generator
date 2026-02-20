import type {
  ThemeSpec,
  RoleDefinition,
  DerivedDefinition,
  ContrastConstraint,
  ShadcnSpecOptions,
} from '../types.js';

// ── Role definitions ──────────────────────────────────────────────────────────

/** Core surface and text roles, mirroring shadcn CSS variable semantics */
const BASE_ROLES: RoleDefinition[] = [
  // Backgrounds
  {
    name: 'background', priority: 100,
    dark:  { l: [0, 0.20], c: [0, 0.04] },
    light: { l: [0.95, 1.0], c: [0, 0.04] },
  },
  {
    name: 'card', priority: 90,
    dark:  { l: [0.05, 0.25], c: [0, 0.05] },
    light: { l: [0.90, 1.0], c: [0, 0.05] },
  },
  {
    name: 'popover', priority: 88,
    dark:  { l: [0.05, 0.25], c: [0, 0.05] },
    light: { l: [0.90, 1.0], c: [0, 0.05] },
  },
  // Foreground (main text)
  {
    name: 'foreground', priority: 98,
    dark:  { l: [0.90, 1.0], c: [0, 0.15] },
    light: { l: [0, 0.15], c: [0, 0.15] },
  },
  // Surfaces with semantic meaning
  {
    name: 'primary', priority: 75,
    dark:  { l: [0, 1.0], c: [0, 0.40] },
    light: { l: [0, 1.0], c: [0, 0.40] },
  },
  {
    name: 'secondary', priority: 65,
    dark:  { l: [0.05, 0.30], c: [0, 0.15] },
    light: { l: [0.85, 0.97], c: [0, 0.15] },
  },
  {
    name: 'muted', priority: 62,
    dark:  { l: [0.05, 0.25], c: [0, 0.08] },
    light: { l: [0.88, 1.0], c: [0, 0.08] },
  },
  {
    name: 'mutedForeground', priority: 58,
    dark:  { l: [0.40, 0.75], c: [0, 0.20] },
    light: { l: [0.28, 0.62], c: [0, 0.20] },
  },
  {
    name: 'accent', priority: 70,
    dark:  { l: [0, 1.0], c: [0, 0.40] },
    light: { l: [0, 1.0], c: [0, 0.40] },
  },
  // Danger/destructive (red-hue)
  {
    name: 'destructive', priority: 60,
    dark:  { l: [0.30, 0.75], c: [0.15, 0.40], h: [350, 30] },
    light: { l: [0.30, 0.75], c: [0.15, 0.40], h: [350, 30] },
  },
  // Borders and interactive outlines
  {
    name: 'border', priority: 50,
    dark:  { l: [0.10, 0.35], c: [0, 0.08] },
    light: { l: [0.78, 0.92], c: [0, 0.08] },
  },
  {
    name: 'input', priority: 48,
    dark:  { l: [0.10, 0.35], c: [0, 0.08] },
    light: { l: [0.78, 0.92], c: [0, 0.08] },
  },
  {
    name: 'ring', priority: 45,
    dark:  { l: [0, 1.0], c: [0, 0.40] },
    light: { l: [0, 1.0], c: [0, 0.40] },
  },
];

/** Sidebar surface + accent roles */
const SIDEBAR_ROLES: RoleDefinition[] = [
  {
    name: 'sidebarBackground', priority: 85,
    dark:  { l: [0.02, 0.18], c: [0, 0.05] },
    light: { l: [0.88, 0.99], c: [0, 0.05] },
  },
  {
    name: 'sidebarAccent', priority: 55,
    dark:  { l: [0.08, 0.30], c: [0, 0.15] },
    light: { l: [0.82, 0.96], c: [0, 0.15] },
  },
];

/** Build chart color roles with priority 40 and vibrant OKLCH constraints */
function buildChartRoles(count: number): RoleDefinition[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `chart${i + 1}`,
    priority: 40,
    dark:  { l: [0.30, 0.80], c: [0.10, 0.40] },
    light: { l: [0.25, 0.75], c: [0.10, 0.40] },
  }));
}

// ── Base derived colors ────────────────────────────────────────────────────────

/**
 * Shadcn uses adaptiveFg with custom role mappings:
 * - bgRole: 'background' (mode detection — near-black in dark, near-white in light)
 * - fgRole: 'foreground' (high-contrast text — near-white in dark, near-black in light)
 * - fgAltRole: 'background' (near-bg text — for text ON LIGHT accents in dark mode
 *   or text ON DARK accents in light mode, uses the page background color directly)
 *
 * This mirrors how shadcn themes work: `--primary-foreground` is typically the
 * background color (near-white in dark mode, near-black in light mode) when the
 * primary is a mid-to-light tone — creating readable text on colored buttons.
 */
const ADAPTIVE_FG_OPTS = {
  bgRole:    'background',
  fgRole:    'foreground',
  fgAltRole: 'background',
} as const;

const BASE_DERIVED: DerivedDefinition[] = [
  // Foreground copies — card and popover text shares main foreground
  { name: 'cardForeground',    transform: { type: 'copy', source: 'foreground' } },
  { name: 'popoverForeground', transform: { type: 'copy', source: 'foreground' } },
  // Adaptive foregrounds — correct text color ON TOP of semantic backgrounds
  { name: 'primaryForeground',     transform: { type: 'adaptiveFg', background: 'primary',     ...ADAPTIVE_FG_OPTS } },
  { name: 'secondaryForeground',   transform: { type: 'adaptiveFg', background: 'secondary',   ...ADAPTIVE_FG_OPTS } },
  { name: 'accentForeground',      transform: { type: 'adaptiveFg', background: 'accent',      ...ADAPTIVE_FG_OPTS } },
  { name: 'destructiveForeground', transform: { type: 'adaptiveFg', background: 'destructive', ...ADAPTIVE_FG_OPTS } },
];

const SIDEBAR_DERIVED: DerivedDefinition[] = [
  { name: 'sidebarForeground',        transform: { type: 'copy',       source:     'foreground'      } },
  { name: 'sidebarPrimary',           transform: { type: 'copy',       source:     'primary'         } },
  { name: 'sidebarPrimaryForeground', transform: { type: 'adaptiveFg', background: 'primary',        ...ADAPTIVE_FG_OPTS } },
  { name: 'sidebarAccentForeground',  transform: { type: 'adaptiveFg', background: 'sidebarAccent',  ...ADAPTIVE_FG_OPTS } },
  { name: 'sidebarBorder',            transform: { type: 'copy',       source:     'border'          } },
  { name: 'sidebarRing',              transform: { type: 'copy',       source:     'ring'            } },
];

// ── Spec factory ──────────────────────────────────────────────────────────────

/**
 * Create a ThemeSpec for shadcn/ui.
 *
 * shadcn/ui uses a set of CSS custom properties (`--background`, `--primary`,
 * `--muted-foreground`, etc.) that define the full design token vocabulary for
 * components. This spec extracts all core shadcn color tokens from an OKLCH
 * color cloud and derives foreground counterparts using the `adaptiveFg` transform.
 *
 * Includes:
 * - Core surfaces: background, card, popover
 * - Main text: foreground
 * - Semantic colors: primary, secondary, muted, accent, destructive
 * - Muted text: mutedForeground (extracted, medium contrast)
 * - Layout: border, input, ring
 * - Chart colors: chart1–chartN (default 5, configurable)
 * - Optional sidebar: sidebarBackground, sidebarAccent + their derived variants
 *
 * Derived (always):
 * - cardForeground / popoverForeground → copy of foreground
 * - primaryForeground / secondaryForeground / accentForeground / destructiveForeground
 *   → adaptiveFg: picks fg1 or fg3 based on background luminance
 *
 * Derived (sidebar):
 * - sidebarForeground → copy of foreground
 * - sidebarPrimary → copy of primary
 * - sidebarPrimaryForeground → adaptiveFg for primary
 * - sidebarAccentForeground → adaptiveFg for sidebarAccent
 * - sidebarBorder / sidebarRing → copy of border / ring
 *
 * Note: shadcn uses HSL CSS variables by convention. The exporter converts from
 * OKLCH to HSL format. This spec only defines OKLCH constraints for extraction.
 */
export function createShadcnSpec(options?: ShadcnSpecOptions): ThemeSpec {
  const chartColors   = options?.chartColors   ?? 5;
  const includeSidebar = options?.includeSidebar ?? true;

  // ── Roles ──────────────────────────────────────────────────────────────────

  const roles: RoleDefinition[] = [
    ...BASE_ROLES,
    ...buildChartRoles(chartColors),
    ...(includeSidebar ? SIDEBAR_ROLES : []),
  ];

  // ── Derived Colors ─────────────────────────────────────────────────────────

  const derived: DerivedDefinition[] = [
    ...BASE_DERIVED,
    ...(includeSidebar ? SIDEBAR_DERIVED : []),
  ];

  // ── Cross-Role Contrast Constraints ───────────────────────────────────────

  const chartConstraints: ContrastConstraint[] = Array.from(
    { length: chartColors },
    (_, i) => ({ role: `chart${i + 1}`, against: 'background' as const, min: 3.0 }),
  );

  const constraints: ContrastConstraint[] = [
    { role: 'foreground',      against: 'background', min: 7.5 },
    { role: 'primary',         against: 'background', min: 2.5 },
    { role: 'accent',          against: 'background', min: 2.5 },
    { role: 'destructive',     against: 'background', min: 4.5 },
    // mutedForeground is intentionally medium-contrast — readable but visually muted
    { role: 'mutedForeground', against: 'background', min: 3.0, max: 5.5 },
    ...chartConstraints,
  ];

  return {
    name: 'shadcn',
    roles,
    derived,
    constraints,
    ansiMode: 'free', // not used in shadcn themes
  };
}

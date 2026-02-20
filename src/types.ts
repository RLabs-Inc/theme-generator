import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Theme Mode ──────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light';

// ── Role Constraints ────────────────────────────────────────────────────────

/** OKLCH range constraints for a semantic role */
export interface RoleConstraints {
  /** Lightness range [min, max] in 0-1 */
  l: [number, number];
  /** Chroma range [min, max] in 0-0.4 */
  c: [number, number];
  /** Hue range [min, max] in 0-360 (wraps around). Omit for "any hue" */
  h?: [number, number];
}

// ── Contrast Constraints ────────────────────────────────────────────────────

/** Defines a contrast requirement between two roles */
export interface ContrastConstraint {
  /** The role that gets adjusted when a violation is detected */
  role: string;
  /** The role to measure contrast against */
  against: string;
  /** Minimum WCAG contrast ratio */
  min: number;
  /** Maximum contrast ratio (for muted roles like comments) */
  max?: number;
}

// ── Role Definition ─────────────────────────────────────────────────────────

/** Complete definition of a semantic color role */
export interface RoleDefinition {
  /** Unique role name (e.g., 'bg1', 'fg1', 'keyword') */
  name: string;
  /** Priority for extraction ordering (higher = assigned first, more constrained) */
  priority: number;
  /** OKLCH constraints for dark mode */
  dark: RoleConstraints;
  /** OKLCH constraints for light mode */
  light: RoleConstraints;
  /**
   * Hue group identifier. Roles sharing the same hueGroup are assigned the same
   * hue during extraction — only L and C vary within the group. This preserves
   * visual coherence (e.g. function/functionCall are same hue, different brightness).
   * Omit for roles that should get independent hues.
   */
  hueGroup?: string;
}

// ── Derived Color Transforms ────────────────────────────────────────────────

/** Blend two assigned colors in OKLCH space */
export interface BlendTransform {
  type: 'blend';
  /** Source role A */
  a: string;
  /** Source role B */
  b: string;
  /** Blend amount (0 = all B, 1 = all A) */
  amount: number;
}

/** Adjust lightness of an assigned color */
export interface AdjustLightnessTransform {
  type: 'adjustLightness';
  /** Source role */
  source: string;
  /** Lightness delta (positive = brighter, negative = darker) */
  delta: number;
}

/** Set alpha channel on an assigned color */
export interface WithAlphaTransform {
  type: 'withAlpha';
  /** Source role */
  source: string;
  /** Alpha value 0-1 */
  alpha: number;
}

/** Ensure minimum contrast between two colors */
export interface EnsureContrastTransform {
  type: 'ensureContrast';
  /** Source role to adjust */
  source: string;
  /** Role to contrast against */
  against: string;
  /** Minimum contrast ratio */
  min: number;
}

/** Direct copy of an assigned color */
export interface CopyTransform {
  type: 'copy';
  /** Source role */
  source: string;
}

/** Append hex alpha suffix to an assigned color's hex string */
export interface WithHexAlphaTransform {
  type: 'withHexAlpha';
  /** Source role */
  source: string;
  /** Hex alpha suffix (e.g., '30', 'db', '50') */
  hexAlpha: string;
}

/**
 * Adaptive foreground — picks one of two foreground options based on the
 * accent's luminance and theme mode.
 *
 * Mirrors the RLabs `getAC1Foreground / getAC2Foreground` pattern:
 * - Dark mode + dark accent → fgRole (default: fg1 — light text on dark accent)
 * - Dark mode + light accent → fgAltRole (default: fg3 — near-bg text on light accent)
 * - Light mode + dark accent → fgAltRole (default: fg3 — near-bg text on dark accent)
 * - Light mode + light accent → fgRole (default: fg1 — dark text on light accent)
 *
 * Mode is inferred from `bgRole` (default: 'bg1') in the palette (l < 0.5 → dark mode).
 * Used for badge text, status bar foreground, title bar text, etc.
 *
 * Optional role overrides allow use in non-editor specs (shadcn, branding):
 *   bgRole: role used for dark/light mode detection (default: 'bg1')
 *   fgRole: the high-contrast foreground (default: 'fg1')
 *   fgAltRole: the low-contrast / near-background foreground (default: 'fg3')
 */
export interface AdaptiveFgTransform {
  type: 'adaptiveFg';
  /** The accent/background role whose luminance drives the decision */
  background: string;
  /** Role to use as "main foreground" (default: 'fg1') */
  fgRole?: string;
  /** Role to use as "alternative foreground" (default: 'fg3') */
  fgAltRole?: string;
  /** Role to use for dark/light mode detection (default: 'bg1') */
  bgRole?: string;
}

/** Union of all derived transform types */
export type DerivedTransform =
  | BlendTransform
  | AdjustLightnessTransform
  | WithAlphaTransform
  | EnsureContrastTransform
  | CopyTransform
  | WithHexAlphaTransform
  | AdaptiveFgTransform;

/** A derived color definition — name + transform */
export interface DerivedDefinition {
  /** Unique name for the derived color */
  name: string;
  /** Transform to apply */
  transform: DerivedTransform;
}

// ── Theme Spec ──────────────────────────────────────────────────────────────

/** Complete specification for what a theme needs */
export interface ThemeSpec {
  /** Spec name (e.g., 'terminal', 'vscode', 'zed') */
  name: string;
  /** Roles to extract from the color cloud */
  roles: RoleDefinition[];
  /** Derived colors computed from assigned roles */
  derived: DerivedDefinition[];
  /** Cross-role contrast constraints to enforce */
  constraints: ContrastConstraint[];
  /** ANSI color mode: 'free' = any color any slot, 'constrained' = hue-matched */
  ansiMode: 'free' | 'constrained';
}

// ── Palette Color ───────────────────────────────────────────────────────────

/** A fully-resolved color in the palette with all output formats */
export interface PaletteColor {
  /** Role name this color was assigned to */
  role: string;
  /** OKLCH representation */
  oklch: OklchColor;
  /** Hex string (#RRGGBB or #RRGGBBAA) */
  hex: string;
  /** RGB representation (0-255) */
  rgb: { r: number; g: number; b: number };
  /** HSL representation */
  hsl: { h: number; s: number; l: number };
  /** Display P3 representation (0-1) */
  p3: { r: number; g: number; b: number };
  /** CSS string representations */
  css: {
    oklch: string;
    rgb: string;
    hsl: string;
    hex: string;
    p3: string;
  };
}

// ── Theme Palette ───────────────────────────────────────────────────────────

/** The output of extraction — all colors assigned and derived */
export interface ThemePalette {
  /** Spec name used for extraction */
  spec: string;
  /** Theme mode */
  mode: ThemeMode;
  /** All assigned + derived colors, keyed by role name */
  colors: Record<string, PaletteColor>;
  /** Get a color by role name */
  get(role: string): PaletteColor | undefined;
  /** Get hex string by role name (convenience) */
  hex(role: string): string;
}

// ── Extraction Options ──────────────────────────────────────────────────────

/** Options for the extract() function */
export interface ExtractionOptions {
  /** Colors to keep locked (skip extraction, honor as-is). Role name → hex color */
  locked?: Record<string, string>;
  /** Seeded PRNG for deterministic tie-breaking */
  randomSeed?: number;
  /** Override ANSI mode for this extraction */
  ansiMode?: 'free' | 'constrained';
  /**
   * Iso-lightness mode — exploits OKLCH's perceptual uniformity.
   *
   * When true, ALL palette roles (accents, status colors, ANSI colors, syntax
   * colors) are assigned a single shared L value. Since OKLCH L is perceptually
   * uniform — unlike HSL where yellows look brighter than blues at the same L —
   * this produces a palette where every color appears at exactly the same
   * perceived brightness. All variation comes from hue (H) and chroma (C) alone.
   *
   * Background (bg1/bg2/bg3) and foreground (fg1/fg2/fg3) roles are excluded:
   * they must remain at their extremes for contrast to function. Border is also
   * excluded for the same reason.
   *
   * Bright ANSI variants are offset by `uniformBrightDelta` from the shared L.
   *
   * Default: false
   */
  uniform?: boolean;
  /**
   * Lightness offset applied to bright ANSI colors when `uniform` is true.
   * Bright = shared L + uniformBrightDelta, clamped to [0, 1].
   *
   * Default: 0.20
   */
  uniformBrightDelta?: number;
}

// ── Exporter Options ────────────────────────────────────────────────────────

/** Base options for all exporters */
export interface ExporterOptions {
  /** Theme name */
  name?: string;
  /** Author name */
  author?: string;
}

/** Warp-specific exporter options */
export interface WarpExporterOptions extends ExporterOptions {
  /** Theme details field */
  details?: 'darker' | 'lighter';
}

/** VSCode-specific exporter options */
export interface VSCodeExporterOptions extends ExporterOptions {
  /** Include semantic token colors (default: true) */
  semanticHighlighting?: boolean;
}

/** Zed-specific exporter options */
export interface ZedExporterOptions extends ExporterOptions {}

/** Vim-specific exporter options */
export interface VimExporterOptions extends ExporterOptions {
  /** Colorscheme name (kebab-case, used in :colorscheme command) */
  colorSchemeName?: string;
}

// ── Spec Preset Options ─────────────────────────────────────────────────────

/** Terminal spec preset options */
export interface TerminalSpecOptions {
  /** ANSI color assignment mode (default: 'free') */
  ansiMode?: 'free' | 'constrained';
  /** Minimum FG vs BG contrast (default: 7.5) */
  contrastFg?: number;
  /** Minimum ANSI vs BG contrast (default: 4.5) */
  contrastAnsi?: number;
  /** Minimum cursor vs BG contrast (default: 5.5) */
  contrastCursor?: number;
}

/** VSCode spec preset options */
export interface VSCodeSpecOptions {
  /** ANSI color assignment mode (default: 'free') */
  ansiMode?: 'free' | 'constrained';
  /** Minimum FG vs BG contrast (default: 7.5) */
  contrastFg?: number;
  /** Minimum syntax vs BG contrast (default: 5.5) */
  contrastSyntax?: number;
  /** Comment minimum contrast (default: 2.5 dark / 1.5 light) */
  commentMin?: number;
  /** Comment maximum contrast (default: 3.5 dark / 3.0 light) */
  commentMax?: number;
}

/** Zed spec preset options (extends VSCode) */
export interface ZedSpecOptions extends VSCodeSpecOptions {
  /** Number of player cursors (default: 6) */
  playerCount?: number;
}

/** Nvim-specific exporter options (extends Vim — same colorscheme conventions) */
export interface NvimExporterOptions extends VimExporterOptions {}

/** Helix-specific exporter options */
export interface HelixExporterOptions extends ExporterOptions {}

/** Helix spec preset options */
export interface HelixSpecOptions extends VSCodeSpecOptions {}

/** Vim spec preset options */
export interface VimSpecOptions extends VSCodeSpecOptions {}

/** Neovim spec preset options */
export interface NvimSpecOptions extends VimSpecOptions {}

/** shadcn/ui spec preset options */
export interface ShadcnSpecOptions {
  /** Number of chart colors (default: 5) */
  chartColors?: number;
  /** Include sidebar tokens (default: true) */
  includeSidebar?: boolean;
}

/** Branding spec preset options */
export interface BrandingSpecOptions {
  /** Number of neutral colors (default: 5) */
  neutralCount?: number;
}

/** Tailwind spec preset options */
export interface TailwindSpecOptions {
  /** Color families to include (default: all 7) */
  families?: string[];
}

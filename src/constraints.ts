import {
  contrast,
  ensureContrast as coreEnsureContrast,
  clampContrast as coreClampContrast,
  clampToGamut,
  type OklchColor,
} from '@rlabs-inc/color-generator';
import type {
  RoleDefinition,
  RoleConstraints,
  ContrastConstraint,
  ThemeMode,
} from './types.js';

// ── ANSI Hue Ranges (Constrained Mode) ─────────────────────────────────────
//
// OKLCH hues are NOT the same as HSL!  Reference points (from culori):
//
//   ~7°   pink (#ffc0cb)         ~195° cyan (#00ffff)
//   ~29°  red (#ff0000)          ~253° dodger blue (#1e90ff)
//   ~53°  orange (#ff8000)       ~264° blue (#0000ff)
//   ~95°  gold (#ffd700)         ~302° indigo (#4b0082)
//   ~110° yellow (#ffff00)       ~328° magenta/purple (#ff00ff)
//   ~142° lime/green (#00ff00)   ~352° hot pink (#ff69b4)
//
// Ranges cover 0-360° with no gaps:
//   0–15 magenta(wrap) | 15–55 red | 55–120 yellow | 120–170 green
//   170–230 cyan | 230–280 blue | 280–360 magenta(wrap)

/** Hue ranges for constrained ANSI mode. Wrapping ranges use min > max. */
export const ANSI_HUE_RANGES: Record<string, [number, number] | null> = {
  ansiBlack: null,      // By lightness only — visible grays, all hues
  ansiRed: [15, 55],    // Dark red (29°) → red → red-orange (53°)
  ansiGreen: [120, 170],// Chartreuse (136°) → lime (142°) → spring green (151°)
  ansiYellow: [55, 120],// Orange (53°) → gold (95°) → yellow (110°)
  ansiBlue: [230, 280], // Dodger blue (253°) → pure blue (264°) → blue-indigo
  ansiMagenta: [280, 15],// Indigo (302°) → purple (328°) → magenta → hot pink (352°) → pink (7°) — wraps!
  ansiCyan: [170, 230], // Teal (195°) → cyan → blue-cyan
  ansiWhite: null,      // By lightness only — all hues, very low chroma
};

// ── Role Definitions ────────────────────────────────────────────────────────

/** Core UI roles — backgrounds, foregrounds, accents, border */
export const UI_ROLES: RoleDefinition[] = [
  {
    name: 'bg1', priority: 100,
    // RLabs uses [0, 17%] dark / [93, 100%] light — allows darker backgrounds
    dark: { l: [0, 0.17], c: [0, 0.04] },
    light: { l: [0.93, 1.0], c: [0, 0.04] },
  },
  {
    name: 'bg2', priority: 95,
    dark: { l: [0, 0.25], c: [0, 0.05] },
    light: { l: [0.88, 1.0], c: [0, 0.05] },
  },
  {
    name: 'bg3', priority: 90,
    dark: { l: [0, 0.30], c: [0, 0.03] },
    light: { l: [0.90, 1.0], c: [0, 0.03] },
  },
  {
    name: 'fg1', priority: 98,
    // RLabs uses [97, 100%] dark / [0, 15%] light — near-white in dark, near-black in light
    dark: { l: [0.97, 1.0], c: [0, 0.10] },
    light: { l: [0, 0.15], c: [0, 0.10] },
  },
  {
    name: 'fg2', priority: 85,
    // RLabs uses [95, 100%] dark / [0, 30%] light — slightly dimmer than fg1
    dark: { l: [0.95, 1.0], c: [0, 0.15] },
    light: { l: [0, 0.30], c: [0, 0.15] },
  },
  {
    name: 'fg3', priority: 80,
    // FG3 is inverted: near-bg in both modes (disabled/placeholder text)
    dark: { l: [0, 0.25], c: [0, 0.15] },
    light: { l: [0.88, 1.0], c: [0, 0.15] },
  },
  {
    name: 'ac1', priority: 70,
    dark: { l: [0, 1.0], c: [0, 0.40] },
    light: { l: [0, 1.0], c: [0, 0.40] },
  },
  {
    name: 'ac2', priority: 65,
    dark: { l: [0, 1.0], c: [0, 0.40] },
    light: { l: [0, 1.0], c: [0, 0.40] },
  },
  {
    name: 'border', priority: 50,
    dark: { l: [0, 0.40], c: [0, 0.10] },
    light: { l: [0.80, 1.0], c: [0, 0.10] },
  },
];

/** Status roles — each with hue constraints */
export const STATUS_ROLES: RoleDefinition[] = [
  {
    name: 'info', priority: 60,
    dark: { l: [0.20, 1.0], c: [0.10, 0.40], h: [233, 270] },
    light: { l: [0, 1.0], c: [0.10, 0.40], h: [233, 270] },
  },
  {
    name: 'error', priority: 60,
    dark: { l: [0.20, 1.0], c: [0.10, 0.40], h: [24, 32] },
    light: { l: [0, 1.0], c: [0.10, 0.40], h: [24, 32] },
  },
  {
    name: 'warning', priority: 60,
    dark: { l: [0.80, 0.95], c: [0.10, 0.40], h: [33, 100] },
    light: { l: [0, 1.0], c: [0.10, 0.40], h: [33, 100] },
  },
  {
    name: 'success', priority: 60,
    dark: { l: [0.20, 1.0], c: [0.10, 0.40], h: [120, 170] },
    light: { l: [0, 1.0], c: [0.10, 0.40], h: [120, 170] },
  },
];

/** All 42 syntax role names */
export const SYNTAX_ROLE_NAMES = [
  'comment', 'keyword', 'storage', 'modifier', 'other', 'language',
  'operator', 'control', 'controlFlow', 'controlImport',
  'support', 'supportFunction', 'supportMethod', 'supportVariable', 'supportProperty',
  'function', 'functionCall', 'method', 'methodCall', 'selector',
  'parameter', 'variable', 'variableReadonly', 'variableDeclaration', 'variableProperty',
  'property', 'propertyDeclaration', 'class', 'type', 'typeParameter',
  'tag', 'tagPunctuation', 'attribute', 'constant', 'unit', 'datetime',
  'punctuation', 'punctuationQuote', 'punctuationBrace', 'punctuationComma',
  // RLabs extra — used for string color in VSCode (mapped separately in exporters)
  'string',
  // RLabs extra — used for namespace/label/macroName in some exporters
  'namespace',
] as const;

/**
 * Hue groups for syntax roles.
 * Roles sharing the same group get the same hue during extraction — only L/C vary.
 * This preserves RLabs' design: function/functionCall are same hue but distinguishable
 * by brightness/chroma. Roles without a group get independent hues.
 */
export const SYNTAX_HUE_GROUPS: Partial<Record<typeof SYNTAX_ROLE_NAMES[number], string>> = {
  // Function family — AC1 hue in RLabs
  function: 'function',
  functionCall: 'function',
  // Method family — distinct from function
  method: 'method',
  methodCall: 'method',
  // Variable family
  variable: 'variable',
  variableReadonly: 'variable',
  variableDeclaration: 'variable',
  // Property family — shares hue with variable in "few" mode, distinct otherwise
  property: 'property',
  propertyDeclaration: 'property',
  variableProperty: 'property',
  // Support family
  support: 'support',
  supportFunction: 'support',
  supportMethod: 'support',
  supportVariable: 'support',
  supportProperty: 'support',
  // Type family
  type: 'type',
  typeParameter: 'type',
  // Control family
  control: 'control',
  controlFlow: 'control',
  controlImport: 'control',
  // Tag family
  tag: 'tag',
  tagPunctuation: 'tag',
  // Punctuation family
  punctuation: 'punctuation',
  punctuationQuote: 'punctuation',
  punctuationBrace: 'punctuation',
  punctuationComma: 'punctuation',
  // Storage — AC2 hue in RLabs (shares with modifier in some modes)
  storage: 'storage',
  modifier: 'storage',
  // Independent roles (keyword, operator, class, constant, etc. each get their own hue)
};

/** Build syntax role definitions — all have same constraints, priority 40.
 *  Comment is special: low chroma (muted appearance) with contrast enforced post-extraction.
 *  Related roles share a hueGroup so the extraction engine assigns them the same hue. */
export function buildSyntaxRoles(): RoleDefinition[] {
  return SYNTAX_ROLE_NAMES.map((name) => {
    const hueGroup = SYNTAX_HUE_GROUPS[name];

    if (name === 'comment') {
      return {
        name,
        priority: 40,
        dark: { l: [0, 1.0], c: [0, 0.10] },
        light: { l: [0, 1.0], c: [0, 0.10] },
        // comment has no hueGroup — it's intentionally achromatic, hue doesn't matter
      };
    }

    return {
      name,
      priority: 40,
      dark: { l: [0, 1.0], c: [0, 0.40] },
      light: { l: [0, 1.0], c: [0, 0.40] },
      ...(hueGroup ? { hueGroup } : {}),
    };
  });
}

/** ANSI roles for "free" mode — no hue constraints */
export function buildAnsiRolesFree(): RoleDefinition[] {
  const names = ['ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow', 'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite'];
  return names.map((name) => ({
    name,
    priority: 45,
    dark: { l: [0, 0.65], c: [0.05, 0.40] },
    light: { l: [0, 0.65], c: [0.05, 0.40] },
  }));
}

/** ANSI roles for "constrained" mode — hue ranges from ANSI_HUE_RANGES */
export function buildAnsiRolesConstrained(): RoleDefinition[] {
  const names = ['ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow', 'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite'];
  return names.map((name) => {
    const hueRange = ANSI_HUE_RANGES[name];
    if (name === 'ansiBlack') {
      // Visible gray — any hue, low chroma, low lightness
      return {
        name, priority: 45,
        dark: { l: [0.10, 0.30], c: [0, 0.03] },
        light: { l: [0.05, 0.25], c: [0, 0.03] },
      };
    }
    if (name === 'ansiWhite') {
      // Luminous near-white — any hue, very low chroma
      return {
        name, priority: 45,
        dark: { l: [0.85, 1.0], c: [0, 0.05] },
        light: { l: [0.82, 0.98], c: [0, 0.05] },
      };
    }
    return {
      name, priority: 45,
      dark: { l: [0, 0.65], c: [0.05, 0.40], h: hueRange ?? undefined },
      light: { l: [0, 0.65], c: [0.05, 0.40], h: hueRange ?? undefined },
    };
  });
}

// ── Default Contrast Constraints ────────────────────────────────────────────

/** Build default cross-role contrast constraints */
export function buildDefaultConstraints(
  mode: ThemeMode,
  options?: {
    contrastFg?: number;
    contrastSyntax?: number;
    contrastAnsi?: number;
    commentMin?: number;
    commentMax?: number;
  },
): ContrastConstraint[] {
  // Default 5.5 — VSCode/Zed/Vim/editor behavior. Terminal spec passes 7.5 explicitly.
  const fg = options?.contrastFg ?? 5.5;
  const syntax = options?.contrastSyntax ?? 5.5;
  const ansi = options?.contrastAnsi ?? 4.5;
  const commentMin = options?.commentMin ?? (mode === 'dark' ? 2.5 : 1.5);
  const commentMax = options?.commentMax ?? (mode === 'dark' ? 3.5 : 3.0);

  const constraints: ContrastConstraint[] = [
    // Core UI
    { role: 'fg1', against: 'bg1', min: fg },
    { role: 'fg2', against: 'bg1', min: 5.5 },
    { role: 'ac1', against: 'bg1', min: 2.5 },
    { role: 'ac2', against: 'bg1', min: 2.5 },

    // Status
    { role: 'info', against: 'bg1', min: 4.5 },
    { role: 'error', against: 'bg1', min: 4.5 },
    { role: 'warning', against: 'bg1', min: 4.5 },
    { role: 'success', against: 'bg1', min: 4.5 },

    // Comment — special: has min AND max
    { role: 'comment', against: 'bg1', min: commentMin, max: commentMax },
  ];

  // Syntax constraints (all except comment)
  const syntaxNonComment = SYNTAX_ROLE_NAMES.filter((n) => n !== 'comment');
  for (const name of syntaxNonComment) {
    constraints.push({ role: name, against: 'bg1', min: syntax });
  }

  // ANSI constraints
  const ansiNames = ['ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow', 'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite'];
  for (const name of ansiNames) {
    constraints.push({ role: name, against: 'bg1', min: ansi });
  }

  return constraints;
}

// ── Constraint Enforcement ──────────────────────────────────────────────────

/**
 * Get the active constraints for a role based on the theme mode.
 */
export function getActiveConstraints(role: RoleDefinition, mode: ThemeMode): RoleConstraints {
  return mode === 'dark' ? role.dark : role.light;
}

/**
 * Check if a color satisfies a role's constraints.
 */
export function satisfiesConstraints(color: OklchColor, constraints: RoleConstraints): boolean {
  if (color.l < constraints.l[0] || color.l > constraints.l[1]) return false;
  if (color.c < constraints.c[0] || color.c > constraints.c[1]) return false;
  if (constraints.h) {
    const [hMin, hMax] = constraints.h;
    const h = color.h ?? 0;
    if (hMin <= hMax) {
      // Normal range (e.g., 90–160)
      if (h < hMin || h > hMax) return false;
    } else {
      // Wrapping range (e.g., 350–30 means 350→360 + 0→30)
      if (h < hMin && h > hMax) return false;
    }
  }
  return true;
}

/**
 * Project a color into a constraint box — move to the nearest valid point.
 */
export function projectIntoConstraints(color: OklchColor, constraints: RoleConstraints): OklchColor {
  const l = Math.max(constraints.l[0], Math.min(constraints.l[1], color.l));
  const c = Math.max(constraints.c[0], Math.min(constraints.c[1], color.c));

  let h = color.h ?? 0;
  if (constraints.h) {
    const [hMin, hMax] = constraints.h;
    if (hMin <= hMax) {
      // Normal range
      if (h < hMin || h > hMax) {
        // Pick the closer boundary
        const distToMin = Math.min(Math.abs(h - hMin), 360 - Math.abs(h - hMin));
        const distToMax = Math.min(Math.abs(h - hMax), 360 - Math.abs(h - hMax));
        h = distToMin <= distToMax ? hMin : hMax;
      }
    } else {
      // Wrapping range (e.g., 350–30)
      if (h < hMin && h > hMax) {
        const distToMin = hMin - h;
        const distToMax = h - hMax;
        h = distToMin <= distToMax ? hMin : hMax;
      }
    }
  }

  return clampToGamut({ l, c, h, alpha: color.alpha });
}

/**
 * Enforce a single contrast constraint between two colors.
 * Adjusts the `role` color's lightness using binary search from color-generator.
 * Returns the adjusted color.
 */
export function enforceContrast(
  roleColor: OklchColor,
  againstColor: OklchColor,
  min: number,
  max?: number,
): OklchColor {
  const currentContrast = contrast(roleColor, againstColor);

  // Within bounds — no adjustment needed
  if (currentContrast >= min && (max === undefined || currentContrast <= max)) {
    return roleColor;
  }

  // Below minimum: use ensureContrast binary search from color-generator
  if (currentContrast < min) {
    return coreEnsureContrast(roleColor, againstColor, min);
  }

  // Above maximum (muted roles like comments): use clampContrast binary search
  if (max !== undefined && currentContrast > max) {
    return coreClampContrast(roleColor, againstColor, max);
  }

  return roleColor;
}

/**
 * Enforce comment contrast against both bg1 AND bg3.
 * Comments appear in both main editor (bg1) and gutter (bg3).
 *
 * Iterates up to 30 times, using ensureContrast/clampContrast from color-generator
 * against whichever background is the binding constraint each iteration.
 * Accepts optional min/max overrides (from the spec's ContrastConstraint).
 */
export function enforceCommentContrast(
  comment: OklchColor,
  bg1: OklchColor,
  bg3: OklchColor,
  mode: ThemeMode,
  options?: { min?: number; max?: number },
): OklchColor {
  const minContrast = options?.min ?? (mode === 'dark' ? 2.5 : 1.5);
  const maxContrast = options?.max ?? (mode === 'dark' ? 3.5 : 3.0);

  let adjusted = comment;

  for (let i = 0; i < 30; i++) {
    const c1 = contrast(adjusted, bg1);
    const c2 = contrast(adjusted, bg3);
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);

    if (minC >= minContrast && maxC <= maxContrast) break;

    if (maxC > maxContrast) {
      // Too prominent — clamp against the BG it contrasts with most
      const bindingBg = c1 >= c2 ? bg1 : bg3;
      adjusted = coreClampContrast(adjusted, bindingBg, maxContrast);
    } else if (minC < minContrast) {
      // Too faint — push contrast up against the BG it contrasts with least
      const bindingBg = c1 <= c2 ? bg1 : bg3;
      adjusted = coreEnsureContrast(adjusted, bindingBg, minContrast);
    }
  }

  return adjusted;
}

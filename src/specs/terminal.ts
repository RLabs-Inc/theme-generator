import {
  UI_ROLES,
  STATUS_ROLES,
  buildAnsiRolesFree,
  buildAnsiRolesConstrained,
} from '../constraints.js';
import type {
  ThemeSpec,
  RoleDefinition,
  DerivedDefinition,
  ContrastConstraint,
  TerminalSpecOptions,
} from '../types.js';

const ANSI_BASE_NAMES = [
  'ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow',
  'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite',
];

/** Cursor role — any hue/chroma, contrast enforced via constraint */
const CURSOR_ROLE: RoleDefinition = {
  name: 'cursor',
  priority: 68, // Between ac1 (70) and ac2 (65)
  dark:  { l: [0, 1.0], c: [0, 0.40] },
  light: { l: [0, 1.0], c: [0, 0.40] },
};

/**
 * Create a ThemeSpec for terminal emulators (Warp, Ghostty, WezTerm, Kitty, etc.).
 *
 * Includes:
 * - Core UI roles (bg1–bg3, fg1–fg3, ac1, ac2, border)
 * - Cursor role (5.5 contrast vs bg1 by default)
 * - 4 status roles (info, error, warning, success)
 * - 8 ANSI base colors (free or hue-constrained)
 *
 * Derived:
 * - 8 bright ANSI variants (+0.10L from each base)
 * - selectionBg (40% fg1 + 60% bg1 blend)
 * - cursorText (copy of bg1 — block cursor shows bg color as text)
 *
 * No syntax or comment roles — terminals don't display code tokens.
 */
export function createTerminalSpec(options?: TerminalSpecOptions): ThemeSpec {
  const ansiMode     = options?.ansiMode      ?? 'free';
  const contrastFg   = options?.contrastFg    ?? 7.5;
  const contrastAnsi = options?.contrastAnsi  ?? 4.5;
  const contrastCursor = options?.contrastCursor ?? 5.5;

  // ── Roles ────────────────────────────────────────────────────────────────

  const ansiRoles = ansiMode === 'constrained'
    ? buildAnsiRolesConstrained()
    : buildAnsiRolesFree();

  const roles: RoleDefinition[] = [
    ...UI_ROLES,
    CURSOR_ROLE,
    ...STATUS_ROLES,
    ...ansiRoles,
  ];

  // ── Derived Colors ────────────────────────────────────────────────────────

  // Bright ANSI: each base ANSI lightened by +0.10L (standard terminal convention)
  const brightAnsiDerived: DerivedDefinition[] = ANSI_BASE_NAMES.map((name) => ({
    name: name.replace('ansi', 'ansiBright'),
    transform: { type: 'adjustLightness' as const, source: name, delta: 0.10 },
  }));

  const derived: DerivedDefinition[] = [
    ...brightAnsiDerived,
    // Selection: 40% fg1, 60% bg1 — calibrated in OKLCH for perceptual balance
    { name: 'selectionBg', transform: { type: 'blend', a: 'fg1', b: 'bg1', amount: 0.40 } },
    // Selection text: same as fg1 — readable on the blended selection background
    { name: 'selectionFg', transform: { type: 'copy', source: 'fg1' } },
    // Cursor text: bg1 copy — block cursor renders text in background color
    { name: 'cursorText', transform: { type: 'copy', source: 'bg1' } },
  ];

  // ── Cross-Role Contrast Constraints ───────────────────────────────────────

  const constraints: ContrastConstraint[] = [
    // Core foreground — terminals enforce AAA (7.5) by default
    { role: 'fg1', against: 'bg1', min: contrastFg },
    { role: 'fg2', against: 'bg1', min: 5.5 },
    // Accents — decorative, lower threshold
    { role: 'ac1', against: 'bg1', min: 2.5 },
    { role: 'ac2', against: 'bg1', min: 2.5 },
    // Cursor must be clearly visible against background
    { role: 'cursor', against: 'bg1', min: contrastCursor },
    // Status colors
    { role: 'info',    against: 'bg1', min: 4.5 },
    { role: 'error',   against: 'bg1', min: 4.5 },
    { role: 'warning', against: 'bg1', min: 4.5 },
    { role: 'success', against: 'bg1', min: 4.5 },
    // ANSI base colors
    ...ANSI_BASE_NAMES.map((name) => ({
      role: name, against: 'bg1', min: contrastAnsi,
    })),
  ];

  return {
    name: 'terminal',
    roles,
    derived,
    constraints,
    ansiMode,
  };
}

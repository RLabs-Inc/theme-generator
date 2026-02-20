import {
  UI_ROLES,
  STATUS_ROLES,
  buildSyntaxRoles,
  buildAnsiRolesFree,
  buildAnsiRolesConstrained,
  SYNTAX_ROLE_NAMES,
} from '../constraints.js';
import type {
  ThemeSpec,
  RoleDefinition,
  DerivedDefinition,
  ContrastConstraint,
  HelixSpecOptions,
} from '../types.js';

const ANSI_BASE_NAMES = [
  'ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow',
  'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite',
];

/** Cursor role — same priority/constraints as Zed (priority 68, any L/C) */
const CURSOR_ROLE: RoleDefinition = {
  name: 'cursor',
  priority: 68,
  dark:  { l: [0, 1.0], c: [0, 0.40] },
  light: { l: [0, 1.0], c: [0, 0.40] },
};

/**
 * Create a ThemeSpec for the Helix editor.
 *
 * Helix is a modal editor with built-in terminal emulator and tree-sitter
 * syntax highlighting. Its theme format maps closely to Zed in terms of
 * role coverage — block cursor, ANSI terminal colors, full syntax palette.
 *
 * Includes:
 * - Core UI roles (bg1–bg3, fg1–fg3, ac1, ac2, border)
 * - Cursor role (priority 68, 5.5 contrast vs bg1 by default)
 * - 4 status roles (info, error, warning, success)
 * - 42 syntax roles with hue groups (tree-sitter scopes)
 * - 8 ANSI base colors (for integrated terminal, free or constrained)
 *
 * Derived:
 * - 8 bright ANSI variants (+0.10L from each base)
 * - selectionBg   — ac2 with hex alpha '50' (semi-transparent selection overlay)
 * - selectionFg   — copy of fg1
 * - lineHighlight — ac1 with hex alpha '50' (active line highlight)
 * - findMatch     — ac2 with hex alpha '4d' (search match overlay)
 * - cursorText    — copy of bg1 (block cursor renders text in background color)
 * - ac1Fg         — adaptive foreground for ac1 backgrounds
 * - ac2Fg         — adaptive foreground for ac2 backgrounds
 * - infoFg / warningFg / errorFg / successFg — adaptive foregrounds for status colors
 *
 * Comment receives dual-BG contrast enforcement in extract() automatically.
 */
export function createHelixSpec(options?: HelixSpecOptions): ThemeSpec {
  const ansiMode       = options?.ansiMode       ?? 'free';
  const contrastFg     = options?.contrastFg     ?? 7.5;
  const contrastSyntax = options?.contrastSyntax ?? 5.5;
  const commentMin     = options?.commentMin     ?? 2.5;
  const commentMax     = options?.commentMax     ?? 3.5;
  const contrastCursor = 5.5;

  // ── Roles ──────────────────────────────────────────────────────────────────

  const ansiRoles = ansiMode === 'constrained'
    ? buildAnsiRolesConstrained()
    : buildAnsiRolesFree();

  const roles: RoleDefinition[] = [
    ...UI_ROLES,
    CURSOR_ROLE,
    ...STATUS_ROLES,
    ...buildSyntaxRoles(),
    ...ansiRoles,
  ];

  // ── Derived Colors ─────────────────────────────────────────────────────────

  const brightAnsiDerived: DerivedDefinition[] = ANSI_BASE_NAMES.map((name) => ({
    name: name.replace('ansi', 'ansiBright'),
    transform: { type: 'adjustLightness' as const, source: name, delta: 0.10 },
  }));

  const derived: DerivedDefinition[] = [
    ...brightAnsiDerived,
    // Editor overlays
    { name: 'selectionBg',   transform: { type: 'withHexAlpha' as const, source: 'ac2', hexAlpha: '50' } },
    { name: 'selectionFg',   transform: { type: 'copy'         as const, source: 'fg1' } },
    { name: 'lineHighlight', transform: { type: 'withHexAlpha' as const, source: 'ac1', hexAlpha: '50' } },
    { name: 'findMatch',     transform: { type: 'withHexAlpha' as const, source: 'ac2', hexAlpha: '4d' } },
    // Cursor text: bg1 copy — block cursor renders text in background color
    { name: 'cursorText',    transform: { type: 'copy'         as const, source: 'bg1' } },
    // Adaptive foregrounds for accent/status backgrounds
    { name: 'ac1Fg',     transform: { type: 'adaptiveFg' as const, background: 'ac1'     } },
    { name: 'ac2Fg',     transform: { type: 'adaptiveFg' as const, background: 'ac2'     } },
    { name: 'infoFg',    transform: { type: 'adaptiveFg' as const, background: 'info'    } },
    { name: 'warningFg', transform: { type: 'adaptiveFg' as const, background: 'warning' } },
    { name: 'errorFg',   transform: { type: 'adaptiveFg' as const, background: 'error'   } },
    { name: 'successFg', transform: { type: 'adaptiveFg' as const, background: 'success' } },
  ];

  // ── Cross-Role Contrast Constraints ───────────────────────────────────────

  const syntaxNonComment = SYNTAX_ROLE_NAMES.filter((n) => n !== 'comment');

  const constraints: ContrastConstraint[] = [
    // Core UI
    { role: 'fg1',     against: 'bg1', min: contrastFg },
    { role: 'fg2',     against: 'bg1', min: 5.5 },
    { role: 'ac1',     against: 'bg1', min: 2.5 },
    { role: 'ac2',     against: 'bg1', min: 2.5 },
    // Cursor
    { role: 'cursor',  against: 'bg1', min: contrastCursor },
    // Status
    { role: 'info',    against: 'bg1', min: 4.5 },
    { role: 'error',   against: 'bg1', min: 4.5 },
    { role: 'warning', against: 'bg1', min: 4.5 },
    { role: 'success', against: 'bg1', min: 4.5 },
    // Comment — dual-BG enforcement in extract()
    { role: 'comment', against: 'bg1', min: commentMin, max: commentMax },
    // All non-comment syntax roles
    ...syntaxNonComment.map((name) => ({ role: name, against: 'bg1' as const, min: contrastSyntax })),
    // ANSI base colors
    ...ANSI_BASE_NAMES.map((name) => ({ role: name, against: 'bg1' as const, min: 4.5 })),
  ];

  return {
    name: 'helix',
    roles,
    derived,
    constraints,
    ansiMode,
  };
}

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
  NvimSpecOptions,
} from '../types.js';

const ANSI_BASE_NAMES = [
  'ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow',
  'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite',
];

/** Cursor role — Neovim's `Cursor` highlight group */
const CURSOR_ROLE: RoleDefinition = {
  name: 'cursor',
  priority: 68,
  dark:  { l: [0, 1.0], c: [0, 0.40] },
  light: { l: [0, 1.0], c: [0, 0.40] },
};

/**
 * Create a ThemeSpec for Neovim.
 *
 * Neovim extends Vim with a built-in terminal emulator (`:terminal`) and
 * the ability to set the terminal ANSI palette directly from a colorscheme
 * via `vim.g.terminal_color_0` through `vim.g.terminal_color_15`. This is
 * the key distinction from VimSpec: Nvim includes full ANSI color roles.
 *
 * Includes:
 * - Core UI roles (bg1–bg3, fg1–fg3, ac1, ac2, border)
 * - Cursor role (priority 68, 5.5 contrast vs bg1 by default)
 *   → maps to Neovim's `Cursor` highlight group
 * - 4 status roles (info, error, warning, success)
 * - 42 syntax roles with hue groups (TreeSitter + legacy groups)
 * - 8 ANSI base colors → `vim.g.terminal_color_0..7` (free or constrained)
 *
 * Derived:
 * - 8 bright ANSI variants (+0.10L) → `vim.g.terminal_color_8..15`
 * - selectionBg   — ac2 with hex alpha '50' (Visual highlight background)
 * - selectionFg   — copy of fg1 (Visual highlight foreground)
 * - lineHighlight — ac1 with hex alpha '50' (CursorLine background)
 * - findMatch     — ac2 with hex alpha '4d' (Search match highlight)
 * - cursorText    — copy of bg1 (block cursor text color = background)
 * - ac1Fg         — adaptive foreground for ac1 backgrounds
 * - ac2Fg         — adaptive foreground for ac2 backgrounds
 * - infoFg / warningFg / errorFg / successFg — adaptive foregrounds
 *
 * Comment receives dual-BG contrast enforcement in extract() automatically.
 */
export function createNvimSpec(options?: NvimSpecOptions): ThemeSpec {
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
    // ANSI base colors → terminal_color_0..7
    ...ANSI_BASE_NAMES.map((name) => ({ role: name, against: 'bg1' as const, min: 4.5 })),
  ];

  return {
    name: 'nvim',
    roles,
    derived,
    constraints,
    ansiMode,
  };
}

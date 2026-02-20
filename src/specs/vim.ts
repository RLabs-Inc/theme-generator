import {
  UI_ROLES,
  STATUS_ROLES,
  buildSyntaxRoles,
  SYNTAX_ROLE_NAMES,
} from '../constraints.js';
import type {
  ThemeSpec,
  RoleDefinition,
  DerivedDefinition,
  ContrastConstraint,
  VimSpecOptions,
} from '../types.js';

/** Cursor role — Vim's `Cursor` highlight group (block cursor by default) */
const CURSOR_ROLE: RoleDefinition = {
  name: 'cursor',
  priority: 68,
  dark:  { l: [0, 1.0], c: [0, 0.40] },
  light: { l: [0, 1.0], c: [0, 0.40] },
};

/**
 * Create a ThemeSpec for Vim.
 *
 * Vim operates in 24-bit color via `termguicolors` — its colorscheme defines
 * highlight groups (Normal, Comment, Keyword, Function, Visual, etc.) that
 * map directly to the roles here. Unlike Neovim, Vim colorschemes do NOT
 * control the terminal ANSI palette (no `g:terminal_color_*`), so ANSI roles
 * are excluded from this spec.
 *
 * Includes:
 * - Core UI roles (bg1–bg3, fg1–fg3, ac1, ac2, border)
 * - Cursor role (priority 68, 5.5 contrast vs bg1 by default)
 *   → maps to Vim's `Cursor` highlight group
 * - 4 status roles (info, error, warning, success)
 * - 42 syntax roles with hue groups
 *
 * Derived:
 * - selectionBg   — ac2 with hex alpha '50' (Visual highlight background)
 * - selectionFg   — copy of fg1 (Visual highlight foreground)
 * - lineHighlight — ac1 with hex alpha '50' (CursorLine background)
 * - findMatch     — ac2 with hex alpha '4d' (Search match highlight)
 * - cursorText    — copy of bg1 (block cursor text color = background)
 * - ac1Fg         — adaptive foreground for ac1 backgrounds
 * - ac2Fg         — adaptive foreground for ac2 backgrounds
 * - infoFg / warningFg / errorFg / successFg — adaptive foregrounds
 *
 * Note: No ANSI roles or bright ANSI derived — Vim colorschemes do not
 * control terminal color slots. Use NvimSpec for Neovim themes that need
 * ANSI via `g:terminal_color_*` variables.
 *
 * Comment receives dual-BG contrast enforcement in extract() automatically.
 */
export function createVimSpec(options?: VimSpecOptions): ThemeSpec {
  const contrastFg     = options?.contrastFg     ?? 7.5;
  const contrastSyntax = options?.contrastSyntax ?? 5.5;
  const commentMin     = options?.commentMin     ?? 2.5;
  const commentMax     = options?.commentMax     ?? 3.5;
  const contrastCursor = 5.5;

  // ── Roles ──────────────────────────────────────────────────────────────────

  const roles: RoleDefinition[] = [
    ...UI_ROLES,
    CURSOR_ROLE,
    ...STATUS_ROLES,
    ...buildSyntaxRoles(),
    // NOTE: No ANSI roles — Vim colorschemes do not set terminal color slots.
  ];

  // ── Derived Colors ─────────────────────────────────────────────────────────

  const derived: DerivedDefinition[] = [
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
  ];

  return {
    name: 'vim',
    roles,
    derived,
    constraints,
    ansiMode: 'free', // ansiMode is irrelevant for Vim (no ANSI roles) but required by ThemeSpec
  };
}

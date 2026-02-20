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
  VSCodeSpecOptions,
} from '../types.js';

const ANSI_BASE_NAMES = [
  'ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow',
  'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite',
];

/**
 * Create a ThemeSpec for Visual Studio Code.
 *
 * Includes:
 * - Core UI roles (bg1–bg3, fg1–fg3, ac1, ac2, border)
 * - 4 status roles (info, error, warning, success)
 * - 42 syntax roles with hue groups (function/call share hue, variable family shares hue, etc.)
 * - 8 ANSI base colors (for integrated terminal, free or constrained)
 *
 * Derived:
 * - 8 bright ANSI variants (+0.10L from each base)
 * - selectionBg   — ac2 with hex alpha '50' (semi-transparent selection overlay)
 * - selectionFg   — copy of fg1
 * - lineHighlight — ac1 with hex alpha '50' (semi-transparent active line)
 * - findMatch     — ac2 with hex alpha '4d' (semi-transparent search match)
 * - ac1Fg         — adaptive foreground for ac1 backgrounds (badge text, title bar, etc.)
 * - ac2Fg         — adaptive foreground for ac2 backgrounds (status bar text, etc.)
 * - infoFg        — adaptive foreground for info-colored backgrounds
 * - warningFg     — adaptive foreground for warning-colored backgrounds
 * - errorFg       — adaptive foreground for error-colored backgrounds
 * - successFg     — adaptive foreground for success-colored backgrounds
 *
 * Comment receives dual-BG contrast enforcement in extract() automatically —
 * contrast is checked and clamped against both bg1 (editor area) and bg3 (gutter).
 */
export function createVSCodeSpec(options?: VSCodeSpecOptions): ThemeSpec {
  const ansiMode       = options?.ansiMode       ?? 'free';
  const contrastFg     = options?.contrastFg     ?? 7.5;
  const contrastSyntax = options?.contrastSyntax ?? 5.5;
  // Comment defaults: dark-mode safe values (2.5/3.5). Light-mode callers may pass 1.5/3.0.
  const commentMin     = options?.commentMin     ?? 2.5;
  const commentMax     = options?.commentMax     ?? 3.5;

  // ── Roles ──────────────────────────────────────────────────────────────────

  const ansiRoles = ansiMode === 'constrained'
    ? buildAnsiRolesConstrained()
    : buildAnsiRolesFree();

  const roles: RoleDefinition[] = [
    ...UI_ROLES,
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
    // Editor overlays — semi-transparent accent colors
    { name: 'selectionBg',   transform: { type: 'withHexAlpha' as const, source: 'ac2', hexAlpha: '50' } },
    { name: 'selectionFg',   transform: { type: 'copy'         as const, source: 'fg1' } },
    { name: 'lineHighlight', transform: { type: 'withHexAlpha' as const, source: 'ac1', hexAlpha: '50' } },
    { name: 'findMatch',     transform: { type: 'withHexAlpha' as const, source: 'ac2', hexAlpha: '4d' } },
    // Adaptive foregrounds — correct FG1/FG3 for text ON TOP of accent backgrounds
    // Mirrors RLabs getAC1Foreground/getAC2Foreground/getINFOForeground/etc.
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
    // Status
    { role: 'info',    against: 'bg1', min: 4.5 },
    { role: 'error',   against: 'bg1', min: 4.5 },
    { role: 'warning', against: 'bg1', min: 4.5 },
    { role: 'success', against: 'bg1', min: 4.5 },
    // Comment — dual-BG enforcement: extract() automatically enforces against both bg1 AND bg3
    { role: 'comment', against: 'bg1', min: commentMin, max: commentMax },
    // All non-comment syntax roles
    ...syntaxNonComment.map((name) => ({ role: name, against: 'bg1' as const, min: contrastSyntax })),
    // ANSI base colors (integrated terminal)
    ...ANSI_BASE_NAMES.map((name) => ({ role: name, against: 'bg1' as const, min: 4.5 })),
  ];

  return {
    name: 'vscode',
    roles,
    derived,
    constraints,
    ansiMode,
  };
}

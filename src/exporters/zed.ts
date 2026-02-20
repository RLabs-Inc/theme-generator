import type { ThemePalette, ZedExporterOptions } from '../types.js';

// ── Syntax Token Type ──────────────────────────────────────────────────────────

interface ThemeTokenStyle {
  color: string;
  font_style: 'italic' | 'oblique' | null;
  font_weight: 'bold' | null;
}

function token(
  color: string,
  fontStyle?: 'italic' | 'oblique' | null,
  fontWeight?: 'bold' | null,
): ThemeTokenStyle {
  return {
    color,
    font_style: fontStyle ?? null,
    font_weight: fontWeight ?? null,
  };
}

// ── Main Exporter ──────────────────────────────────────────────────────────────

/**
 * Export a ThemePalette to Zed editor JSON theme format.
 *
 * Produces a complete `.json` theme file string containing:
 * - Theme colors (~100 UI color keys)
 * - Status colors (14 groups x 3 properties each)
 * - Players (6 cursor/selection pairs)
 * - Syntax highlighting (~35 token types)
 *
 * Role mapping (palette to Zed):
 * - bg1/bg2/bg3         = background / surface / element backgrounds
 * - fg1/fg2             = text / text_muted
 * - ac1/ac2             = accent colors (border_selected, text_accent, status bar)
 * - border              = panel borders, ignored_border
 * - cursor              = primary player cursor (Zed spec adds dedicated cursor role)
 * - info/warning/error/success = status and diagnostic colors
 * - selectionBg         = (unused directly — player selections use per-cursor alpha)
 * - lineHighlight       = editor active line background (includes alpha)
 * - findMatch           = search match background (includes alpha)
 * - comment             = text_placeholder, hidden/ignored/predictive status
 * - ansiBlack..ansiWhite, ansiBrightBlack..ansiBrightWhite = terminal ANSI palette
 * - all syntax roles    = syntax token colors
 *
 * Conforms to https://zed.dev/schema/themes/v0.2.0.json
 *
 * @param palette - Resolved ThemePalette from extract() using createZedSpec()
 * @param options - Optional name, author
 * @returns JSON string ready to save as a `.json` Zed color theme file
 */
export function exportZed(palette: ThemePalette, options?: ZedExporterOptions): string {
  const name   = options?.name ?? palette.spec;
  const author = options?.author ?? 'RLabs Theme Generator';

  // Convenience helpers
  const h = (role: string) => palette.hex(role) || '#000000';
  /**
   * Apply a 2-char hex alpha to a role's hex string.
   * Mirrors RLabs getColorWithOpacity: if the color already has alpha (#RRGGBBAA),
   * the existing alpha is replaced; otherwise the alpha is appended.
   */
  const a = (role: string, alpha: string) => {
    const hex = h(role);
    return hex.length > 7 ? hex.slice(0, -2) + alpha : hex + alpha;
  };

  const theme = {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name,
    author,
    themes: [
      {
        name,
        appearance: palette.mode,
        style: {
          window_background_appearance: 'opaque' as const,
          accents: [h('ac1'), h('ac2'), h('info'), h('success'), h('warning'), h('error')],
          colors:  buildColors(h, a),
          status:  buildStatus(h, a),
          players: buildPlayers(h, a),
          syntax:  buildSyntax(h),
        },
      },
    ],
  };

  return JSON.stringify(theme, null, 2);
}

// ── Theme Colors ───────────────────────────────────────────────────────────────

function buildColors(
  h: (role: string) => string,
  a: (role: string, alpha: string) => string,
): Record<string, string> {
  return {
    // ── Borders ──────────────────────────────────────────────────────────────
    border_selected:  h('ac1'),
    border_transparent: '#00000000',
    border_disabled:  a('comment', '80'),

    // ── Surface Backgrounds ──────────────────────────────────────────────────
    elevated_surface_background: h('bg2'),
    surface_background: h('bg2'),
    background:         h('bg1'),

    // ── Element States ───────────────────────────────────────────────────────
    element_background: h('bg3'),
    element_hover:      a('ac2', '40'),
    element_active:     a('ac2', '60'),
    element_selected:   a('ac2', '50'),
    element_disabled:   a('comment', '60'),
    drop_target_background: a('bg2', '66'),

    // ── Ghost Element States ─────────────────────────────────────────────────
    ghost_element_background: '#00000000',
    ghost_element_hover:      a('ac2', '30'),
    ghost_element_selected:   a('ac2', '40'),
    ghost_element_disabled:   a('comment', '40'),

    // ── Text Colors ──────────────────────────────────────────────────────────
    text:             h('fg1'),
    text_muted:       h('fg2'),
    text_placeholder: h('comment'),
    text_disabled:    a('comment', '80'),
    text_accent:      h('ac2'),

    // ── Icon Colors ──────────────────────────────────────────────────────────
    icon:             h('fg1'),
    icon_muted:       h('fg2'),
    icon_disabled:    a('comment', '80'),
    icon_placeholder: h('comment'),
    icon_accent:      h('ac2'),

    // ── Debug ────────────────────────────────────────────────────────────────
    debugger_accent: h('warning'),

    // ── UI Element Backgrounds ───────────────────────────────────────────────
    status_bar_background:         h('ac2'),
    title_bar_background:          h('bg2'),
    title_bar_inactive_background: a('bg2', '90'),
    toolbar_background:            h('bg1'),
    tab_bar_background:            h('bg2'),
    tab_inactive_background:       h('bg3'),
    tab_active_background:         h('bg1'),

    // ── Search ───────────────────────────────────────────────────────────────
    search_match_background: h('findMatch'),

    // ── Panel & Pane ─────────────────────────────────────────────────────────
    panel_background:           h('bg3'),
    panel_focused_border:       h('border'),
    panel_indent_guide:         a('border', '60'),
    panel_indent_guide_hover:   h('ac2'),
    panel_indent_guide_active:  h('comment'),
    pane_focused_border:        h('ac2'),
    pane_group_border:          h('border'),

    // ── Scrollbar ────────────────────────────────────────────────────────────
    scrollbar_thumb_background:       a('ac2', '33'),
    scrollbar_thumb_hover_background: a('ac2', '50'),
    scrollbar_thumb_active_background: a('ac2', '70'),
    scrollbar_thumb_border:           a('ac2', '20'),
    scrollbar_track_background:       h('bg1'),
    scrollbar_track_border:           a('border', '30'),

    // ── Minimap ──────────────────────────────────────────────────────────────
    minimap_thumb_background:         a('ac2', '30'),
    minimap_thumb_hover_background:   a('ac2', '50'),
    minimap_thumb_active_background:  a('ac2', '70'),

    // ── Editor ───────────────────────────────────────────────────────────────
    editor_foreground:          h('fg1'),
    editor_background:          h('bg1'),
    editor_gutter_background:   h('bg1'),
    editor_subheader_background: h('bg3'),
    editor_active_line_background:          h('lineHighlight'),
    editor_highlighted_line_background:     a('lineHighlight', 'cc'),
    editor_debugger_active_line_background: a('warning', '30'),
    editor_line_number:          h('comment'),
    editor_active_line_number:   h('ac1'),
    editor_hover_line_number:    h('fg2'),
    editor_invisible:            a('comment', '50'),
    editor_wrap_guide:           a('border', '40'),
    editor_active_wrap_guide:    h('ac2'),
    editor_indent_guide:         a('comment', '40'),
    editor_indent_guide_active:  h('comment'),
    editor_document_highlight_read_background:    a('info', '25'),
    editor_document_highlight_write_background:   a('ac1', '30'),
    editor_document_highlight_bracket_background: a('ac1', '40'),

    // ── Terminal ─────────────────────────────────────────────────────────────
    terminal_background:          h('bg1'),
    terminal_foreground:          h('fg1'),
    terminal_ansi_background:     h('bg1'),
    terminal_bright_foreground:   h('fg1'),
    terminal_dim_foreground:      h('fg2'),
    terminal_ansi_black:          h('ansiBlack'),
    terminal_ansi_bright_black:   h('ansiBrightBlack'),
    terminal_ansi_dim_black:      h('ansiBlack'),
    terminal_ansi_red:            h('ansiRed'),
    terminal_ansi_bright_red:     h('ansiBrightRed'),
    terminal_ansi_dim_red:        h('ansiRed'),
    terminal_ansi_green:          h('ansiGreen'),
    terminal_ansi_bright_green:   h('ansiBrightGreen'),
    terminal_ansi_dim_green:      h('ansiGreen'),
    terminal_ansi_yellow:         h('ansiYellow'),
    terminal_ansi_bright_yellow:  h('ansiBrightYellow'),
    terminal_ansi_dim_yellow:     h('ansiYellow'),
    terminal_ansi_blue:           h('ansiBlue'),
    terminal_ansi_bright_blue:    h('ansiBrightBlue'),
    terminal_ansi_dim_blue:       h('ansiBlue'),
    terminal_ansi_magenta:        h('ansiMagenta'),
    terminal_ansi_bright_magenta: h('ansiBrightMagenta'),
    terminal_ansi_dim_magenta:    h('ansiMagenta'),
    terminal_ansi_cyan:           h('ansiCyan'),
    terminal_ansi_bright_cyan:    h('ansiBrightCyan'),
    terminal_ansi_dim_cyan:       h('ansiCyan'),
    terminal_ansi_white:          h('ansiWhite'),
    terminal_ansi_bright_white:   h('ansiBrightWhite'),
    terminal_ansi_dim_white:      h('ansiWhite'),

    // ── Links ────────────────────────────────────────────────────────────────
    link_text_hover: h('info'),

    // ── Version Control ──────────────────────────────────────────────────────
    version_control_added:         h('success'),
    version_control_deleted:       h('error'),
    version_control_modified:      h('info'),
    version_control_renamed:       h('ac1'),
    version_control_conflict:      h('warning'),
    version_control_ignored:       h('comment'),
    version_control_word_added:    a('success', '40'),
    version_control_word_deleted:  a('error', '40'),
    version_control_conflict_marker_ours:   a('info', '50'),
    version_control_conflict_marker_theirs: a('success', '50'),
  };
}

// ── Status Colors ──────────────────────────────────────────────────────────────

function buildStatus(
  h: (role: string) => string,
  a: (role: string, alpha: string) => string,
): Record<string, string> {
  return {
    // Conflict
    conflict:            h('warning'),
    conflict_background: a('warning', '30'),
    conflict_border:     h('warning'),

    // Created
    created:            h('success'),
    created_background: a('success', '30'),
    created_border:     h('success'),

    // Deleted
    deleted:            h('error'),
    deleted_background: a('error', '30'),
    deleted_border:     h('error'),

    // Error
    error:            h('error'),
    error_background: a('error', '30'),
    error_border:     h('error'),

    // Hidden
    hidden:            h('comment'),
    hidden_background: '#00000000',
    hidden_border:     '#00000000',

    // Hint
    hint:            h('info'),
    hint_background: a('info', '20'),
    hint_border:     h('info'),

    // Ignored
    ignored:            h('comment'),
    ignored_background: a('comment', '20'),
    ignored_border:     h('border'),

    // Info
    info:            h('info'),
    info_background: a('info', '30'),
    info_border:     h('info'),

    // Modified
    modified:            h('info'),
    modified_background: a('info', '30'),
    modified_border:     h('info'),

    // Predictive (AI features)
    predictive:            h('comment'),
    predictive_background: a('comment', '20'),
    predictive_border:     h('border'),

    // Renamed
    renamed:            h('ac1'),
    renamed_background: a('ac1', '30'),
    renamed_border:     h('ac1'),

    // Success
    success:            h('success'),
    success_background: a('success', '30'),
    success_border:     h('success'),

    // Unreachable
    unreachable:            h('error'),
    unreachable_background: a('error', '20'),
    unreachable_border:     h('error'),

    // Warning
    warning:            h('warning'),
    warning_background: a('warning', '30'),
    warning_border:     h('warning'),
  };
}

// ── Players ────────────────────────────────────────────────────────────────────

function buildPlayers(
  h: (role: string) => string,
  a: (role: string, alpha: string) => string,
): Array<{ cursor: string; selection: string; background: string }> {
  // Player 0 uses the dedicated cursor role; remaining players use accent/status colors
  const playerRoles = ['cursor', 'ac1', 'ac2', 'info', 'warning', 'success'];
  return playerRoles.map((role) => ({
    cursor:     h(role),
    selection:  a(role, '40'),
    background: h(role),
  }));
}

// ── Syntax Highlighting ────────────────────────────────────────────────────────

function buildSyntax(h: (role: string) => string): Record<string, ThemeTokenStyle> {
  return {
    attribute:               token(h('attribute')),
    boolean:                 token(h('language')),
    comment:                 token(h('comment'), 'italic'),
    'comment.doc':           token(h('comment'), 'italic'),
    constant:                token(h('constant')),
    constructor:             token(h('function')),
    embedded:                token(h('fg2')),
    emphasis:                token(h('fg1'), 'italic'),
    'emphasis.strong':       token(h('fg1'), null, 'bold'),
    enum:                    token(h('type')),
    function:                token(h('function')),
    hint:                    token(h('info')),
    keyword:                 token(h('keyword')),
    label:                   token(h('class')),
    link_text:               token(h('info')),
    link_uri:                token(h('info'), 'italic'),
    number:                  token(h('constant')),
    operator:                token(h('operator')),
    predictive:              token(h('comment'), 'italic'),
    preproc:                 token(h('modifier')),
    primary:                 token(h('fg1')),
    property:                token(h('property')),
    punctuation:             token(h('punctuation')),
    'punctuation.bracket':   token(h('punctuationBrace')),
    'punctuation.delimiter': token(h('punctuationComma')),
    'punctuation.list_marker': token(h('punctuation')),
    'punctuation.special':   token(h('punctuationQuote')),
    string:                  token(h('fg1')),
    'string.escape':         token(h('language')),
    'string.regex':          token(h('fg2')),
    'string.special':        token(h('ac2')),
    'string.special.symbol': token(h('ac1')),
    tag:                     token(h('tag')),
    'text.literal':          token(h('fg2')),
    title:                   token(h('fg1'), null, 'bold'),
    type:                    token(h('type')),
    variable:                token(h('variable')),
    'variable.special':      token(h('language')),
    variant:                 token(h('variableProperty')),
  };
}

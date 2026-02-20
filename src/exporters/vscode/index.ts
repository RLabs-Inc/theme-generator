import type { ThemePalette, VSCodeExporterOptions } from '../../types.js';
import { buildTokenColors } from './token-colors.js';
import { buildSemanticColors } from './semantic-colors.js';

/**
 * Export a ThemePalette to Visual Studio Code JSON theme format.
 *
 * Produces a complete `.json` theme file string containing:
 * - ~200 UI color keys (workbench, editor, terminal, status bar, etc.)
 * - tokenColors — TextMate grammar scope rules for 20+ languages
 * - semanticTokenColors — LSP semantic token rules
 *
 * Role mapping (palette to VSCode):
 * - bg1/bg2/bg3         = editor/sidebar/panel backgrounds
 * - fg1/fg2/fg3         = foreground levels
 * - ac1/ac2             = accent colors (activity bar, status bar, badges)
 * - border              = widget borders
 * - info/warning/error/success = status and diagnostic colors
 * - selectionBg         = editor selection background (includes alpha)
 * - lineHighlight       = current-line highlight (includes alpha)
 * - findMatch           = search match highlight (includes alpha)
 * - ac1Fg/ac2Fg/infoFg/warningFg/errorFg = adaptive foregrounds for colored backgrounds
 * - ansiBlack…ansiWhite, ansiBrightBlack…ansiBrightWhite = integrated terminal ANSI palette
 * - all syntax roles    = tokenColors and semanticTokenColors
 *
 * @param palette - Resolved ThemePalette from extract() using createVSCodeSpec()
 * @param options - Optional name, author, semanticHighlighting flag
 * @returns JSON string ready to save as a `.json` VS Code color theme file
 */
export function exportVSCode(palette: ThemePalette, options?: VSCodeExporterOptions): string {
  const name                 = options?.name ?? palette.spec;
  const semanticHighlighting = options?.semanticHighlighting ?? true;

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

  const c = { h, a };

  const theme = {
    name,
    type:              palette.mode,           // 'dark' | 'light'
    semanticClass:     'theme.rlabs',
    semanticHighlighting,
    colors:            buildUIColors(h, a),
    tokenColors:       buildTokenColors(c),
    semanticTokenColors: buildSemanticColors(c),
  };

  return JSON.stringify(theme, null, 2);
}

// ── UI Colors ─────────────────────────────────────────────────────────────────

function buildUIColors(
  h: (role: string) => string,
  a: (role: string, alpha: string) => string,
): Record<string, string> {
  return {
    // ── Integrated Terminal ──────────────────────────────────────────────────
    'terminal.background':                   h('bg1'),
    'terminal.foreground':                   h('fg1'),
    'terminal.border':                       h('border'),
    'terminal.ansiBrightBlack':              h('ansiBrightBlack'),
    'terminal.ansiBrightRed':                h('ansiBrightRed'),
    'terminal.ansiBrightGreen':              h('ansiBrightGreen'),
    'terminal.ansiBrightYellow':             h('ansiBrightYellow'),
    'terminal.ansiBrightBlue':               h('ansiBrightBlue'),
    'terminal.ansiBrightMagenta':            h('ansiBrightMagenta'),
    'terminal.ansiBrightCyan':               h('ansiBrightCyan'),
    'terminal.ansiBrightWhite':              h('ansiBrightWhite'),
    'terminal.ansiBlack':                    h('ansiBlack'),
    'terminal.ansiRed':                      h('ansiRed'),
    'terminal.ansiGreen':                    h('ansiGreen'),
    'terminal.ansiYellow':                   h('ansiYellow'),
    'terminal.ansiBlue':                     h('ansiBlue'),
    'terminal.ansiMagenta':                  h('ansiMagenta'),
    'terminal.ansiCyan':                     h('ansiCyan'),
    'terminal.ansiWhite':                    h('ansiWhite'),
    'terminal.selectionBackground':          h('selectionBg'),
    'terminal.inactiveSelectionBackground':  h('selectionBg'),
    'terminalCursor.foreground':             h('ac2'),

    // ── Base Colors ──────────────────────────────────────────────────────────
    'focusBorder':                           h('border'),
    'foreground':                            h('fg1'),
    'disabledForeground':                    h('comment'),
    'widget.border':                         h('border'),
    'widget.shadow-sm':                      h('border'),
    'selection.background':                  h('selectionBg'),
    'descriptionForeground':                 h('fg2'),
    'errorForeground':                       h('error'),

    // ── Text Document ────────────────────────────────────────────────────────
    'textBlockQuote.background':             h('bg3'),
    'textBlockQuote.border':                 h('border'),
    'textCodeBlock.background':              h('bg3'),
    'textLink.activeForeground':             h('info'),
    'textLink.foreground':                   h('ac2'),
    'textPreformat.foreground':              h('fg1'),
    'textPreformat.background':              h('bg3'),
    'textSeparator.foreground':              h('fg1'),

    // ── Button Control ───────────────────────────────────────────────────────
    'button.background':                     a('ac2', 'db'),
    'button.foreground':                     h('ac2Fg'),
    'button.hoverBackground':                h('ac2'),
    'button.secondaryBackground':            a('ac1', 'db'),
    'button.secondaryForeground':            h('ac1Fg'),
    'button.secondaryHoverBackground':       h('ac1'),
    'checkbox.background':                   h('bg1'),
    'checkbox.foreground':                   h('fg1'),
    'checkbox.border':                       h('comment'),

    // ── Dropdown Control ─────────────────────────────────────────────────────
    'dropdown.background':                   h('bg3'),
    'dropdown.listBackground':               h('bg3'),
    'dropdown.border':                       h('comment'),
    'dropdown.foreground':                   h('fg1'),

    // ── Input Control ────────────────────────────────────────────────────────
    'input.background':                      h('bg1'),
    'input.foreground':                      h('fg1'),
    'input.border':                          h('comment'),
    'input.placeholderForeground':           h('comment'),
    'inputOption.activeBorder':              h('ac1'),
    'inputValidation.infoBorder':            h('info'),
    'inputValidation.warningBorder':         h('warning'),
    'inputValidation.errorBorder':           h('error'),

    // ── Scroll Bar ───────────────────────────────────────────────────────────
    'scrollbar.shadow-sm':                   h('border'),

    // ── Badge ────────────────────────────────────────────────────────────────
    'badge.foreground':                      h('ac2Fg'),
    'badge.background':                      h('ac2'),

    // ── Progress Bar ─────────────────────────────────────────────────────────
    'progressBar.background':                h('ac1'),

    // ── Lists & Trees ────────────────────────────────────────────────────────
    'list.activeSelectionBackground':        a('ac2', '50'),
    'list.activeSelectionForeground':        h('fg1'),
    'list.inactiveSelectionBackground':      a('ac2', '40'),
    'list.inactiveSelectionForeground':      h('fg2'),
    'list.inactiveFocusBackground':          h('bg2'),
    'list.dropBackground':                   h('bg3'),
    'list.dropBetweenBackground':            h('border'),
    'list.focusBackground':                  a('ac2', '50'),
    'list.focusForeground':                  h('fg1'),
    'list.highlightForeground':              h('ac1'),
    'list.hoverBackground':                  a('ac2', '30'),
    'list.hoverForeground':                  h('fg1'),
    'list.warningForeground':                h('warning'),
    'list.errorForeground':                  h('error'),
    'tree.indentGuidesStroke':               h('ac1'),
    'tree.inactiveIndentGuidesStroke':       h('lineHighlight'),
    'tree.tableColumnsBorder':               h('lineHighlight'),
    'tree.tableOddRowsBackground':           h('bg3'),
    'listFilterWidget.background':           h('bg3'),
    'listFilterWidget.outline':              h('border'),
    'listFilterWidget.noMatchesOutline':     h('error'),
    'listFilterWidget.shadow-sm':            h('border'),

    // ── Activity Bar ─────────────────────────────────────────────────────────
    'activityBar.background':                h('bg2'),
    'activityBar.inactiveForeground':        h('comment'),
    'activityBar.foreground':                h('fg1'),
    'activityBar.activeBorder':              h('ac1'),
    'activityBar.activeBackground':          h('lineHighlight'),
    'activityBarBadge.background':           h('ac2'),
    'activityBarBadge.foreground':           h('ac2Fg'),
    'activityBarTop.foreground':             h('fg1'),

    // ── Side Bar ─────────────────────────────────────────────────────────────
    'sideBar.border':                        h('border'),
    'sideBar.foreground':                    h('fg2'),
    'sideBar.background':                    h('bg3'),
    'sideBarTitle.foreground':               h('fg1'),
    'sideBarTitle.background':               h('bg3'),
    'sideBarSectionHeader.background':       h('bg2'),
    'sideBarSectionHeader.border':           h('border'),
    'sideBarActivityBarTop.border':          h('border'),
    'sideBarStickyScroll.background':        h('bg3'),
    'sideBarStickyScroll.border':            h('border'),
    'sideBarStickyScroll.shadow-sm':         h('border'),

    // ── Minimap ──────────────────────────────────────────────────────────────
    'minimap.background':                    h('bg1'),

    // ── Editor Groups & Tabs ─────────────────────────────────────────────────
    'editorGroup.border':                    h('border'),
    'editorGroup.dropBackground':            h('bg3'),
    'editorGroup.emptyBackground':           h('bg1'),
    'editorGroupHeader.tabsBackground':      h('bg1'),
    'editorGroupHeader.border':              h('border'),
    'tab.activeBackground':                  h('bg2'),
    'tab.activeForeground':                  h('fg1'),
    'tab.border':                            h('border'),
    'tab.activeBorderTop':                   h('ac1'),
    'tab.selectedBackground':                h('lineHighlight'),
    'tab.inactiveBackground':                h('bg3'),
    'tab.inactiveForeground':                h('comment'),
    'tab.hoverBackground':                   a('bg2', '80'),
    'tab.hoverForeground':                   h('fg1'),

    // ── Editor ───────────────────────────────────────────────────────────────
    'editor.background':                     h('bg1'),
    'editor.foreground':                     h('fg1'),
    'editor.lineHighlightBackground':        h('lineHighlight'),
    'editorLineNumber.foreground':           h('comment'),
    'editorLineNumber.activeForeground':     h('ac1'),
    'editorLineNumber.dimmedForeground':     a('comment', '90'),
    'editorCursor.background':               h('lineHighlight'),
    'editorCursor.foreground':               h('ac1'),
    'editorMultiCursor.primary.foreground':  h('ac1'),
    'editorMultiCursor.primary.background':  h('lineHighlight'),
    'editorMultiCursor.secondary.foreground': h('fg1'),
    'editorMultiCursor.secondary.background': h('lineHighlight'),
    'editor.selectionBackground':            h('selectionBg'),
    'editor.selectionForeground':            h('fg1'),
    'editor.inactiveSelectionBackground':    a('selectionBg', '30'),
    'editor.selectionHighlightBackground':   h('selectionBg'),
    'editor.foldBackground':                 h('lineHighlight'),
    'editor.foldPlaceholderForeground':      h('fg1'),
    'editor.placeholder.foreground':         h('fg2'),
    'editorWhitespace.foreground':           h('lineHighlight'),
    'editorRuler.foreground':                h('lineHighlight'),

    // Indent Guides
    'editorIndentGuide.activeBackground1':   h('ac1'),
    'editorIndentGuide.background1':         h('lineHighlight'),

    // Highlights
    'editor.hoverHighlightBackground':       h('lineHighlight'),
    'editor.wordHighlightBackground':        h('lineHighlight'),
    'editor.wordHighlightStrongBackground':  a('lineHighlight', '50'),
    'editor.wordHighlightTextBackground':    h('lineHighlight'),
    'editorUnicodeHighlight.background':     h('lineHighlight'),
    'editorLink.activeForeground':           h('info'),
    'editor.rangeHighlightBackground':       h('lineHighlight'),
    'editor.symbolHighlightBackground':      h('lineHighlight'),

    // Find
    'editor.findMatchBackground':            h('findMatch'),
    'editor.findMatchForeground':            h('fg1'),
    'editor.findMatchHighlightBackground':   h('findMatch'),
    'editor.findMatchHighlightForeground':   h('fg1'),
    'editor.findRangeHighlightBackground':   h('selectionBg'),
    'editor.findMatchBorder':                h('comment'),

    // Snippets
    'editor.snippetTabstopHighlightBackground':      h('lineHighlight'),
    'editor.snippetFinalTabstopHighlightBackground': h('lineHighlight'),

    // Code Lens
    'editorCodeLens.foreground':             h('comment'),
    'editorInlayHint.background':            h('bg3'),

    // Gutter
    'editorGutter.background':               h('bg1'),
    'editorGutter.modifiedBackground':       h('info'),
    'editorGutter.addedBackground':          h('success'),
    'editorGutter.deletedBackground':        h('error'),
    'editorGutter.commentRangeForeground':   h('comment'),

    // ── Editor Widgets ───────────────────────────────────────────────────────
    'editorWidget.background':               h('bg3'),
    'editorWidget.foreground':               h('fg1'),
    'editorWidget.border':                   h('border'),
    'editorSuggestWidget.background':        h('bg3'),
    'editorSuggestWidget.border':            h('border'),
    'editorSuggestWidget.foreground':        h('comment'),
    'editorSuggestWidget.highlightForeground': h('fg1'),
    'editorSuggestWidget.selectedBackground': a('ac2', '60'),
    'editorSuggestWidget.focusHighlightForeground': h('fg1'),
    'editorSuggestWidget.selectedForeground': h('ac2Fg'),
    'editorHoverWidget.background':          h('bg3'),
    'editorHoverWidget.foreground':          h('fg1'),
    'editorHoverWidget.border':              h('border'),
    'editorHoverWidget.highlightForeground': h('fg1'),
    'editorHoverWidget.statusBarBackground': h('bg3'),

    // Marker Navigation
    'editorMarkerNavigation.background':        h('bg2'),
    'editorMarkerNavigationError.background':   h('bg2'),
    'editorMarkerNavigationWarning.background': h('bg2'),

    // ── Diff Editor ──────────────────────────────────────────────────────────
    'diffEditor.insertedTextBackground':     a('info', '50'),
    'diffEditor.insertedTextBorder':         h('info'),
    'diffEditor.removedTextBackground':      a('error', '50'),
    'diffEditor.removedTextBorder':          h('error'),
    'diffEditor.diagonalFill':               h('info'),
    'diffEditor.insertedLineBackground':     a('info', '40'),
    'diffEditor.removedLineBackground':      a('error', '40'),
    'diffEditorGutter.insertedLineBackground': h('info'),
    'diffEditorGutter.removedLineBackground': h('error'),

    // ── Error / Squiggles ────────────────────────────────────────────────────
    'editorError.foreground':                h('error'),
    'editorWarning.foreground':              h('warning'),
    'editorInfo.foreground':                 h('info'),
    'editorHint.foreground':                 h('success'),

    // ── Peek View ────────────────────────────────────────────────────────────
    'peekView.border':                       h('ac2'),
    'peekViewEditor.background':             h('bg1'),
    'peekViewEditor.matchHighlightBackground': h('findMatch'),
    'peekViewResult.background':             h('bg1'),
    'peekViewResult.fileForeground':         h('fg1'),
    'peekViewResult.lineForeground':         h('fg1'),
    'peekViewResult.matchHighlightBackground': h('lineHighlight'),
    'peekViewResult.selectionBackground':    h('selectionBg'),
    'peekViewResult.selectionForeground':    h('fg1'),
    'peekViewTitle.background':              h('bg1'),
    'peekViewTitleDescription.foreground':   h('fg2'),
    'peekViewTitleLabel.foreground':         h('fg1'),

    // ── Merge Conflicts ──────────────────────────────────────────────────────
    'merge.currentHeaderBackground':         a('info', '40'),
    'merge.currentContentBackground':        a('info', '20'),
    'merge.incomingHeaderBackground':        a('success', '40'),
    'merge.incomingContentBackground':       a('success', '20'),
    'merge.border':                          h('border'),
    'editorOverviewRuler.border':            h('border'),
    'editorOverviewRuler.currentContentForeground': h('info'),
    'editorOverviewRuler.incomingContentForeground': h('success'),
    'editorOverviewRuler.commonContentForeground':   h('fg1'),
    'editorOverviewRuler.commentForeground': h('comment'),
    'editorOverviewRuler.infoForeground':    h('info'),
    'editorOverviewRuler.addedForeground':   h('success'),
    'editorOverviewRuler.deletedForeground': h('error'),
    'editorOverviewRuler.errorForeground':   h('error'),
    'editorOverviewRuler.warningForeground': h('warning'),
    'editorOverviewRuler.findMatchForeground': h('fg1'),
    'editorOverviewRuler.rangeHighlightForeground': h('lineHighlight'),
    'editorOverviewRuler.selectionHighlightForeground': h('selectionBg'),
    'editorOverviewRuler.wordHighlightForeground': h('lineHighlight'),
    'editorOverviewRuler.wordHighlightStrongForeground': h('lineHighlight'),
    'editorOverviewRuler.modifiedForeground': h('info'),
    'mergeEditor.change.background':         h('warning'),

    // ── Panel ────────────────────────────────────────────────────────────────
    'panel.background':                      h('bg2'),
    'panel.border':                          h('ac1'),
    'panelTitle.activeBorder':               h('ac1'),
    'panelTitle.activeForeground':           h('fg1'),
    'panelTitle.inactiveForeground':         h('comment'),
    'panelInput.border':                     h('comment'),

    // ── Status Bar ───────────────────────────────────────────────────────────
    'statusBar.background':                  h('ac2'),
    'statusBar.foreground':                  h('ac2Fg'),
    'statusBar.debuggingBackground':         h('warning'),
    'statusBar.debuggingForeground':         h('warningFg'),
    'statusBar.noFolderBackground':          h('fg2'),
    'statusBar.noFolderForeground':          h('fg3'),
    'statusBarItem.activeBackground':        a('ac2', 'aa'),
    'statusBarItem.hoverBackground':         a('ac2', 'aa'),
    'statusBarItem.prominentForeground':     h('ac2Fg'),
    'statusBarItem.prominentBackground':     a('ac2', 'aa'),
    'statusBarItem.prominentHoverForeground': h('ac2Fg'),
    'statusBarItem.prominentHoverBackground': a('ac2', 'aa'),
    'statusBarItem.remoteForeground':        h('ac1Fg'),
    'statusBarItem.remoteBackground':        h('ac1'),
    'statusBarItem.remoteHoverBackground':   a('ac1', 'aa'),
    'statusBarItem.errorBackground':         h('error'),
    'statusBarItem.errorForeground':         h('errorFg'),
    'statusBarItem.errorHoverBackground':    a('error', 'aa'),
    'statusBarItem.warningBackground':       h('warning'),
    'statusBarItem.warningForeground':       h('warningFg'),
    'statusBarItem.warningHoverBackground':  a('warning', 'aa'),

    // ── Title Bar ────────────────────────────────────────────────────────────
    'titleBar.activeBackground':             h('bg2'),
    'titleBar.activeForeground':             h('fg1'),
    'titleBar.inactiveBackground':           h('bg2'),
    'titleBar.inactiveForeground':           h('comment'),

    // ── Extensions ───────────────────────────────────────────────────────────
    'extensionButton.prominentForeground':   h('ac2Fg'),
    'extensionButton.prominentBackground':   a('ac2', 'aa'),
    'extensionButton.prominentHoverBackground': h('ac2'),

    // ── Notifications ────────────────────────────────────────────────────────
    'notifications.foreground':             h('fg1'),
    'notifications.background':             h('bg2'),
    'notifications.border':                 h('border'),
    'notificationLink.foreground':          h('info'),
    'notificationsErrorIcon.foreground':    h('error'),
    'notificationsWarningIcon.foreground':  h('warning'),
    'notificationsInfoIcon.foreground':     h('info'),

    // ── Quick Picker ─────────────────────────────────────────────────────────
    'pickerGroup.border':                    h('ac2'),
    'pickerGroup.foreground':                h('class'),

    // ── Debug ────────────────────────────────────────────────────────────────
    'debugToolBar.background':               h('info'),
    'debugToolBar.foreground':               h('infoFg'),

    // ── Settings ─────────────────────────────────────────────────────────────
    'settings.headerForeground':             h('fg1'),
    'settings.modifiedItemIndicator':        h('warning'),
    'settings.inactiveSelectedItemBorder':   h('border'),
    'settings.dropdownBackground':           h('bg1'),
    'settings.dropdownForeground':           h('fg1'),
    'settings.dropdownBorder':               h('comment'),
    'settings.checkboxBackground':           h('bg1'),
    'settings.checkboxForeground':           h('fg1'),
    'settings.checkboxBorder':               h('comment'),
    'settings.textInputBackground':          h('bg1'),
    'settings.textInputForeground':          h('fg1'),
    'settings.textInputBorder':              h('comment'),
    'settings.numberInputBackground':        h('bg1'),
    'settings.numberInputForeground':        h('fg1'),
    'settings.numberInputBorder':            h('comment'),
    'settings.rowHoverBackground':           a('lineHighlight', '40'),
    'settings.focusedRowBackground':         a('lineHighlight', '50'),
    'settings.focusedRowBorder':             h('border'),
    'settings.headerBorder':                 h('border'),
    'settings.settingsHeaderHoverForeground': h('fg1'),

    // ── Git Decoration ───────────────────────────────────────────────────────
    'gitDecoration.addedResourceForeground':      h('success'),
    'gitDecoration.modifiedResourceForeground':   h('info'),
    'gitDecoration.deletedResourceForeground':    h('error'),
    'gitDecoration.renamedResourceForeground':    h('ac1'),
    'gitDecoration.stageModifiedResourceForeground': h('info'),
    'gitDecoration.stageDeletedResourceForeground':  h('error'),
    'gitDecoration.untrackedResourceForeground': h('comment'),
    'gitDecoration.ignoredResourceForeground':   h('comment'),
    'gitDecoration.conflictingResourceForeground': h('warning'),
    'gitDecoration.submoduleResourceForeground': h('info'),

    // ── Breadcrumbs ──────────────────────────────────────────────────────────
    'breadcrumb.background':                 h('bg2'),
    'breadcrumb.foreground':                 h('comment'),
    'breadcrumb.activeForeground':           h('fg1'),
    'breadcrumb.focusForeground':            h('fg1'),
    'breadcrumb.activeSelectionForeground':  h('fg1'),
    'breadcrumbPicker.background':           h('bg2'),

    // ── Charts ───────────────────────────────────────────────────────────────
    'charts.foreground':                     h('fg1'),
    'charts.lines':                          h('fg2'),
    'charts.red':                            h('error'),
    'charts.blue':                           h('info'),
    'charts.yellow':                         h('warning'),
    'charts.orange':                         h('ac1'),
    'charts.green':                          h('success'),
    'charts.purple':                         h('ansiMagenta'),
  };
}

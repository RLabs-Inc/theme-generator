import * as p from '@clack/prompts';
import color from 'picocolors';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { generate, getAllPatterns, type OklchColor } from '@rlabs-inc/color-generator';

import {
  extract,
  createTerminalSpec,
  createVSCodeSpec,
  createZedSpec,
  createHelixSpec,
  createVimSpec,
  createNvimSpec,
  exportWarp,
  exportGhostty,
  exportWezTerm,
  exportVSCode,
  exportZed,
  exportVim,
  exportNvim,
  exportHelix,
  type ThemePalette,
  type ThemeMode,
  type ThemeSpec,
} from './index.js';

// ── ANSI True-Color Helpers ──────────────────────────────────────────────────

const RST = '\x1b[0m';

function bgHex(hex: string): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `\x1b[48;2;${r};${g};${b}m`;
}

function fgHex(hex: string): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

// ── ANSI Width Helpers ──────────────────────────────────────────────────────

/** Strip ANSI escape codes for visible width measurement */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}


// ── Neofetch-Style Terminal Preview ─────────────────────────────────────────

// Apple macOS ASCII art — canonical fastfetch logo with 6 color zones
const ART_RAW: string[] = [
  "                     ..'",
  "                 ,xNMM.",
  "               .OMMMMo",
  '               lMM"',
  "     .;loddo:.  .olloddol;.",
  "   cKMMMMMMMMMMNWMMMMMMMMMM0:",
  " .KMMMMMMMMMMMMMMMMMMMMMMMWd.",
  " XMMMMMMMMMMMMMMMMMMMMMMMX.",
  ";MMMMMMMMMMMMMMMMMMMMMMMM:",
  ":MMMMMMMMMMMMMMMMMMMMMMMM:",
  ".MMMMMMMMMMMMMMMMMMMMMMMMX.",
  " kMMMMMMMMMMMMMMMMMMMMMMMMWd.",
  " 'XMMMMMMMMMMMMMMMMMMMMMMMMMMk",
  "  'XMMMMMMMMMMMMMMMMMMMMMMMMK.",
  "    kMMMMMMMMMMMMMMMMMMMMMMd",
  "     ;KMMMMMMMWXXWMMMMMMMk.",
  '       "cooc*"    "*coo\'"',
];

const ART_WIDTH = 36;

// Left-align art, right-pad to ART_WIDTH
const ART = ART_RAW.map(l => l + ' '.repeat(Math.max(0, ART_WIDTH - l.length)));

// ANSI color names in palette order (0-7)
const ANSI_NAMES = ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White'];

// ── Target-Specific Swatch Definitions ──────────────────────────────────────

/** Per-target UI swatches — only show what that target actually exports */
function getTargetSwatches(targetName: string): [string, string][][] {
  switch (targetName) {
    case 'warp':
      return [
        [['bg1', 'bg '], ['fg1', 'fg '], ['cursor', 'cur'], ['ac1', 'acc']],
      ];
    case 'ghostty':
      return [
        [['bg1', 'bg '], ['fg1', 'fg '], ['cursor', 'cur']],
        [['selectionBg', 'sel'], ['selectionFg', 'sfg']],
      ];
    case 'wezterm':
      return [
        [['bg1', 'bg '], ['fg1', 'fg '], ['cursor', 'cur']],
        [['cursorText', 'cfg'], ['selectionBg', 'sel'], ['selectionFg', 'sfg']],
      ];
    case 'vscode':
    case 'zed':
    case 'helix':
    case 'vim':
    case 'nvim':
      return [
        [['bg1', 'bg '], ['bg2', 'bg2'], ['fg1', 'fg '], ['ac1', 'ac1']],
        [['keyword', 'kwd'], ['function', 'fn '], ['string', 'str'], ['type', 'typ']],
        [['comment', 'cmt'], ['variable', 'var'], ['storage', 'sto'], ['number', 'num']],
        [['property', 'prp'], ['operator', 'opr'], ['error', 'err'], ['warning', 'wrn']],
      ];
    default:
      return [
        [['bg1', 'bg '], ['fg1', 'fg '], ['cursor', 'cur']],
      ];
  }
}

// ── Themed Preview ──────────────────────────────────────────────────────────

const PREVIEW_WIDTH = 76;
const GAP = 3;

/** Pad a line to PREVIEW_WIDTH on bg1, with ANSI resets */
function bgLine(bg: string, content: string): string {
  const vis = stripAnsi(content).length;
  const pad = Math.max(0, PREVIEW_WIDTH - vis);
  return `${bgHex(bg)}${content}${' '.repeat(pad)}${RST}`;
}

// ANSI bold/unbold
const BOLD = '\x1b[1m';
const UNBOLD = '\x1b[22m';

// ANSI dim
const DIM = '\x1b[2m';
const UNDIM = '\x1b[22m';

/** Flatten swatch definitions into a vertical list: [{label, hex}] */
function getSwatchList(palette: ThemePalette, targetName: string): { label: string; hex: string }[] {
  const h = (role: string): string => palette.hex(role) || '';
  const rows = getTargetSwatches(targetName);
  const items: { label: string; hex: string }[] = [];
  for (const row of rows) {
    for (const [role, label] of row) {
      const hex = h(role);
      if (hex) items.push({ label: label.trim(), hex });
    }
  }
  return items;
}

/** Width of a swatch cell: "  lbl ██" */
const SWATCH_COL_WIDTH = 10;

/** Render one swatch cell: dim label + colored block */
function swatchCell(label: string, hex: string): string {
  return `  ${color.dim(label.padEnd(3))} ${bgHex(hex)}  ${RST}`;
}

/** Empty swatch cell (just spaces to keep alignment) */
function swatchEmpty(): string {
  return ' '.repeat(SWATCH_COL_WIDTH);
}

/**
 * Render a neofetch-style preview matching the RLabs web version:
 * Apple logo with 6 color zones, bold command context, neofetch-style info,
 * bold Color/Bright labels, bold prompt, and vertical swatch column on the right.
 */
function renderThemedPreview(
  palette: ThemePalette,
  targetLabel: string,
  targetName: string,
  patternName: string,
  hue: number,
  mode: ThemeMode,
): string {
  const h = (role: string): string => palette.hex(role) || '';
  const bg = h('bg1') || '#1a1a2e';
  const fg1 = h('fg1') || '#cccccc';

  // ANSI palette
  const ansiNormal = ANSI_NAMES.map(n => h(`ansi${n}`));
  const ansiBright = ANSI_NAMES.map(n => h(`ansiBright${n}`));

  // 6 color zones matching fastfetch's macOS logo ($1-$6)
  const artZones: [number, string][] = [
    [6,  h('ansiGreen')   || fg1],   // lines 0-5:   stem + upper apple
    [2,  h('ansiYellow')  || fg1],   // lines 6-7:   widening body
    [2,  h('ansiRed')     || fg1],   // lines 8-9:   body middle
    [2,  h('ansiMagenta') || fg1],   // lines 10-11: lower body
    [2,  h('ansiBlue')    || fg1],   // lines 12-13: narrowing
    [3,  h('ansiCyan')    || fg1],   // lines 14-16: bottom + stem base
  ];

  // ── Art: Apple logo with 6 fastfetch color zones ──────────────────────

  const artColored: string[] = [];
  let lineIdx = 0;
  for (const [count, zoneColor] of artZones) {
    for (let j = 0; j < count && lineIdx < ART.length; j++, lineIdx++) {
      artColored.push(`${BOLD}${fgHex(zoneColor)}${ART[lineIdx]}${UNBOLD}`);
    }
  }

  // ── Info column (right side) — neofetch style ───────────────────────────

  const brightGreen = h('ansiBrightGreen') || fg1;
  const brightYellow = h('ansiBrightYellow') || fg1;

  const info: string[] = [];
  info.push('');                                                                    // 0

  // Header: bold root@sacred-colors in bright green (like real neofetch)
  info.push(`${BOLD}${fgHex(brightGreen)}root${UNBOLD}${fgHex(fg1)}@${BOLD}${fgHex(brightGreen)}sacred-colors${UNBOLD}`);
  info.push(`${fgHex(fg1)}--------------------`);                                   // 2

  // Key-value pairs: bold bright-yellow keys (matching web's <b> tags)
  const kv = (key: string, val: string) =>
    `${BOLD}${fgHex(brightYellow)}${key}${UNBOLD}${fgHex(fg1)}: ${val}`;
  info.push(kv('Host', 'sacred-colors.dev'));                                       // 3
  info.push(kv('Pattern', patternName));                                            // 4
  info.push(kv('Hue', `${hue}\u00b0`));                                            // 5
  info.push(kv('Mode', mode));                                                      // 6
  info.push(kv('Terminal', targetLabel));                                            // 7
  info.push('');                                                                    // 8

  // Bold Color 1-8 / Bright 1-8 labels — bold makes terminal colors pop
  for (let i = 0; i < 8; i++) {
    const normal = ansiNormal[i] || fg1;
    const bright = ansiBright[i] || fg1;
    info.push(
      `${BOLD}${fgHex(normal)}Color ${i + 1}${UNBOLD}` +
      `  ` +
      `${BOLD}${fgHex(bright)}Bright ${i + 1}${UNBOLD}`,
    );
  }

  info.push('');                                                                    // 17

  // Pad info to match art height
  while (info.length < ART.length) info.push('');

  // ── Merge columns: art + gap + info ─────────────────────────────────────

  const mainLines = artColored.map((art, i) =>
    bgLine(bg, art + ' '.repeat(GAP) + (info[i] || '')),
  );

  // ── Execution context (matching web: dim path + bold command) ──────────

  const brightBlack = h('ansiBrightBlack') || '#666666';
  const contextLine = `  ${DIM}${fgHex(brightBlack)}~/Documents (0.016s)${UNDIM}`;
  const commandLine = `  ${BOLD}${fgHex(fg1)}neofetch${UNBOLD}`;

  // ── Fake terminal prompt (matching web: bold magenta path, yellow git) ─

  const pMagenta = h('ansiMagenta') || fg1;
  const pYellow = h('ansiYellow') || fg1;
  const pCur = h('cursor') || fg1;

  const promptPath =
    `  ${BOLD}${fgHex(pMagenta)}~/themes${UNBOLD} ` +
    `${fgHex(pYellow)}git:(${BOLD}main${UNBOLD}${fgHex(pYellow)})`;

  const promptCmd =
    `  ${fgHex(fg1)}echo "Welcome to Sacred Colors!"${bgHex(pCur)} ${bgHex(bg)}`;

  // ── All preview lines (bg1 painted) ────────────────────────────────────

  const bgLines = [
    bgLine(bg, contextLine),
    bgLine(bg, commandLine),
    ...mainLines,
    bgLine(bg, ''),
    bgLine(bg, promptPath),
    bgLine(bg, promptCmd),
  ];

  // ── Swatch column (vertical, right of bg1 area) ───────────────────────

  const swatches = getSwatchList(palette, targetName);
  // Start swatches a few lines down to align with the info area
  const SWATCH_START = 4;

  // Every line gets the swatch column (cell or empty) for consistent width
  return bgLines.map((line, i) => {
    const si = i - SWATCH_START;
    if (si >= 0 && si < swatches.length) {
      return line + swatchCell(swatches[si].label, swatches[si].hex);
    }
    return line + swatchEmpty();
  }).join('\n');
}

// ── Syntax-Highlighted Code Snippet ──────────────────────────────────────────

// Token: [visibleText, paletteRole]
type CodeToken = [string, string];

// TypeScript snippet that exercises many syntax roles:
// keyword, storage, function, string, type, comment, variable, property, operator, number
const EDITOR_CODE: CodeToken[][] = [
  // 1: import { generate } from '@sacred/colors';
  [['import', 'keyword'], [' { ', 'fg1'], ['generate', 'function'], [' } ', 'fg1'], ['from', 'keyword'], [' ', 'fg1'], ["'@sacred/colors'", 'string'], [';', 'fg1']],
  // 2: (empty)
  [],
  // 3: // Sacred geometry color generation
  [['// Sacred geometry color generation', 'comment']],
  // 4: interface ThemeConfig {
  [['interface', 'keyword'], [' ', 'fg1'], ['ThemeConfig', 'type'], [' {', 'fg1']],
  // 5:   pattern: string;
  [['  ', 'fg1'], ['pattern', 'property'], [': ', 'fg1'], ['string', 'type'], [';', 'fg1']],
  // 6:   hue: number;
  [['  ', 'fg1'], ['hue', 'property'], [': ', 'fg1'], ['number', 'type'], [';', 'fg1']],
  // 7:   dark: boolean;
  [['  ', 'fg1'], ['dark', 'property'], [': ', 'fg1'], ['boolean', 'type'], [';', 'fg1']],
  // 8: }
  [['}', 'fg1']],
  // 9: (empty)
  [],
  // 10: export function createTheme(cfg: ThemeConfig) {
  [['export', 'keyword'], [' ', 'fg1'], ['function', 'storage'], [' ', 'fg1'], ['createTheme', 'function'], ['(', 'fg1'], ['cfg', 'variable'], [': ', 'fg1'], ['ThemeConfig', 'type'], [') {', 'fg1']],
  // 11:   const { pattern, hue } = cfg;
  [['  ', 'fg1'], ['const', 'storage'], [' { ', 'fg1'], ['pattern', 'variable'], [', ', 'fg1'], ['hue', 'variable'], [' } ', 'fg1'], ['= ', 'operator'], ['cfg', 'variable'], [';', 'fg1']],
  // 12:   const count = 16;
  [['  ', 'fg1'], ['const', 'storage'], [' ', 'fg1'], ['count', 'variable'], [' ', 'fg1'], ['=', 'operator'], [' ', 'fg1'], ['16', 'number'], [';', 'fg1']],
  // 13:   const colors = generate(pattern, { hue, count });
  [['  ', 'fg1'], ['const', 'storage'], [' ', 'fg1'], ['colors', 'variable'], [' ', 'fg1'], ['=', 'operator'], [' ', 'fg1'], ['generate', 'function'], ['(', 'fg1'], ['pattern', 'variable'], [', { ', 'fg1'], ['hue', 'variable'], [', ', 'fg1'], ['count', 'variable'], [' });', 'fg1']],
  // 14:   return { name: `Sacred ${hue}°`, colors };
  [['  ', 'fg1'], ['return', 'keyword'], [' { ', 'fg1'], ['name', 'property'], [': ', 'fg1'], ['`Sacred ${', 'string'], ['hue', 'variable'], ["}°`", 'string'], [', ', 'fg1'], ['colors', 'variable'], [' };', 'fg1']],
  // 15: }
  [['}', 'fg1']],
];

// ── Editor Preview (VSCode, Zed) ────────────────────────────────────────────

/**
 * Render a code editor preview: tab bar, syntax-highlighted TypeScript,
 * and a status bar — showing how the theme looks on actual code.
 */
function renderEditorPreview(
  palette: ThemePalette,
  _targetLabel: string,
  targetName: string,
  _patternName: string,
  _hue: number,
  _mode: ThemeMode,
): string {
  const h = (role: string): string => palette.hex(role) || '';
  const bg1 = h('bg1') || '#1a1a2e';
  const bg2 = h('bg2') || '#252547';
  const fg1 = h('fg1') || '#cccccc';
  const fg2 = h('fg2') || '#999999';
  const fg3 = h('fg3') || '#666666';
  const ac1 = h('ac1') || '#7c3aed';

  // Resolve palette role to hex, falling back to fg1
  const rc = (role: string): string => h(role) || fg1;

  // Render a tokenized code line into ANSI-colored text
  const renderCode = (tokens: CodeToken[]): string =>
    tokens.map(([text, role]) => `${fgHex(rc(role))}${text}`).join('');

  const lines: string[] = [];

  // ── Tab Bar (bg2) ──────────────────────────────────────────────────────

  const fileIcon = `${fgHex(h('type') || ac1)}\u25CB`; // ○ icon in type color
  const tabActive = `${fileIcon} ${BOLD}${fgHex(fg1)}theme.ts${UNBOLD}`;
  const tabInactive = `${fgHex(fg3)}colors.ts`;
  const langLabel = `${fgHex(fg2)}TypeScript`;
  lines.push(bgLine(bg2, `  ${fgHex(ac1)}\u2590 ${tabActive}   ${tabInactive}${''.padEnd(32)}${langLabel}  `));

  // ── Code Area (bg1) ────────────────────────────────────────────────────

  for (let i = 0; i < EDITOR_CODE.length; i++) {
    const lineNum = String(i + 1).padStart(3);
    const sep = `${fgHex(fg3)} \u2502 `;
    const code = EDITOR_CODE[i].length > 0 ? renderCode(EDITOR_CODE[i]) : '';
    lines.push(bgLine(bg1, ` ${fgHex(fg3)}${lineNum}${sep}${code}`));
  }

  // ── Status Bar (bg2) ───────────────────────────────────────────────────

  const branch = `${fgHex(h('success') || ac1)}\u25CF ${fgHex(fg2)}main`;
  const pos = `${fgHex(fg2)}Ln 10, Col 1`;
  const encoding = `${fgHex(fg3)}UTF-8   LF`;
  const errorCount = `${fgHex(h('error') || '#ff5555')}\u2716 0`;
  const warnCount = `${fgHex(h('warning') || '#ffaa00')}\u26A0 0`;
  lines.push(bgLine(bg2, `  ${branch}   ${errorCount}  ${warnCount}${''.padEnd(18)}${pos}   ${encoding}  `));

  // ── Swatch column ──────────────────────────────────────────────────────

  const swatches = getSwatchList(palette, targetName);
  const SWATCH_START = 2;

  return lines.map((line, i) => {
    const si = i - SWATCH_START;
    if (si >= 0 && si < swatches.length) {
      return line + swatchCell(swatches[si].label, swatches[si].hex);
    }
    return line + swatchEmpty();
  }).join('\n');
}

// ── Vim/Neovim/Helix Preview ────────────────────────────────────────────────

/**
 * Render a terminal editor preview: line numbers, syntax-highlighted code,
 * tilde empty lines, status line with file info, and mode indicator —
 * showing how the theme looks inside a terminal editor.
 */
function renderVimPreview(
  palette: ThemePalette,
  _targetLabel: string,
  targetName: string,
  _patternName: string,
  _hue: number,
  _mode: ThemeMode,
): string {
  const h = (role: string): string => palette.hex(role) || '';
  const bg1 = h('bg1') || '#1a1a2e';
  const bg2 = h('bg2') || '#252547';
  const fg1 = h('fg1') || '#cccccc';
  const fg2 = h('fg2') || '#999999';
  const fg3 = h('fg3') || '#666666';
  const ac1 = h('ac1') || '#7c3aed';

  const rc = (role: string): string => h(role) || fg1;
  const renderCode = (tokens: CodeToken[]): string =>
    tokens.map(([text, role]) => `${fgHex(rc(role))}${text}`).join('');

  const lines: string[] = [];

  // ── Code Area (bg1) ────────────────────────────────────────────────────

  for (let i = 0; i < EDITOR_CODE.length; i++) {
    const lineNum = String(i + 1).padStart(3);
    const sep = `${fgHex(fg3)} \u2502 `;
    const code = EDITOR_CODE[i].length > 0 ? renderCode(EDITOR_CODE[i]) : '';
    lines.push(bgLine(bg1, ` ${fgHex(fg3)}${lineNum}${sep}${code}`));
  }

  // ── Tilde lines (empty buffer) ─────────────────────────────────────────

  const tildeColor = fgHex(h('ansiBlue') || fg3);
  lines.push(bgLine(bg1, ` ${tildeColor}  ~`));
  lines.push(bgLine(bg1, ` ${tildeColor}  ~`));

  // ── Status Line (bg2) ──────────────────────────────────────────────────

  const fileName = `${BOLD}${fgHex(fg1)} theme.ts${UNBOLD}`;
  const modified = `${fgHex(h('warning') || fg2)}[+]`;
  const bufInfo = `${fgHex(fg2)}15L, 402B`;
  const posInfo = `${fgHex(fg1)}10,1`;
  const pctInfo = `${fgHex(fg2)}All`;
  lines.push(bgLine(bg2, `${fileName} ${modified}${''.padEnd(30)}${bufInfo}${''.padEnd(6)}${posInfo}${''.padEnd(5)}${pctInfo} `));

  // ── Mode / Command Area (bg1) ──────────────────────────────────────────

  const modeColor = fgHex(ac1);
  lines.push(bgLine(bg1, ` ${BOLD}${modeColor}-- NORMAL --${UNBOLD}`));

  // ── Swatch column ──────────────────────────────────────────────────────

  const swatches = getSwatchList(palette, targetName);
  const SWATCH_START = 1;

  return lines.map((line, i) => {
    const si = i - SWATCH_START;
    if (si >= 0 && si < swatches.length) {
      return line + swatchCell(swatches[si].label, swatches[si].hex);
    }
    return line + swatchEmpty();
  }).join('\n');
}

// ── Target Definitions ───────────────────────────────────────────────────────

const HOME = homedir();
const IS_MAC = process.platform === 'darwin';

type AnsiMode = 'free' | 'constrained';

interface Target {
  name: string;
  label: string;
  hint: string;
  createSpec: (opts?: { ansiMode?: AnsiMode }) => ThemeSpec;
  exporter: (palette: ThemePalette, options?: { name?: string; colorSchemeName?: string }) => string;
  extension: string;
  defaultDir: () => string;
}

const TARGETS: Target[] = [
  {
    name: 'warp',
    label: 'Warp',
    hint: 'YAML config',
    createSpec: (opts) => createTerminalSpec(opts),
    exporter: exportWarp,
    extension: '.yaml',
    defaultDir: () => IS_MAC
      ? join(HOME, '.warp', 'themes')
      : join(HOME, '.local', 'share', 'warp-terminal', 'themes'),
  },
  {
    name: 'ghostty',
    label: 'Ghostty',
    hint: 'key=value config',
    createSpec: (opts) => createTerminalSpec(opts),
    exporter: exportGhostty,
    extension: '',
    defaultDir: () => IS_MAC
      ? join(HOME, 'Library', 'Application Support', 'com.mitchellh.ghostty', 'themes')
      : join(HOME, '.config', 'ghostty', 'themes'),
  },
  {
    name: 'wezterm',
    label: 'WezTerm',
    hint: 'TOML config',
    createSpec: (opts) => createTerminalSpec(opts),
    exporter: exportWezTerm,
    extension: '.toml',
    defaultDir: () => join(HOME, '.config', 'wezterm', 'colors'),
  },
  {
    name: 'vscode',
    label: 'VS Code',
    hint: 'JSON theme',
    createSpec: (opts) => createVSCodeSpec(opts),
    exporter: exportVSCode,
    extension: '.json',
    defaultDir: () => join(HOME, '.vscode', 'extensions', 'sacred-colors', 'themes'),
  },
  {
    name: 'zed',
    label: 'Zed',
    hint: 'JSON theme',
    createSpec: (opts) => createZedSpec(opts),
    exporter: exportZed,
    extension: '.json',
    defaultDir: () => join(HOME, '.config', 'zed', 'themes'),
  },
  {
    name: 'vim',
    label: 'Vim',
    hint: 'VimScript colorscheme',
    createSpec: () => createVimSpec(),
    exporter: exportVim,
    extension: '.vim',
    defaultDir: () => join(HOME, '.vim', 'colors'),
  },
  {
    name: 'nvim',
    label: 'Neovim',
    hint: 'Lua colorscheme',
    createSpec: (opts) => createNvimSpec(opts),
    exporter: exportNvim,
    extension: '.lua',
    defaultDir: () => join(HOME, '.config', 'nvim', 'colors'),
  },
  {
    name: 'helix',
    label: 'Helix',
    hint: 'TOML theme',
    createSpec: (opts) => createHelixSpec(opts),
    exporter: exportHelix,
    extension: '.toml',
    defaultDir: () => IS_MAC
      ? join(HOME, 'Library', 'Application Support', 'helix', 'themes')
      : join(HOME, '.config', 'helix', 'themes'),
  },
];

// ── Utilities ────────────────────────────────────────────────────────────────

function randomHue(): number {
  return Math.round(Math.random() * 36000) / 100;
}

function randomPattern(patterns: { name: string }[]): string {
  return patterns[Math.floor(Math.random() * patterns.length)].name;
}

function tildify(path: string): string {
  return path.startsWith(HOME) ? '~' + path.slice(HOME.length) : path;
}

/** Generate palettes for ALL targets from the same color cloud */
function generatePalettes(
  patternName: string,
  hue: number,
  mode: ThemeMode,
  ansiMode: AnsiMode,
): Map<string, ThemePalette> {
  const seed: OklchColor = { l: 0.55, c: 0.20, h: hue };
  const cloud = generate(patternName, seed, { count: 16 }).colors;
  const palettes = new Map<string, ThemePalette>();

  for (const target of TARGETS) {
    const spec = target.createSpec({ ansiMode });
    palettes.set(target.name, extract(cloud, spec, mode, { randomSeed: hue }));
  }

  return palettes;
}

// ── Main CLI ─────────────────────────────────────────────────────────────────

async function main() {
  console.clear();

  const patterns = getAllPatterns();
  const patternOptions = patterns.map(pat => ({
    value: pat.name,
    label: pat.name,
    hint: pat.category,
  }));

  p.intro(color.bgMagenta(color.white(' Sacred Colors ')));

  // ── Select Preview Target ────────────────────────────────────────────────

  const targetSelection = await p.select({
    message: 'Preview for which app?',
    options: TARGETS.map(t => ({
      value: t.name,
      label: t.label,
      hint: t.hint,
    })),
  });

  if (p.isCancel(targetSelection)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

  // ── Pattern & Seed ───────────────────────────────────────────────────────

  const patternChoice = await p.autocomplete({
    message: 'Choose a sacred geometry pattern',
    options: patternOptions,
    placeholder: 'Type to search 256 patterns...',
    maxItems: 10,
  });

  if (p.isCancel(patternChoice)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

  const hueInput = await p.text({
    message: 'Seed hue (0-360, or press Enter for random)',
    placeholder: 'random',
    validate(value) {
      if (value === '' || value === 'random') return undefined;
      const n = Number(value);
      if (Number.isNaN(n) || n < 0 || n > 360) return 'Enter a number between 0 and 360';
      return undefined;
    },
  });

  if (p.isCancel(hueInput)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

  const modeChoice = await p.select({
    message: 'Theme mode',
    options: [
      { value: 'dark' as ThemeMode, label: 'Dark', hint: 'dark backgrounds' },
      { value: 'light' as ThemeMode, label: 'Light', hint: 'light backgrounds' },
    ],
  });

  if (p.isCancel(modeChoice)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

  const ansiModeChoice = await p.select({
    message: 'ANSI color mode',
    options: [
      { value: 'free' as AnsiMode, label: 'Free', hint: 'any color in any ANSI slot — maximum diversity' },
      { value: 'constrained' as AnsiMode, label: 'Constrained', hint: 'red is red, green is green — traditional' },
    ],
  });

  if (p.isCancel(ansiModeChoice)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

  // ── State ────────────────────────────────────────────────────────────────

  let currentPattern = patternChoice as string;
  let currentHue = (hueInput === '' || hueInput === 'random') ? randomHue() : Number(hueInput);
  let currentMode = modeChoice as ThemeMode;
  let currentAnsiMode = ansiModeChoice as AnsiMode;
  let currentTarget = TARGETS.find(t => t.name === targetSelection)!;

  // ── Preview Loop ─────────────────────────────────────────────────────────

  let exploring = true;

  while (exploring) {
    // Generate palettes for ALL targets (same cloud, different specs)
    const palettes = generatePalettes(currentPattern, currentHue, currentMode, currentAnsiMode);

    // Header
    const ansiLabel = currentAnsiMode === 'constrained' ? color.magenta('Constrained') : color.green('Free');
    p.log.step(
      `${color.bold(currentPattern)}  ${color.dim('\u00B7')}  Hue: ${color.cyan(String(currentHue) + '\u00B0')}  ${color.dim('\u00B7')}  ${currentMode === 'dark' ? color.blue('Dark') : color.yellow('Light')}  ${color.dim('\u00B7')}  ANSI: ${ansiLabel}`,
    );

    // Show themed preview for the current target (target-specific renderer)
    const palette = palettes.get(currentTarget.name)!;
    let preview: string;

    if (currentTarget.name === 'vscode' || currentTarget.name === 'zed') {
      preview = renderEditorPreview(palette, currentTarget.label, currentTarget.name, currentPattern, currentHue, currentMode);
    } else if (currentTarget.name === 'vim' || currentTarget.name === 'nvim' || currentTarget.name === 'helix') {
      preview = renderVimPreview(palette, currentTarget.label, currentTarget.name, currentPattern, currentHue, currentMode);
    } else {
      preview = renderThemedPreview(palette, currentTarget.label, currentTarget.name, currentPattern, currentHue, currentMode);
    }

    p.note(preview, currentTarget.label);

    const action = await p.select({
      message: 'What next?',
      options: [
        { value: 'randomize-all', label: 'Randomize everything', hint: 'new pattern + new hue' },
        { value: 'randomize-hue', label: 'New random hue', hint: `keep ${currentPattern}` },
        { value: 'randomize-pattern', label: 'New random pattern', hint: `keep hue ${currentHue}\u00B0` },
        { value: 'toggle-mode', label: `Toggle ${currentMode === 'dark' ? 'dark \u2192 light' : 'light \u2192 dark'}` },
        { value: 'toggle-ansi', label: `ANSI ${currentAnsiMode === 'free' ? 'free \u2192 constrained' : 'constrained \u2192 free'}`, hint: currentAnsiMode === 'free' ? 'make red=red, green=green' : 'unleash all colors' },
        { value: 'change-target', label: 'Change preview target', hint: `currently ${currentTarget.label}` },
        { value: 'change-pattern', label: 'Change pattern...', hint: 'search' },
        { value: 'change-hue', label: 'Change hue...', hint: 'enter value' },
        { value: 'export', label: 'Export!', hint: 'save to any app' },
        { value: 'quit', label: 'Quit', hint: 'exit sacred colors' },
      ],
    });

    if (p.isCancel(action)) {
      p.cancel('Farewell.');
      process.exit(0);
    }

    switch (action) {
      case 'randomize-all':
        currentPattern = randomPattern(patterns);
        currentHue = randomHue();
        break;

      case 'randomize-hue':
        currentHue = randomHue();
        break;

      case 'randomize-pattern':
        currentPattern = randomPattern(patterns);
        break;

      case 'toggle-mode':
        currentMode = currentMode === 'dark' ? 'light' : 'dark';
        break;

      case 'toggle-ansi':
        currentAnsiMode = currentAnsiMode === 'free' ? 'constrained' : 'free';
        break;

      case 'change-target': {
        const newTarget = await p.select({
          message: 'Preview for which app?',
          options: TARGETS.map(t => ({
            value: t.name,
            label: t.label,
            hint: t.name === currentTarget.name ? 'current' : t.hint,
          })),
        });
        if (!p.isCancel(newTarget)) {
          currentTarget = TARGETS.find(t => t.name === newTarget)!;
        }
        break;
      }

      case 'change-pattern': {
        const newPattern = await p.autocomplete({
          message: 'Choose a pattern',
          options: patternOptions,
          placeholder: 'Type to search...',
          maxItems: 10,
        });
        if (!p.isCancel(newPattern)) {
          currentPattern = newPattern as string;
        }
        break;
      }

      case 'change-hue': {
        const newHue = await p.text({
          message: 'Seed hue (0-360)',
          placeholder: String(currentHue),
          validate(value) {
            if (value === '') return undefined;
            const n = Number(value);
            if (Number.isNaN(n) || n < 0 || n > 360) return 'Enter a number between 0 and 360';
            return undefined;
          },
        });
        if (!p.isCancel(newHue) && newHue !== '') {
          currentHue = Number(newHue);
        }
        break;
      }

      case 'export': {
        // ── Export (inline, then continue exploring) ──────────────────────

        // Let user choose which targets to export — all palettes already exist
        const exportTargetSelection = await p.multiselect({
          message: 'Export to which apps?',
          options: TARGETS.map(t => ({
            value: t.name,
            label: t.label,
            hint: t.name === currentTarget.name ? 'previewed' : 'same colors',
          })),
          initialValues: [currentTarget.name],
          required: true,
        });

        if (p.isCancel(exportTargetSelection)) break;

        const exportTargets = TARGETS.filter(t =>
          (exportTargetSelection as string[]).includes(t.name),
        );

        const themeName = await p.text({
          message: 'Theme name',
          placeholder: 'sacred-geometry',
          initialValue: 'sacred-geometry',
          validate(value) {
            if (!value || value.length === 0) return 'Name is required';
            return undefined;
          },
        });

        if (p.isCancel(themeName)) break;

        const name = themeName as string;

        const installChoice = await p.select({
          message: 'Where to save?',
          options: [
            {
              value: 'install',
              label: 'Install directly',
              hint: 'save to each app\'s theme folder',
            },
            {
              value: 'custom',
              label: 'Custom directory',
              hint: 'export all to one folder',
            },
          ],
        });

        if (p.isCancel(installChoice)) break;

        let customDir: string | undefined;

        if (installChoice === 'custom') {
          const dir = await p.text({
            message: 'Output directory',
            placeholder: './themes',
            initialValue: './themes',
          });
          if (p.isCancel(dir)) break;
          customDir = dir as string;
        }

        const filePaths = exportTargets.map(t => {
          const dir = customDir
            ? join(process.cwd(), customDir, t.name)
            : t.defaultDir();
          return {
            target: t,
            dir,
            filePath: join(dir, `${name}${t.extension}`),
          };
        });

        const pathPreview = filePaths
          .map(f => `  ${color.bold(f.target.label.padEnd(10))} ${color.dim(tildify(f.filePath))}`)
          .join('\n');

        p.note(pathPreview, 'Files to write');

        const confirm = await p.confirm({
          message: 'Write these files?',
        });

        if (p.isCancel(confirm) || !confirm) break;

        const s = p.spinner();
        s.start('Generating themes...');

        const written: string[] = [];

        for (const { target, filePath } of filePaths) {
          const palette = palettes.get(target.name)!;

          const exporterOpts: { name?: string; colorSchemeName?: string } = { name };
          if (target.name === 'vim' || target.name === 'nvim') {
            exporterOpts.colorSchemeName = name;
          }

          const content = target.exporter(palette, exporterOpts);
          await Bun.write(filePath, content);
          written.push(filePath);
        }

        s.stop('Themes generated!');

        const summary = written
          .map(f => `  ${color.green('\u2713')} ${tildify(f)}`)
          .join('\n');

        p.note(
          `${color.bold(currentPattern)}  ${color.dim('\u00B7')}  Hue: ${currentHue}\u00B0  ${color.dim('\u00B7')}  ${currentMode}  ${color.dim('\u00B7')}  ANSI: ${currentAnsiMode}\n\n${summary}`,
          'Exported',
        );

        break;
      }

      case 'quit':
        exploring = false;
        break;
    }
  }

  p.outro(color.dim('Sacred geometry flows through your terminal.'));
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});

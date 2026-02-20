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

/** Render a 2-char colored block */
function swatch(hex: string): string {
  if (!hex) return '  ';
  return `${bgHex(hex)}  ${RST}`;
}

/** Render swatch + colored name */
function labeled(hex: string, name: string, width = 12): string {
  if (!hex) return '';
  return `${swatch(hex)} ${fgHex(hex)}${name.padEnd(width)}${RST}`;
}

/** Render swatch + name + hex value */
function labeledHex(hex: string, name: string, width = 10): string {
  if (!hex) return '';
  return `${swatch(hex)} ${name.padEnd(width)} ${color.dim(hex)}`;
}

// ── Preview Renderers ────────────────────────────────────────────────────────

/** Filter out empty strings from array */
function compact(arr: string[]): string[] {
  return arr.filter(s => s.length > 0);
}

/** Generic preview: show whatever roles exist in the palette */
function renderPalette(palette: ThemePalette, title: string): string {
  const lines: string[] = [];
  const h = (role: string) => palette.hex(role);

  lines.push(color.bold(title));
  lines.push('');

  // UI
  const uiRoles: [string, string][] = [
    ['bg1', 'bg'], ['fg1', 'fg'], ['bg2', 'bg2'], ['bg3', 'bg3'],
    ['cursor', 'cursor'], ['border', 'border'],
  ];
  const uiCells = compact(uiRoles.filter(([r]) => palette.get(r)).map(([r, l]) => labeledHex(h(r), l)));
  if (uiCells.length > 0) {
    lines.push(color.dim('UI'));
    // Split into rows of 4
    for (let i = 0; i < uiCells.length; i += 4) {
      lines.push(uiCells.slice(i, i + 4).join('  '));
    }
    lines.push('');
  }

  // Accents & Status
  const accentRoles: [string, string][] = [
    ['ac1', 'ac1'], ['ac2', 'ac2'], ['info', 'info'],
    ['warning', 'warn'], ['error', 'error'], ['success', 'success'], ['comment', 'comment'],
  ];
  const accentCells = compact(accentRoles.filter(([r]) => palette.get(r)).map(([r, l]) => labeledHex(h(r), l)));
  if (accentCells.length > 0) {
    lines.push(color.dim('Accents & Status'));
    for (let i = 0; i < accentCells.length; i += 4) {
      lines.push(accentCells.slice(i, i + 4).join('  '));
    }
    lines.push('');
  }

  // ANSI
  const ansiNames = ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White'];
  const hasAnsi = palette.get('ansiBlack');
  if (hasAnsi) {
    const normalRow = ansiNames.map(n => swatch(h(`ansi${n}`))).join(' ');
    const brightRow = ansiNames.map(n => swatch(h(`ansiBright${n}`))).join(' ');
    const labels = ansiNames.map(n => color.dim(n.slice(0, 3).toLowerCase().padEnd(3))).join(' ');
    lines.push(color.dim('ANSI'));
    lines.push(`${normalRow}  ${color.dim('normal')}`);
    lines.push(`${brightRow}  ${color.dim('bright')}`);
    lines.push(`${labels}`);
    lines.push('');
  }

  // Syntax
  const syntaxRoles = ['keyword', 'function', 'type', 'variable', 'string', 'operator', 'tag', 'constant'];
  const syntaxCells = compact(syntaxRoles.filter(r => palette.get(r)).map(r => labeled(h(r), r)));
  if (syntaxCells.length > 0) {
    lines.push(color.dim('Syntax'));
    for (let i = 0; i < syntaxCells.length; i += 4) {
      lines.push(syntaxCells.slice(i, i + 4).join('  '));
    }
  }

  return lines.join('\n');
}

// ── Target Definitions ───────────────────────────────────────────────────────

const HOME = homedir();
const IS_MAC = process.platform === 'darwin';

interface Target {
  name: string;
  label: string;
  hint: string;
  createSpec: () => ThemeSpec;
  exporter: (palette: ThemePalette, options?: { name?: string; colorSchemeName?: string }) => string;
  extension: string;
  defaultDir: () => string;
}

const TARGETS: Target[] = [
  {
    name: 'warp',
    label: 'Warp',
    hint: 'YAML config',
    createSpec: createTerminalSpec,
    exporter: exportWarp,
    extension: '.yaml',
    defaultDir: () => join(HOME, '.warp', 'themes'),
  },
  {
    name: 'ghostty',
    label: 'Ghostty',
    hint: 'key=value config',
    createSpec: createTerminalSpec,
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
    createSpec: createTerminalSpec,
    exporter: exportWezTerm,
    extension: '.toml',
    defaultDir: () => join(HOME, '.config', 'wezterm', 'colors'),
  },
  {
    name: 'vscode',
    label: 'VS Code',
    hint: 'JSON theme',
    createSpec: createVSCodeSpec,
    exporter: exportVSCode,
    extension: '.json',
    defaultDir: () => IS_MAC
      ? join(HOME, '.vscode', 'extensions', 'sacred-colors', 'themes')
      : join(HOME, '.vscode', 'extensions', 'sacred-colors', 'themes'),
  },
  {
    name: 'zed',
    label: 'Zed',
    hint: 'JSON theme',
    createSpec: createZedSpec,
    exporter: exportZed,
    extension: '.json',
    defaultDir: () => join(HOME, '.config', 'zed', 'themes'),
  },
  {
    name: 'vim',
    label: 'Vim',
    hint: 'VimScript colorscheme',
    createSpec: createVimSpec,
    exporter: exportVim,
    extension: '.vim',
    defaultDir: () => join(HOME, '.vim', 'colors'),
  },
  {
    name: 'nvim',
    label: 'Neovim',
    hint: 'Lua colorscheme',
    createSpec: createNvimSpec,
    exporter: exportNvim,
    extension: '.lua',
    defaultDir: () => join(HOME, '.config', 'nvim', 'colors'),
  },
  {
    name: 'helix',
    label: 'Helix',
    hint: 'TOML theme',
    createSpec: createHelixSpec,
    exporter: exportHelix,
    extension: '.toml',
    defaultDir: () => IS_MAC
      ? join(HOME, 'Library', 'Application Support', 'helix', 'themes')
      : join(HOME, '.config', 'helix', 'themes'),
  },
];

// ── Utilities ────────────────────────────────────────────────────────────────

function randomHue(): number {
  return Math.floor(Math.random() * 360);
}

function randomPattern(patterns: { name: string }[]): string {
  return patterns[Math.floor(Math.random() * patterns.length)].name;
}

function tildify(path: string): string {
  return path.startsWith(HOME) ? '~' + path.slice(HOME.length) : path;
}

/** Generate palettes for all selected targets from the same color cloud */
function generatePalettes(
  targets: Target[],
  patternName: string,
  hue: number,
  mode: ThemeMode,
): Map<string, ThemePalette> {
  const seed: OklchColor = { l: 0.55, c: 0.20, h: hue };
  const cloud = generate(patternName, seed, { count: 16 }).colors;
  const palettes = new Map<string, ThemePalette>();

  for (const target of targets) {
    const spec = target.createSpec();
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

  // ── Select Targets First ─────────────────────────────────────────────────

  const targetSelection = await p.multiselect({
    message: 'Which apps are you theming?',
    options: TARGETS.map(t => ({
      value: t.name,
      label: t.label,
      hint: t.hint,
    })),
    required: true,
  });

  if (p.isCancel(targetSelection)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

  const selectedTargets = TARGETS.filter(t =>
    (targetSelection as string[]).includes(t.name),
  );

  // ── Pattern & Seed ───────────────────────────────────────────────────────

  const patternChoice = await p.autocomplete({
    message: 'Choose a sacred geometry pattern',
    options: patternOptions,
    placeholder: 'Type to search 100 patterns...',
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

  // ── State ────────────────────────────────────────────────────────────────

  let currentPattern = patternChoice as string;
  let currentHue = (hueInput === '' || hueInput === 'random') ? randomHue() : Number(hueInput);
  let currentMode = modeChoice as ThemeMode;

  // ── Preview Loop ─────────────────────────────────────────────────────────

  let exploring = true;

  while (exploring) {
    // Generate palettes for each selected target
    const palettes = generatePalettes(selectedTargets, currentPattern, currentHue, currentMode);

    // Header
    p.log.step(
      `${color.bold(currentPattern)}  ${color.dim('\u00B7')}  Hue: ${color.cyan(String(currentHue) + '\u00B0')}  ${color.dim('\u00B7')}  ${currentMode === 'dark' ? color.blue('Dark') : color.yellow('Light')}`,
    );

    // Show preview for each target
    for (const target of selectedTargets) {
      const palette = palettes.get(target.name)!;
      const preview = renderPalette(palette, target.label);
      p.note(preview, target.label);
    }

    const action = await p.select({
      message: 'What next?',
      options: [
        { value: 'randomize-all', label: 'Randomize everything', hint: 'new pattern + new hue' },
        { value: 'randomize-hue', label: 'New random hue', hint: `keep ${currentPattern}` },
        { value: 'randomize-pattern', label: 'New random pattern', hint: `keep hue ${currentHue}\u00B0` },
        { value: 'toggle-mode', label: `Toggle ${currentMode === 'dark' ? 'dark \u2192 light' : 'light \u2192 dark'}` },
        { value: 'change-pattern', label: 'Change pattern...', hint: 'search' },
        { value: 'change-hue', label: 'Change hue...', hint: 'enter value' },
        { value: 'export', label: 'Export!', hint: 'save theme files' },
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

      case 'export':
        exploring = false;
        break;
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  const themeName = await p.text({
    message: 'Theme name',
    placeholder: 'sacred-geometry',
    initialValue: 'sacred-geometry',
    validate(value) {
      if (!value || value.length === 0) return 'Name is required';
      return undefined;
    },
  });

  if (p.isCancel(themeName)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

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

  if (p.isCancel(installChoice)) {
    p.cancel('Farewell.');
    process.exit(0);
  }

  let customDir: string | undefined;

  if (installChoice === 'custom') {
    const dir = await p.text({
      message: 'Output directory',
      placeholder: './themes',
      initialValue: './themes',
    });
    if (p.isCancel(dir)) {
      p.cancel('Farewell.');
      process.exit(0);
    }
    customDir = dir as string;
  }

  // Show paths before writing
  const filePaths = selectedTargets.map(t => {
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

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Export cancelled.');
    process.exit(0);
  }

  // ── Generate & Write ─────────────────────────────────────────────────────

  const s = p.spinner();
  s.start('Generating themes...');

  const seed: OklchColor = { l: 0.55, c: 0.20, h: currentHue };
  const cloud = generate(currentPattern, seed, { count: 16 }).colors;
  const written: string[] = [];

  for (const { target, filePath } of filePaths) {
    const spec = target.createSpec();
    const palette = extract(cloud, spec, currentMode, { randomSeed: currentHue });

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
    `${color.bold(currentPattern)}  ${color.dim('\u00B7')}  Hue: ${currentHue}\u00B0  ${color.dim('\u00B7')}  ${currentMode}\n\n${summary}`,
    'Exported',
  );

  p.outro(color.dim('Sacred geometry flows through your terminal.'));
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});

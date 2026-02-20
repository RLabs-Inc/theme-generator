import { describe, test, expect, beforeAll } from 'bun:test';
import { exportNvim } from '../../src/exporters/nvim.js';
import { createNvimSpec } from '../../src/specs/nvim.js';
import { extract } from '../../src/extract.js';
import type { ThemePalette } from '../../src/types.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Shared Fixtures ───────────────────────────────────────────────────────────

function makeCloud(): OklchColor[] {
  const cloud: OklchColor[] = [];
  for (let h = 0; h < 360; h += 10) {
    cloud.push({ l: 0.08, c: 0.02, h });
    cloud.push({ l: 0.97, c: 0.03, h });
    cloud.push({ l: 0.55, c: 0.25, h });
  }
  return cloud;
}

/** Strip alpha helper — same as exporter logic */
function solid(hex: string): string {
  return hex.length > 7 ? hex.slice(0, 7) : hex;
}

let darkPalette: ThemePalette;
let lightPalette: ThemePalette;
let darkOutput: string;

beforeAll(() => {
  const cloud = makeCloud();
  const spec  = createNvimSpec();
  darkPalette  = extract(cloud, spec, 'dark',  { randomSeed: 42 });
  lightPalette = extract(cloud, spec, 'light', { randomSeed: 42 });
  darkOutput = exportNvim(darkPalette);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exporters/nvim', () => {

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(darkOutput.length).toBeGreaterThan(0);
    });

    test('starts with lua comment header', () => {
      expect(darkOutput).toMatch(/^-- .* color theme for Neovim/);
    });

    test('contains highlight clear', () => {
      expect(darkOutput).toContain("vim.cmd('highlight clear')");
    });

    test('sets vim.o.background to dark for dark palette', () => {
      expect(darkOutput).toContain("vim.o.background = 'dark'");
    });

    test('sets vim.o.background to light for light palette', () => {
      expect(exportNvim(lightPalette)).toContain("vim.o.background = 'light'");
    });

    test('sets vim.g.colors_name', () => {
      expect(darkOutput).toContain("vim.g.colors_name = 'nvim'");
    });

    test('uses nvim_set_hl via local h alias', () => {
      expect(darkOutput).toContain('local h = vim.api.nvim_set_hl');
    });

    test('all color values are solid 6-digit hex (no alpha)', () => {
      const hexMatches = darkOutput.match(/'#[0-9a-fA-F]+'/g) || [];
      for (const hex of hexMatches) {
        // Hex is wrapped in quotes: '#rrggbb'
        expect(hex.length).toBe(9); // ' + # + 6 + '
      }
    });
  });

  describe('UI groups', () => {
    test('Normal has fg and bg', () => {
      expect(darkOutput).toContain(`h(0, 'Normal', { fg = '${solid(darkPalette.hex('fg1'))}', bg = '${solid(darkPalette.hex('bg1'))}' })`);
    });

    test('Cursor uses cursorText and cursor', () => {
      expect(darkOutput).toContain(`h(0, 'Cursor', { fg = '${solid(darkPalette.hex('cursorText'))}', bg = '${solid(darkPalette.hex('cursor'))}' })`);
    });

    test('CursorLine uses bg2', () => {
      expect(darkOutput).toContain(`h(0, 'CursorLine', { bg = '${solid(darkPalette.hex('bg2'))}' })`);
    });

    test('StatusLine uses ac2 with adaptive foreground', () => {
      expect(darkOutput).toContain(`h(0, 'StatusLine', { fg = '${solid(darkPalette.hex('ac2Fg'))}', bg = '${solid(darkPalette.hex('ac2'))}' })`);
    });

    test('MatchParen has bold and underline', () => {
      expect(darkOutput).toContain("h(0, 'MatchParen', { fg =");
      expect(darkOutput).toContain('bold = true, underline = true');
    });
  });

  describe('spell groups', () => {
    test('SpellBad uses undercurl with sp', () => {
      expect(darkOutput).toContain(`h(0, 'SpellBad', { sp = '${solid(darkPalette.hex('error'))}', undercurl = true })`);
    });
  });

  describe('diagnostics', () => {
    test('DiagnosticError uses error color', () => {
      expect(darkOutput).toContain(`h(0, 'DiagnosticError', { fg = '${solid(darkPalette.hex('error'))}' })`);
    });

    test('DiagnosticUnderlineError uses undercurl with sp', () => {
      expect(darkOutput).toContain(`h(0, 'DiagnosticUnderlineError', { sp = '${solid(darkPalette.hex('error'))}', undercurl = true })`);
    });

    test('all 4 diagnostic variants present', () => {
      expect(darkOutput).toContain('DiagnosticError');
      expect(darkOutput).toContain('DiagnosticWarn');
      expect(darkOutput).toContain('DiagnosticInfo');
      expect(darkOutput).toContain('DiagnosticHint');
    });
  });

  describe('legacy syntax groups', () => {
    test('Comment has italic flag', () => {
      expect(darkOutput).toContain("h(0, 'Comment', { fg =");
      expect(darkOutput).toMatch(/Comment.*italic = true/);
    });

    test('Keyword uses keyword color', () => {
      expect(darkOutput).toContain(`h(0, 'Keyword', { fg = '${solid(darkPalette.hex('keyword'))}' })`);
    });

    test('Function uses function color', () => {
      expect(darkOutput).toContain(`h(0, 'Function', { fg = '${solid(darkPalette.hex('function'))}' })`);
    });

    test('String uses fg1 (plain text)', () => {
      expect(darkOutput).toContain(`h(0, 'String', { fg = '${solid(darkPalette.hex('fg1'))}' })`);
    });
  });

  describe('treesitter groups', () => {
    test('@keyword group present', () => {
      expect(darkOutput).toContain("h(0, '@keyword',");
    });

    test('@function group present', () => {
      expect(darkOutput).toContain("h(0, '@function',");
    });

    test('@function.call uses functionCall role', () => {
      expect(darkOutput).toContain(`h(0, '@function.call', { fg = '${solid(darkPalette.hex('functionCall'))}' })`);
    });

    test('@variable.builtin uses language role', () => {
      expect(darkOutput).toContain(`h(0, '@variable.builtin', { fg = '${solid(darkPalette.hex('language'))}' })`);
    });

    test('@type uses type role', () => {
      expect(darkOutput).toContain(`h(0, '@type', { fg = '${solid(darkPalette.hex('type'))}' })`);
    });

    test('@comment has italic flag', () => {
      expect(darkOutput).toMatch(/@comment'.*italic = true/);
    });

    test('@string uses fg1', () => {
      expect(darkOutput).toContain(`h(0, '@string', { fg = '${solid(darkPalette.hex('fg1'))}' })`);
    });

    test('@tag uses tag role', () => {
      expect(darkOutput).toContain(`h(0, '@tag', { fg = '${solid(darkPalette.hex('tag'))}' })`);
    });

    test('@property uses property role', () => {
      expect(darkOutput).toContain(`h(0, '@property', { fg = '${solid(darkPalette.hex('property'))}' })`);
    });

    test('@namespace uses namespace role', () => {
      expect(darkOutput).toContain(`h(0, '@namespace', { fg = '${solid(darkPalette.hex('namespace'))}' })`);
    });

    test('markup groups present', () => {
      expect(darkOutput).toContain("@markup.heading");
      expect(darkOutput).toContain("@markup.bold");
      expect(darkOutput).toContain("@markup.italic");
      expect(darkOutput).toContain("@markup.link");
    });
  });

  describe('terminal colors', () => {
    test('all 16 terminal_color_ variables present', () => {
      for (let i = 0; i <= 15; i++) {
        expect(darkOutput).toContain(`vim.g.terminal_color_${i}`);
      }
    });

    test('terminal_color_0 matches ansiBlack', () => {
      expect(darkOutput).toContain(`vim.g.terminal_color_0  = '${solid(darkPalette.hex('ansiBlack'))}'`);
    });

    test('terminal_color_1 matches ansiRed', () => {
      expect(darkOutput).toContain(`vim.g.terminal_color_1  = '${solid(darkPalette.hex('ansiRed'))}'`);
    });

    test('terminal_color_8 matches ansiBrightBlack', () => {
      expect(darkOutput).toContain(`vim.g.terminal_color_8  = '${solid(darkPalette.hex('ansiBrightBlack'))}'`);
    });

    test('terminal_color_15 matches ansiBrightWhite', () => {
      expect(darkOutput).toContain(`vim.g.terminal_color_15 = '${solid(darkPalette.hex('ansiBrightWhite'))}'`);
    });
  });

  describe('options', () => {
    test('colorSchemeName sets vim.g.colors_name', () => {
      const out = exportNvim(darkPalette, { colorSchemeName: 'sacred-dark' });
      expect(out).toContain("vim.g.colors_name = 'sacred-dark'");
    });

    test('name option is used as fallback', () => {
      const out = exportNvim(darkPalette, { name: 'My Theme' });
      expect(out).toContain("vim.g.colors_name = 'My Theme'");
    });

    test('light palette uses light background', () => {
      const out = exportNvim(lightPalette);
      expect(out).toContain(`bg = '${solid(lightPalette.hex('bg1'))}'`);
    });
  });

});

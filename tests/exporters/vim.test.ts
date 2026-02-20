import { describe, test, expect, beforeAll } from 'bun:test';
import { exportVim } from '../../src/exporters/vim.js';
import { createVimSpec } from '../../src/specs/vim.js';
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
  const spec  = createVimSpec();
  darkPalette  = extract(cloud, spec, 'dark',  { randomSeed: 42 });
  lightPalette = extract(cloud, spec, 'light', { randomSeed: 42 });
  darkOutput = exportVim(darkPalette);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exporters/vim', () => {

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(darkOutput.length).toBeGreaterThan(0);
    });

    test('starts with vim comment header', () => {
      expect(darkOutput).toMatch(/^" .* color theme for Vim/);
    });

    test('contains set background=dark for dark palette', () => {
      expect(darkOutput).toContain('set background=dark');
    });

    test('contains set background=light for light palette', () => {
      expect(exportVim(lightPalette)).toContain('set background=light');
    });

    test('contains highlight clear', () => {
      expect(darkOutput).toContain('highlight clear');
    });

    test('contains syntax reset block', () => {
      expect(darkOutput).toContain("if exists('syntax_on')");
      expect(darkOutput).toContain('syntax reset');
    });

    test('sets g:colors_name to spec name by default', () => {
      expect(darkOutput).toContain("let g:colors_name = 'vim'");
    });

    test('all color values are solid 6-digit hex (no alpha)', () => {
      const hexMatches = darkOutput.match(/#[0-9a-fA-F]+/g) || [];
      for (const hex of hexMatches) {
        expect(hex.length).toBeLessThanOrEqual(7); // # + 6 hex digits
      }
    });
  });

  describe('UI groups', () => {
    test('Normal has guifg and guibg', () => {
      expect(darkOutput).toContain(`hi Normal guifg=${solid(darkPalette.hex('fg1'))} guibg=${solid(darkPalette.hex('bg1'))}`);
    });

    test('Cursor uses cursorText and cursor roles', () => {
      expect(darkOutput).toContain(`hi Cursor guifg=${solid(darkPalette.hex('cursorText'))} guibg=${solid(darkPalette.hex('cursor'))}`);
    });

    test('CursorLine uses bg2 (solid alternative to alpha overlay)', () => {
      expect(darkOutput).toContain(`hi CursorLine guibg=${solid(darkPalette.hex('bg2'))}`);
    });

    test('Visual uses bg3 for selection', () => {
      expect(darkOutput).toContain(`hi Visual guifg=NONE guibg=${solid(darkPalette.hex('bg3'))}`);
    });

    test('Search uses ac2 with adaptive foreground', () => {
      expect(darkOutput).toContain(`hi Search guifg=${solid(darkPalette.hex('ac2Fg'))} guibg=${solid(darkPalette.hex('ac2'))}`);
    });

    test('IncSearch uses ac1 with adaptive foreground', () => {
      expect(darkOutput).toContain(`hi IncSearch guifg=${solid(darkPalette.hex('ac1Fg'))} guibg=${solid(darkPalette.hex('ac1'))}`);
    });

    test('StatusLine uses ac2 with adaptive foreground', () => {
      expect(darkOutput).toContain(`hi StatusLine guifg=${solid(darkPalette.hex('ac2Fg'))} guibg=${solid(darkPalette.hex('ac2'))}`);
    });

    test('LineNr uses comment color', () => {
      expect(darkOutput).toContain(`hi LineNr guifg=${solid(darkPalette.hex('comment'))}`);
    });

    test('CursorLineNr uses ac1 with bold', () => {
      expect(darkOutput).toContain(`hi CursorLineNr guifg=${solid(darkPalette.hex('ac1'))} gui=bold`);
    });

    test('VertSplit uses border color', () => {
      expect(darkOutput).toContain(`hi VertSplit guifg=${solid(darkPalette.hex('border'))}`);
    });

    test('ErrorMsg uses error and errorFg', () => {
      expect(darkOutput).toContain(`hi ErrorMsg guifg=${solid(darkPalette.hex('errorFg'))} guibg=${solid(darkPalette.hex('error'))}`);
    });

    test('MatchParen uses ac1 with bold,underline', () => {
      expect(darkOutput).toContain(`hi MatchParen guifg=${solid(darkPalette.hex('ac1'))} gui=bold,underline`);
    });
  });

  describe('spell groups', () => {
    test('SpellBad uses undercurl with error guisp', () => {
      expect(darkOutput).toContain(`hi SpellBad gui=undercurl guisp=${solid(darkPalette.hex('error'))}`);
    });

    test('SpellCap uses undercurl with warning guisp', () => {
      expect(darkOutput).toContain(`hi SpellCap gui=undercurl guisp=${solid(darkPalette.hex('warning'))}`);
    });
  });

  describe('diagnostics', () => {
    test('DiagnosticError uses error color', () => {
      expect(darkOutput).toContain(`hi DiagnosticError guifg=${solid(darkPalette.hex('error'))}`);
    });

    test('DiagnosticWarn uses warning color', () => {
      expect(darkOutput).toContain(`hi DiagnosticWarn guifg=${solid(darkPalette.hex('warning'))}`);
    });

    test('DiagnosticUnderlineError uses undercurl', () => {
      expect(darkOutput).toContain(`hi DiagnosticUnderlineError gui=undercurl guisp=${solid(darkPalette.hex('error'))}`);
    });

    test('all 4 diagnostic sign groups present', () => {
      expect(darkOutput).toContain('DiagnosticSignError');
      expect(darkOutput).toContain('DiagnosticSignWarn');
      expect(darkOutput).toContain('DiagnosticSignInfo');
      expect(darkOutput).toContain('DiagnosticSignHint');
    });
  });

  describe('syntax groups', () => {
    test('Comment uses comment color with italic', () => {
      expect(darkOutput).toContain(`hi Comment guifg=${solid(darkPalette.hex('comment'))} gui=italic`);
    });

    test('Keyword uses keyword color', () => {
      expect(darkOutput).toContain(`hi Keyword guifg=${solid(darkPalette.hex('keyword'))}`);
    });

    test('Function uses function color', () => {
      expect(darkOutput).toContain(`hi Function guifg=${solid(darkPalette.hex('function'))}`);
    });

    test('Type uses type color with gui=NONE (no bold)', () => {
      expect(darkOutput).toContain(`hi Type guifg=${solid(darkPalette.hex('type'))} gui=NONE`);
    });

    test('String uses fg1 (plain text)', () => {
      expect(darkOutput).toContain(`hi String guifg=${solid(darkPalette.hex('fg1'))}`);
    });

    test('Operator uses operator color', () => {
      expect(darkOutput).toContain(`hi Operator guifg=${solid(darkPalette.hex('operator'))}`);
    });

    test('Tag uses tag color', () => {
      expect(darkOutput).toContain(`hi Tag guifg=${solid(darkPalette.hex('tag'))}`);
    });

    test('Todo uses info color with bold', () => {
      expect(darkOutput).toContain(`hi Todo guifg=${solid(darkPalette.hex('info'))} gui=bold`);
    });

    test('Boolean uses language color', () => {
      expect(darkOutput).toContain(`hi Boolean guifg=${solid(darkPalette.hex('language'))}`);
    });
  });

  describe('no ANSI terminal colors', () => {
    test('does not contain terminal_color_ (Vim does not support it)', () => {
      expect(darkOutput).not.toContain('terminal_color_');
    });
  });

  describe('options', () => {
    test('colorSchemeName option sets g:colors_name', () => {
      const out = exportVim(darkPalette, { colorSchemeName: 'sacred-dark' });
      expect(out).toContain("let g:colors_name = 'sacred-dark'");
    });

    test('name option is used as fallback for colorSchemeName', () => {
      const out = exportVim(darkPalette, { name: 'My Theme' });
      expect(out).toContain("let g:colors_name = 'My Theme'");
    });

    test('colorSchemeName takes priority over name', () => {
      const out = exportVim(darkPalette, { name: 'Display', colorSchemeName: 'cmd-name' });
      expect(out).toContain("let g:colors_name = 'cmd-name'");
    });

    test('light palette uses light background colors', () => {
      const out = exportVim(lightPalette);
      expect(out).toContain(`guibg=${solid(lightPalette.hex('bg1'))}`);
    });
  });

});

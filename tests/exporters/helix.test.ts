import { describe, test, expect, beforeAll } from 'bun:test';
import { exportHelix } from '../../src/exporters/helix.js';
import { createHelixSpec } from '../../src/specs/helix.js';
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

let darkPalette: ThemePalette;
let lightPalette: ThemePalette;
let darkOutput: string;

beforeAll(() => {
  const cloud = makeCloud();
  const spec  = createHelixSpec();
  darkPalette  = extract(cloud, spec, 'dark',  { randomSeed: 42 });
  lightPalette = extract(cloud, spec, 'light', { randomSeed: 42 });
  darkOutput = exportHelix(darkPalette);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exporters/helix', () => {

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(darkOutput.length).toBeGreaterThan(0);
    });

    test('starts with TOML comment header', () => {
      expect(darkOutput).toMatch(/^# .* color theme for Helix/);
    });

    test('uses TOML inline table syntax', () => {
      // Pattern: "key" = { ... }
      expect(darkOutput).toMatch(/"[^"]+" = \{/);
    });

    test('does not contain JSON brackets or colons', () => {
      // TOML uses = not : for key-value
      // But our inline tables use = so just check no JSON-style objects
      expect(darkOutput).not.toContain('": {');
    });
  });

  describe('UI scopes', () => {
    test('ui.background has bg matching bg1', () => {
      expect(darkOutput).toContain(`"ui.background" = { bg = "${darkPalette.hex('bg1')}" }`);
    });

    test('ui.text has fg matching fg1', () => {
      expect(darkOutput).toContain(`"ui.text" = { fg = "${darkPalette.hex('fg1')}" }`);
    });

    test('ui.cursor has fg and bg', () => {
      expect(darkOutput).toContain(`"ui.cursor" = { fg = "${darkPalette.hex('cursorText')}"`);
      expect(darkOutput).toContain(`bg = "${darkPalette.hex('cursor')}"`);
    });

    test('ui.cursor.primary matches ui.cursor', () => {
      expect(darkOutput).toContain(`"ui.cursor.primary" = { fg = "${darkPalette.hex('cursorText')}"`);
    });

    test('ui.selection uses selectionBg with alpha', () => {
      expect(darkOutput).toContain(`"ui.selection" = { bg = "${darkPalette.hex('selectionBg')}" }`);
    });

    test('ui.cursorline.primary uses lineHighlight with alpha', () => {
      expect(darkOutput).toContain(`"ui.cursorline.primary" = { bg = "${darkPalette.hex('lineHighlight')}" }`);
    });

    test('ui.highlight uses findMatch with alpha', () => {
      expect(darkOutput).toContain(`"ui.highlight" = { bg = "${darkPalette.hex('findMatch')}" }`);
    });

    test('ui.linenr uses comment color', () => {
      expect(darkOutput).toContain(`"ui.linenr" = { fg = "${darkPalette.hex('comment')}" }`);
    });

    test('ui.linenr.selected uses ac1 color', () => {
      expect(darkOutput).toContain(`"ui.linenr.selected" = { fg = "${darkPalette.hex('ac1')}" }`);
    });

    test('ui.statusline uses ac2 with adaptive foreground', () => {
      expect(darkOutput).toContain(`"ui.statusline" = { fg = "${darkPalette.hex('ac2Fg')}"`);
      expect(darkOutput).toContain(`bg = "${darkPalette.hex('ac2')}"`);
    });

    test('ui.statusline.inactive uses comment and bg2', () => {
      expect(darkOutput).toContain(`"ui.statusline.inactive" = { fg = "${darkPalette.hex('comment')}"`);
    });

    test('ui.window uses border color', () => {
      expect(darkOutput).toContain(`"ui.window" = { fg = "${darkPalette.hex('border')}" }`);
    });

    test('ui.menu.selected uses ac2 with adaptive foreground', () => {
      expect(darkOutput).toContain(`"ui.menu.selected" = { fg = "${darkPalette.hex('ac2Fg')}"`);
    });

    test('ui.text.inactive uses comment color', () => {
      expect(darkOutput).toContain(`"ui.text.inactive" = { fg = "${darkPalette.hex('comment')}" }`);
    });

    test('ui.bufferline.active has bold modifier', () => {
      expect(darkOutput).toContain('"ui.bufferline.active"');
      expect(darkOutput).toMatch(/ui\.bufferline\.active.*modifiers = \["bold"\]/);
    });
  });

  describe('diagnostics', () => {
    test('diagnostic.error uses undercurl with error color', () => {
      expect(darkOutput).toContain(`"diagnostic.error" = { underline = { color = "${darkPalette.hex('error')}"`);
      expect(darkOutput).toContain('style = "curl"');
    });

    test('diagnostic.warning uses undercurl with warning color', () => {
      expect(darkOutput).toContain(`"diagnostic.warning" = { underline = { color = "${darkPalette.hex('warning')}"`);
    });

    test('diagnostic.info uses undercurl with info color', () => {
      expect(darkOutput).toContain(`"diagnostic.info" = { underline = { color = "${darkPalette.hex('info')}"`);
    });

    test('diagnostic.hint uses undercurl with success color', () => {
      expect(darkOutput).toContain(`"diagnostic.hint" = { underline = { color = "${darkPalette.hex('success')}"`);
    });

    test('diagnostic.unnecessary uses dim modifier', () => {
      expect(darkOutput).toContain('"diagnostic.unnecessary" = { modifiers = ["dim"] }');
    });

    test('diagnostic.deprecated uses crossed_out modifier', () => {
      expect(darkOutput).toContain('"diagnostic.deprecated" = { modifiers = ["crossed_out"] }');
    });
  });

  describe('diff', () => {
    test('diff.plus uses success color', () => {
      expect(darkOutput).toContain(`"diff.plus" = { fg = "${darkPalette.hex('success')}" }`);
    });

    test('diff.minus uses error color', () => {
      expect(darkOutput).toContain(`"diff.minus" = { fg = "${darkPalette.hex('error')}" }`);
    });

    test('diff.delta uses info color', () => {
      expect(darkOutput).toContain(`"diff.delta" = { fg = "${darkPalette.hex('info')}" }`);
    });
  });

  describe('markup', () => {
    test('markup.heading has bold modifier', () => {
      expect(darkOutput).toContain('"markup.heading" = { fg =');
      expect(darkOutput).toMatch(/markup\.heading" = .*modifiers = \["bold"\]/);
    });

    test('markup.bold uses bold modifier', () => {
      expect(darkOutput).toContain('"markup.bold" = { modifiers = ["bold"] }');
    });

    test('markup.italic uses italic modifier', () => {
      expect(darkOutput).toContain('"markup.italic" = { modifiers = ["italic"] }');
    });

    test('markup.link.url has underline', () => {
      expect(darkOutput).toContain('"markup.link.url"');
      expect(darkOutput).toMatch(/markup\.link\.url.*underline = \{ style = "line" \}/);
    });
  });

  describe('syntax scopes', () => {
    test('comment has italic modifier', () => {
      expect(darkOutput).toContain(`"comment" = { fg = "${darkPalette.hex('comment')}"`);
      expect(darkOutput).toMatch(/^"comment" = .*modifiers = \["italic"\]/m);
    });

    test('keyword uses keyword color', () => {
      expect(darkOutput).toContain(`"keyword" = { fg = "${darkPalette.hex('keyword')}" }`);
    });

    test('function uses function color', () => {
      expect(darkOutput).toContain(`"function" = { fg = "${darkPalette.hex('function')}" }`);
    });

    test('function.call uses functionCall color', () => {
      expect(darkOutput).toContain(`"function.call" = { fg = "${darkPalette.hex('functionCall')}" }`);
    });

    test('variable uses variable color', () => {
      expect(darkOutput).toContain(`"variable" = { fg = "${darkPalette.hex('variable')}" }`);
    });

    test('variable.builtin uses language color', () => {
      expect(darkOutput).toContain(`"variable.builtin" = { fg = "${darkPalette.hex('language')}" }`);
    });

    test('type uses type color', () => {
      expect(darkOutput).toContain(`"type" = { fg = "${darkPalette.hex('type')}" }`);
    });

    test('string uses fg1 (plain text)', () => {
      expect(darkOutput).toContain(`"string" = { fg = "${darkPalette.hex('fg1')}" }`);
    });

    test('string.special uses ac2', () => {
      expect(darkOutput).toContain(`"string.special" = { fg = "${darkPalette.hex('ac2')}" }`);
    });

    test('string.special.symbol uses ac1', () => {
      expect(darkOutput).toContain(`"string.special.symbol" = { fg = "${darkPalette.hex('ac1')}" }`);
    });

    test('operator uses operator color', () => {
      expect(darkOutput).toContain(`"operator" = { fg = "${darkPalette.hex('operator')}" }`);
    });

    test('tag uses tag color', () => {
      expect(darkOutput).toContain(`"tag" = { fg = "${darkPalette.hex('tag')}" }`);
    });

    test('attribute uses attribute color', () => {
      expect(darkOutput).toContain(`"attribute" = { fg = "${darkPalette.hex('attribute')}" }`);
    });

    test('namespace uses namespace color', () => {
      expect(darkOutput).toContain(`"namespace" = { fg = "${darkPalette.hex('namespace')}" }`);
    });

    test('constructor uses function color', () => {
      expect(darkOutput).toContain(`"constructor" = { fg = "${darkPalette.hex('function')}" }`);
    });

    test('constant.builtin uses language color', () => {
      expect(darkOutput).toContain(`"constant.builtin" = { fg = "${darkPalette.hex('language')}" }`);
    });

    test('punctuation.bracket uses punctuationBrace color', () => {
      expect(darkOutput).toContain(`"punctuation.bracket" = { fg = "${darkPalette.hex('punctuationBrace')}" }`);
    });
  });

  describe('options', () => {
    test('custom name appears in header', () => {
      const out = exportHelix(darkPalette, { name: 'Sacred Dark' });
      expect(out).toContain('# Sacred Dark');
    });

    test('light palette produces valid output', () => {
      const out = exportHelix(lightPalette);
      expect(out.length).toBeGreaterThan(0);
      expect(out).toContain(`"ui.background" = { bg = "${lightPalette.hex('bg1')}" }`);
    });

    test('light palette uses light palette fg1', () => {
      const out = exportHelix(lightPalette);
      expect(out).toContain(`"ui.text" = { fg = "${lightPalette.hex('fg1')}" }`);
    });
  });

});

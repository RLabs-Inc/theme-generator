import { describe, test, expect, beforeAll } from 'bun:test';
import { exportZed } from '../../src/exporters/zed.js';
import { createZedSpec } from '../../src/specs/zed.js';
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
let parsed: ReturnType<typeof JSON.parse>;

beforeAll(() => {
  const cloud = makeCloud();
  const spec  = createZedSpec();
  darkPalette  = extract(cloud, spec, 'dark',  { randomSeed: 42 });
  lightPalette = extract(cloud, spec, 'light', { randomSeed: 42 });
  parsed = JSON.parse(exportZed(darkPalette));
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exporters/zed', () => {

  // ── Output Format ──────────────────────────────────────────────────────────

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(exportZed(darkPalette).length).toBeGreaterThan(0);
    });

    test('produces valid JSON', () => {
      expect(() => JSON.parse(exportZed(darkPalette))).not.toThrow();
    });

    test('JSON is pretty-printed (contains newlines)', () => {
      expect(exportZed(darkPalette)).toContain('\n');
    });

    test('$schema field matches Zed v0.2.0 schema URL', () => {
      expect(parsed.$schema).toBe('https://zed.dev/schema/themes/v0.2.0.json');
    });

    test('top-level name matches spec name by default', () => {
      expect(parsed.name).toBe('zed');
    });

    test('author defaults to RLabs Theme Generator', () => {
      expect(parsed.author).toBe('RLabs Theme Generator');
    });

    test('themes array has exactly one entry', () => {
      expect(parsed.themes).toHaveLength(1);
    });

    test('theme appearance is dark for dark palette', () => {
      expect(parsed.themes[0].appearance).toBe('dark');
    });

    test('theme appearance is light for light palette', () => {
      const out = JSON.parse(exportZed(lightPalette));
      expect(out.themes[0].appearance).toBe('light');
    });

    test('theme name matches top-level name', () => {
      expect(parsed.themes[0].name).toBe(parsed.name);
    });

    test('style has window_background_appearance opaque', () => {
      expect(parsed.themes[0].style.window_background_appearance).toBe('opaque');
    });

    test('style has accents array with 6 colors', () => {
      expect(parsed.themes[0].style.accents).toHaveLength(6);
    });

    test('accents contains ac1 and ac2 hex values', () => {
      const accents = parsed.themes[0].style.accents;
      expect(accents).toContain(darkPalette.hex('ac1'));
      expect(accents).toContain(darkPalette.hex('ac2'));
    });
  });

  // ── Theme Colors ───────────────────────────────────────────────────────────

  describe('theme colors', () => {
    const colors = () => parsed.themes[0].style.colors;

    test('background matches bg1 hex', () => {
      expect(colors().background).toBe(darkPalette.hex('bg1'));
    });

    test('editor_background matches bg1 hex', () => {
      expect(colors().editor_background).toBe(darkPalette.hex('bg1'));
    });

    test('editor_foreground matches fg1 hex', () => {
      expect(colors().editor_foreground).toBe(darkPalette.hex('fg1'));
    });

    test('text matches fg1 hex', () => {
      expect(colors().text).toBe(darkPalette.hex('fg1'));
    });

    test('text_muted matches fg2 hex', () => {
      expect(colors().text_muted).toBe(darkPalette.hex('fg2'));
    });

    test('text_placeholder matches comment hex', () => {
      expect(colors().text_placeholder).toBe(darkPalette.hex('comment'));
    });

    test('text_accent matches ac2 hex', () => {
      expect(colors().text_accent).toBe(darkPalette.hex('ac2'));
    });

    test('status_bar_background matches ac2 hex', () => {
      expect(colors().status_bar_background).toBe(darkPalette.hex('ac2'));
    });

    test('editor_active_line_background matches lineHighlight hex', () => {
      expect(colors().editor_active_line_background).toBe(darkPalette.hex('lineHighlight'));
    });

    test('search_match_background matches findMatch hex', () => {
      expect(colors().search_match_background).toBe(darkPalette.hex('findMatch'));
    });

    test('border_selected matches ac1 hex', () => {
      expect(colors().border_selected).toBe(darkPalette.hex('ac1'));
    });

    test('editor_active_line_number matches ac1 hex', () => {
      expect(colors().editor_active_line_number).toBe(darkPalette.hex('ac1'));
    });

    test('editor_line_number matches comment hex', () => {
      expect(colors().editor_line_number).toBe(darkPalette.hex('comment'));
    });

    test('terminal_background matches bg1 hex', () => {
      expect(colors().terminal_background).toBe(darkPalette.hex('bg1'));
    });

    test('terminal_foreground matches fg1 hex', () => {
      expect(colors().terminal_foreground).toBe(darkPalette.hex('fg1'));
    });

    test('all 8 normal ANSI terminal colors present', () => {
      for (const name of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
        expect(colors()[`terminal_ansi_${name}`]).toBeDefined();
      }
    });

    test('all 8 bright ANSI terminal colors present', () => {
      for (const name of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
        expect(colors()[`terminal_ansi_bright_${name}`]).toBeDefined();
      }
    });

    test('terminal_ansi_red matches ansiRed hex', () => {
      expect(colors().terminal_ansi_red).toBe(darkPalette.hex('ansiRed'));
    });

    test('terminal_ansi_bright_blue matches ansiBrightBlue hex', () => {
      expect(colors().terminal_ansi_bright_blue).toBe(darkPalette.hex('ansiBrightBlue'));
    });

    test('version_control_added matches success hex', () => {
      expect(colors().version_control_added).toBe(darkPalette.hex('success'));
    });

    test('version_control_deleted matches error hex', () => {
      expect(colors().version_control_deleted).toBe(darkPalette.hex('error'));
    });

    test('version_control_modified matches info hex', () => {
      expect(colors().version_control_modified).toBe(darkPalette.hex('info'));
    });

    test('link_text_hover matches info hex', () => {
      expect(colors().link_text_hover).toBe(darkPalette.hex('info'));
    });

    test('hex values in colors section are valid #RRGGBB or #RRGGBBAA format', () => {
      const colorValues = Object.values(colors()) as string[];
      for (const v of colorValues) {
        expect(v).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
      }
    });

    test('element_hover has hex alpha suffix', () => {
      expect(colors().element_hover).toMatch(/^#[0-9a-f]{8}$/i);
    });

    test('ghost_element_background is fully transparent', () => {
      expect(colors().ghost_element_background).toBe('#00000000');
    });

    test('border_transparent is fully transparent', () => {
      expect(colors().border_transparent).toBe('#00000000');
    });

    test('elevated_surface_background matches bg2 hex', () => {
      expect(colors().elevated_surface_background).toBe(darkPalette.hex('bg2'));
    });

    test('panel_background matches bg3 hex', () => {
      expect(colors().panel_background).toBe(darkPalette.hex('bg3'));
    });

    test('panel_focused_border matches border hex', () => {
      expect(colors().panel_focused_border).toBe(darkPalette.hex('border'));
    });

    test('debugger_accent matches warning hex', () => {
      expect(colors().debugger_accent).toBe(darkPalette.hex('warning'));
    });

    test('dim ANSI colors reuse base ANSI colors', () => {
      expect(colors().terminal_ansi_dim_red).toBe(colors().terminal_ansi_red);
      expect(colors().terminal_ansi_dim_blue).toBe(colors().terminal_ansi_blue);
    });
  });

  // ── Status Colors ──────────────────────────────────────────────────────────

  describe('status colors', () => {
    const status = () => parsed.themes[0].style.status;

    test('14 status groups present', () => {
      const groups = ['conflict', 'created', 'deleted', 'error', 'hidden', 'hint',
        'ignored', 'info', 'modified', 'predictive', 'renamed', 'success', 'unreachable', 'warning'];
      for (const g of groups) {
        expect(status()[g]).toBeDefined();
      }
    });

    test('each status group has _background and _border variants', () => {
      const groups = ['conflict', 'created', 'deleted', 'error', 'hidden', 'hint',
        'ignored', 'info', 'modified', 'predictive', 'renamed', 'success', 'unreachable', 'warning'];
      for (const g of groups) {
        expect(status()[`${g}_background`]).toBeDefined();
        expect(status()[`${g}_border`]).toBeDefined();
      }
    });

    test('error status matches error hex', () => {
      expect(status().error).toBe(darkPalette.hex('error'));
    });

    test('warning status matches warning hex', () => {
      expect(status().warning).toBe(darkPalette.hex('warning'));
    });

    test('success status matches success hex', () => {
      expect(status().success).toBe(darkPalette.hex('success'));
    });

    test('info status matches info hex', () => {
      expect(status().info).toBe(darkPalette.hex('info'));
    });

    test('conflict status matches warning hex', () => {
      expect(status().conflict).toBe(darkPalette.hex('warning'));
    });

    test('renamed status matches ac1 hex', () => {
      expect(status().renamed).toBe(darkPalette.hex('ac1'));
    });

    test('hidden status matches comment hex', () => {
      expect(status().hidden).toBe(darkPalette.hex('comment'));
    });

    test('hidden_background is fully transparent', () => {
      expect(status().hidden_background).toBe('#00000000');
    });

    test('hidden_border is fully transparent', () => {
      expect(status().hidden_border).toBe('#00000000');
    });

    test('ignored_border uses border role', () => {
      expect(status().ignored_border).toBe(darkPalette.hex('border'));
    });

    test('predictive_border uses border role', () => {
      expect(status().predictive_border).toBe(darkPalette.hex('border'));
    });

    test('status background values have hex alpha suffix', () => {
      expect(status().error_background).toMatch(/^#[0-9a-f]{8}$/i);
      expect(status().warning_background).toMatch(/^#[0-9a-f]{8}$/i);
      expect(status().success_background).toMatch(/^#[0-9a-f]{8}$/i);
      expect(status().info_background).toMatch(/^#[0-9a-f]{8}$/i);
    });

    test('all status hex values are valid format', () => {
      for (const v of Object.values(status()) as string[]) {
        expect(v).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
      }
    });
  });

  // ── Players ────────────────────────────────────────────────────────────────

  describe('players', () => {
    const players = () => parsed.themes[0].style.players;

    test('has 6 players', () => {
      expect(players()).toHaveLength(6);
    });

    test('each player has cursor, selection, and background', () => {
      for (const p of players()) {
        expect(p.cursor).toBeDefined();
        expect(p.selection).toBeDefined();
        expect(p.background).toBeDefined();
      }
    });

    test('player 0 cursor matches cursor role hex', () => {
      expect(players()[0].cursor).toBe(darkPalette.hex('cursor'));
    });

    test('player 0 background matches cursor role hex', () => {
      expect(players()[0].background).toBe(darkPalette.hex('cursor'));
    });

    test('player 1 cursor matches ac1 hex', () => {
      expect(players()[1].cursor).toBe(darkPalette.hex('ac1'));
    });

    test('player 2 cursor matches ac2 hex', () => {
      expect(players()[2].cursor).toBe(darkPalette.hex('ac2'));
    });

    test('player 3 cursor matches info hex', () => {
      expect(players()[3].cursor).toBe(darkPalette.hex('info'));
    });

    test('player 4 cursor matches warning hex', () => {
      expect(players()[4].cursor).toBe(darkPalette.hex('warning'));
    });

    test('player 5 cursor matches success hex', () => {
      expect(players()[5].cursor).toBe(darkPalette.hex('success'));
    });

    test('selection values have hex alpha suffix (40 = 25% opacity)', () => {
      for (const p of players()) {
        expect(p.selection).toMatch(/^#[0-9a-f]{8}$/i);
      }
    });

    test('all cursor values are valid hex', () => {
      for (const p of players()) {
        expect(p.cursor).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
      }
    });

    test('player background matches player cursor', () => {
      for (const p of players()) {
        expect(p.background).toBe(p.cursor);
      }
    });
  });

  // ── Syntax ─────────────────────────────────────────────────────────────────

  describe('syntax', () => {
    const syntax = () => parsed.themes[0].style.syntax;

    test('has at least 30 token types', () => {
      expect(Object.keys(syntax()).length).toBeGreaterThanOrEqual(30);
    });

    test('each token has color, font_style, and font_weight fields', () => {
      for (const tok of Object.values(syntax()) as Array<{ color: string; font_style: string | null; font_weight: string | null }>) {
        expect(tok.color).toBeDefined();
        expect('font_style' in tok).toBe(true);
        expect('font_weight' in tok).toBe(true);
      }
    });

    test('comment has italic font_style', () => {
      expect(syntax().comment.font_style).toBe('italic');
    });

    test('comment.doc has italic font_style', () => {
      expect(syntax()['comment.doc'].font_style).toBe('italic');
    });

    test('title has bold font_weight', () => {
      expect(syntax().title.font_weight).toBe('bold');
    });

    test('emphasis.strong has bold font_weight', () => {
      expect(syntax()['emphasis.strong'].font_weight).toBe('bold');
    });

    test('emphasis has italic font_style', () => {
      expect(syntax().emphasis.font_style).toBe('italic');
    });

    test('keyword color matches keyword palette hex', () => {
      expect(syntax().keyword.color).toBe(darkPalette.hex('keyword'));
    });

    test('function color matches function palette hex', () => {
      expect(syntax().function.color).toBe(darkPalette.hex('function'));
    });

    test('variable color matches variable palette hex', () => {
      expect(syntax().variable.color).toBe(darkPalette.hex('variable'));
    });

    test('type color matches type palette hex', () => {
      expect(syntax().type.color).toBe(darkPalette.hex('type'));
    });

    test('property color matches property palette hex', () => {
      expect(syntax().property.color).toBe(darkPalette.hex('property'));
    });

    test('tag color matches tag palette hex', () => {
      expect(syntax().tag.color).toBe(darkPalette.hex('tag'));
    });

    test('comment color matches comment palette hex', () => {
      expect(syntax().comment.color).toBe(darkPalette.hex('comment'));
    });

    test('string color uses fg1 (strings are plain text)', () => {
      expect(syntax().string.color).toBe(darkPalette.hex('fg1'));
    });

    test('string.special color uses ac2', () => {
      expect(syntax()['string.special'].color).toBe(darkPalette.hex('ac2'));
    });

    test('string.special.symbol color uses ac1', () => {
      expect(syntax()['string.special.symbol'].color).toBe(darkPalette.hex('ac1'));
    });

    test('operator color matches operator palette hex', () => {
      expect(syntax().operator.color).toBe(darkPalette.hex('operator'));
    });

    test('constructor color matches function palette hex', () => {
      expect(syntax().constructor.color).toBe(darkPalette.hex('function'));
    });

    test('enum color matches type palette hex', () => {
      expect(syntax().enum.color).toBe(darkPalette.hex('type'));
    });

    test('number color matches constant palette hex', () => {
      expect(syntax().number.color).toBe(darkPalette.hex('constant'));
    });

    test('boolean color matches language palette hex', () => {
      expect(syntax().boolean.color).toBe(darkPalette.hex('language'));
    });

    test('preproc color matches modifier palette hex', () => {
      expect(syntax().preproc.color).toBe(darkPalette.hex('modifier'));
    });

    test('punctuation.bracket color matches punctuationBrace palette hex', () => {
      expect(syntax()['punctuation.bracket'].color).toBe(darkPalette.hex('punctuationBrace'));
    });

    test('punctuation.delimiter color matches punctuationComma palette hex', () => {
      expect(syntax()['punctuation.delimiter'].color).toBe(darkPalette.hex('punctuationComma'));
    });

    test('variant color matches variableProperty palette hex', () => {
      expect(syntax().variant.color).toBe(darkPalette.hex('variableProperty'));
    });

    test('all color values are valid hex strings', () => {
      for (const tok of Object.values(syntax()) as Array<{ color: string }>) {
        expect(tok.color).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
      }
    });

    test('font_style values are italic, oblique, or null', () => {
      for (const tok of Object.values(syntax()) as Array<{ font_style: string | null }>) {
        expect([null, 'italic', 'oblique']).toContain(tok.font_style);
      }
    });

    test('font_weight values are bold or null', () => {
      for (const tok of Object.values(syntax()) as Array<{ font_weight: string | null }>) {
        expect([null, 'bold']).toContain(tok.font_weight);
      }
    });

    test('link_uri has italic font_style', () => {
      expect(syntax().link_uri.font_style).toBe('italic');
    });

    test('predictive has italic font_style', () => {
      expect(syntax().predictive.font_style).toBe('italic');
    });

    test('primary color uses fg1', () => {
      expect(syntax().primary.color).toBe(darkPalette.hex('fg1'));
    });

    test('embedded color uses fg2', () => {
      expect(syntax().embedded.color).toBe(darkPalette.hex('fg2'));
    });

    test('hint color uses info', () => {
      expect(syntax().hint.color).toBe(darkPalette.hex('info'));
    });

    test('label color uses class', () => {
      expect(syntax().label.color).toBe(darkPalette.hex('class'));
    });
  });

  // ── Options ────────────────────────────────────────────────────────────────

  describe('options', () => {
    test('custom name is used in both top-level and theme entry', () => {
      const out = JSON.parse(exportZed(darkPalette, { name: 'Sacred Geometry Dark' }));
      expect(out.name).toBe('Sacred Geometry Dark');
      expect(out.themes[0].name).toBe('Sacred Geometry Dark');
    });

    test('custom author is used', () => {
      const out = JSON.parse(exportZed(darkPalette, { author: 'Rusty' }));
      expect(out.author).toBe('Rusty');
    });

    test('both name and author can be set together', () => {
      const out = JSON.parse(exportZed(darkPalette, { name: 'Custom', author: 'Me' }));
      expect(out.name).toBe('Custom');
      expect(out.author).toBe('Me');
    });

    test('no name falls back to palette spec name', () => {
      expect(parsed.name).toBe('zed');
    });

    test('light palette produces appearance: light', () => {
      const out = JSON.parse(exportZed(lightPalette));
      expect(out.themes[0].appearance).toBe('light');
    });

    test('light palette background matches bg1 hex of light palette', () => {
      const out = JSON.parse(exportZed(lightPalette));
      expect(out.themes[0].style.colors.background).toBe(lightPalette.hex('bg1'));
    });

    test('light palette editor_foreground matches fg1 hex of light palette', () => {
      const out = JSON.parse(exportZed(lightPalette));
      expect(out.themes[0].style.colors.editor_foreground).toBe(lightPalette.hex('fg1'));
    });

    test('light palette terminal colors use light palette ANSI values', () => {
      const out = JSON.parse(exportZed(lightPalette));
      expect(out.themes[0].style.colors.terminal_ansi_red).toBe(lightPalette.hex('ansiRed'));
    });
  });

});

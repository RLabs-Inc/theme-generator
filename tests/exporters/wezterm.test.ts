import { describe, test, expect, beforeAll } from 'bun:test';
import { exportWezTerm } from '../../src/exporters/wezterm.js';
import { createTerminalSpec } from '../../src/specs/terminal.js';
import { extract } from '../../src/extract.js';
import type { ThemePalette } from '../../src/types.js';
import type { OklchColor } from '@rlabs-inc/color-generator';

// ── Shared fixtures ───────────────────────────────────────────────────────────

function makeCloud(): OklchColor[] {
  const cloud: OklchColor[] = [];
  for (let h = 0; h < 360; h += 10) {
    cloud.push({ l: 0.08, c: 0.02, h });
    cloud.push({ l: 0.97, c: 0.03, h });
    cloud.push({ l: 0.55, c: 0.25, h });
  }
  return cloud;
}

let palette: ThemePalette;

beforeAll(() => {
  palette = extract(makeCloud(), createTerminalSpec(), 'dark', { randomSeed: 42 });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exporters/wezterm', () => {

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(exportWezTerm(palette).length).toBeGreaterThan(0);
    });

    test('starts with [colors] section', () => {
      expect(exportWezTerm(palette)).toMatch(/^\[colors\]/);
    });

    test('contains ansi = [ array', () => {
      expect(exportWezTerm(palette)).toContain('ansi = [');
    });

    test('contains brights = [ array', () => {
      expect(exportWezTerm(palette)).toContain('brights = [');
    });

    test('contains background field', () => {
      expect(exportWezTerm(palette)).toContain('background = ');
    });

    test('contains foreground field', () => {
      expect(exportWezTerm(palette)).toContain('foreground = ');
    });

    test('contains cursor_bg field', () => {
      expect(exportWezTerm(palette)).toContain('cursor_bg = ');
    });

    test('contains cursor_border field', () => {
      expect(exportWezTerm(palette)).toContain('cursor_border = ');
    });

    test('contains cursor_fg field', () => {
      expect(exportWezTerm(palette)).toContain('cursor_fg = ');
    });

    test('contains selection_bg field', () => {
      expect(exportWezTerm(palette)).toContain('selection_bg = ');
    });

    test('contains selection_fg field', () => {
      expect(exportWezTerm(palette)).toContain('selection_fg = ');
    });

    test('contains [metadata] section', () => {
      expect(exportWezTerm(palette)).toContain('[metadata]');
    });

    test('contains name field in metadata', () => {
      expect(exportWezTerm(palette)).toContain('name = ');
    });

    test('all hex values are valid "RRGGBB" format', () => {
      const output = exportWezTerm(palette);
      const hexMatches = output.match(/"(#[0-9a-f]{6,8})"/gi) ?? [];
      expect(hexMatches.length).toBeGreaterThan(10);
      for (const match of hexMatches) {
        expect(match).toMatch(/^"#[0-9a-f]{6,8}"$/i);
      }
    });
  });

  describe('role mapping', () => {
    test('background matches bg1', () => {
      expect(exportWezTerm(palette)).toContain(`background = "${palette.hex('bg1')}"`);
    });

    test('foreground matches fg1', () => {
      expect(exportWezTerm(palette)).toContain(`foreground = "${palette.hex('fg1')}"`);
    });

    test('cursor_bg matches cursor', () => {
      expect(exportWezTerm(palette)).toContain(`cursor_bg = "${palette.hex('cursor')}"`);
    });

    test('cursor_border matches cursor (same as cursor_bg)', () => {
      expect(exportWezTerm(palette)).toContain(`cursor_border = "${palette.hex('cursor')}"`);
    });

    test('cursor_fg matches cursorText (bg1 copy)', () => {
      expect(exportWezTerm(palette)).toContain(`cursor_fg = "${palette.hex('cursorText')}"`);
    });

    test('selection_bg matches selectionBg', () => {
      expect(exportWezTerm(palette)).toContain(`selection_bg = "${palette.hex('selectionBg')}"`);
    });

    test('selection_fg matches selectionFg', () => {
      expect(exportWezTerm(palette)).toContain(`selection_fg = "${palette.hex('selectionFg')}"`);
    });

    test('ansi array contains ansiRed at index 1', () => {
      const output = exportWezTerm(palette);
      const ansiSection = output.split('ansi = [')[1].split(']')[0];
      const hexValues = ansiSection.match(/"(#[0-9a-f]{6,8})"/gi) ?? [];
      expect(hexValues[1]).toBe(`"${palette.hex('ansiRed')}"`);
    });

    test('ansi array contains ansiBlue at index 4', () => {
      const output = exportWezTerm(palette);
      const ansiSection = output.split('ansi = [')[1].split(']')[0];
      const hexValues = ansiSection.match(/"(#[0-9a-f]{6,8})"/gi) ?? [];
      expect(hexValues[4]).toBe(`"${palette.hex('ansiBlue')}"`);
    });

    test('brights array contains ansiBrightRed at index 1', () => {
      const output = exportWezTerm(palette);
      const brightsSection = output.split('brights = [')[1].split(']')[0];
      const hexValues = brightsSection.match(/"(#[0-9a-f]{6,8})"/gi) ?? [];
      expect(hexValues[1]).toBe(`"${palette.hex('ansiBrightRed')}"`);
    });
  });

  describe('options', () => {
    test('custom name appears in metadata section', () => {
      const output = exportWezTerm(palette, { name: 'Sacred Geometry Dark' });
      expect(output).toContain('name = "Sacred Geometry Dark"');
    });

    test('no name option falls back to spec name', () => {
      expect(exportWezTerm(palette)).toContain('name = "terminal"');
    });
  });

  describe('light mode', () => {
    test('light palette produces valid output', () => {
      const lightPalette = extract(makeCloud(), createTerminalSpec(), 'light', { randomSeed: 42 });
      const output = exportWezTerm(lightPalette);
      expect(output).toContain('[colors]');
      expect(output).toContain('background = ');
    });
  });

});

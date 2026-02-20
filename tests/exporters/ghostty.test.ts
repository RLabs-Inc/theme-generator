import { describe, test, expect, beforeAll } from 'bun:test';
import { exportGhostty } from '../../src/exporters/ghostty.js';
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

describe('exporters/ghostty', () => {

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(exportGhostty(palette).length).toBeGreaterThan(0);
    });

    test('has all 16 palette entries (0–15)', () => {
      const output = exportGhostty(palette);
      for (let i = 0; i <= 15; i++) {
        expect(output).toContain(`palette = ${i}=`);
      }
    });

    test('contains background field', () => {
      expect(exportGhostty(palette)).toContain('background = ');
    });

    test('contains foreground field', () => {
      expect(exportGhostty(palette)).toContain('foreground = ');
    });

    test('contains cursor-color field', () => {
      expect(exportGhostty(palette)).toContain('cursor-color = ');
    });

    test('contains selection-background field', () => {
      expect(exportGhostty(palette)).toContain('selection-background = ');
    });

    test('contains selection-foreground field', () => {
      expect(exportGhostty(palette)).toContain('selection-foreground = ');
    });

    test('all hex values are valid #RRGGBB format', () => {
      const output = exportGhostty(palette);
      const hexMatches = output.match(/#[0-9a-f]{6,8}/gi) ?? [];
      expect(hexMatches.length).toBeGreaterThan(10);
      for (const match of hexMatches) {
        expect(match).toMatch(/^#[0-9a-f]{6,8}$/i);
      }
    });
  });

  describe('role mapping', () => {
    test('palette 0 (black) matches ansiBlack', () => {
      expect(exportGhostty(palette)).toContain(`palette = 0=${palette.hex('ansiBlack')}`);
    });

    test('palette 1 (red) matches ansiRed', () => {
      expect(exportGhostty(palette)).toContain(`palette = 1=${palette.hex('ansiRed')}`);
    });

    test('palette 2 (green) matches ansiGreen', () => {
      expect(exportGhostty(palette)).toContain(`palette = 2=${palette.hex('ansiGreen')}`);
    });

    test('palette 4 (blue) matches ansiBlue', () => {
      expect(exportGhostty(palette)).toContain(`palette = 4=${palette.hex('ansiBlue')}`);
    });

    test('palette 8 (bright black) matches ansiBrightBlack', () => {
      expect(exportGhostty(palette)).toContain(`palette = 8=${palette.hex('ansiBrightBlack')}`);
    });

    test('palette 9 (bright red) matches ansiBrightRed', () => {
      expect(exportGhostty(palette)).toContain(`palette = 9=${palette.hex('ansiBrightRed')}`);
    });

    test('palette 15 (bright white) matches ansiBrightWhite', () => {
      expect(exportGhostty(palette)).toContain(`palette = 15=${palette.hex('ansiBrightWhite')}`);
    });

    test('background matches bg1', () => {
      expect(exportGhostty(palette)).toContain(`background = ${palette.hex('bg1')}`);
    });

    test('foreground matches fg1', () => {
      expect(exportGhostty(palette)).toContain(`foreground = ${palette.hex('fg1')}`);
    });

    test('cursor-color matches cursor', () => {
      expect(exportGhostty(palette)).toContain(`cursor-color = ${palette.hex('cursor')}`);
    });

    test('selection-background matches selectionBg', () => {
      expect(exportGhostty(palette)).toContain(`selection-background = ${palette.hex('selectionBg')}`);
    });

    test('selection-foreground matches selectionFg', () => {
      expect(exportGhostty(palette)).toContain(`selection-foreground = ${palette.hex('selectionFg')}`);
    });
  });

  describe('light mode', () => {
    test('light palette produces valid output', () => {
      const lightPalette = extract(makeCloud(), createTerminalSpec(), 'light', { randomSeed: 42 });
      const output = exportGhostty(lightPalette);
      expect(output).toContain('background = ');
      expect(output).toContain('palette = 0=');
    });
  });

});

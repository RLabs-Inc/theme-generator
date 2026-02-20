import { describe, test, expect, beforeAll } from 'bun:test';
import { exportWarp } from '../../src/exporters/warp.js';
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

let darkPalette: ThemePalette;
let lightPalette: ThemePalette;

beforeAll(() => {
  const cloud = makeCloud();
  const spec = createTerminalSpec();
  darkPalette  = extract(cloud, spec, 'dark',  { randomSeed: 42 });
  lightPalette = extract(cloud, spec, 'light', { randomSeed: 42 });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exporters/warp', () => {

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(exportWarp(darkPalette).length).toBeGreaterThan(0);
    });

    test('starts with name: field', () => {
      expect(exportWarp(darkPalette, { name: 'My Theme' })).toMatch(/^name: 'My Theme'/);
    });

    test('contains accent: field', () => {
      expect(exportWarp(darkPalette)).toContain("accent:");
    });

    test('contains cursor: field', () => {
      expect(exportWarp(darkPalette)).toContain("cursor:");
    });

    test('contains background: field', () => {
      expect(exportWarp(darkPalette)).toContain("background:");
    });

    test('contains foreground: field', () => {
      expect(exportWarp(darkPalette)).toContain("foreground:");
    });

    test('contains details: field', () => {
      expect(exportWarp(darkPalette)).toContain("details:");
    });

    test('contains terminal_colors: section', () => {
      expect(exportWarp(darkPalette)).toContain("terminal_colors:");
    });

    test('contains bright: subsection', () => {
      expect(exportWarp(darkPalette)).toContain("    bright:");
    });

    test('contains normal: subsection', () => {
      expect(exportWarp(darkPalette)).toContain("    normal:");
    });

    test('all 8 normal ANSI color fields present', () => {
      const output = exportWarp(darkPalette);
      for (const color of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
        expect(output).toContain(`        ${color}:`);
      }
    });
  });

  describe('role mapping', () => {
    test('background matches bg1 hex', () => {
      const output = exportWarp(darkPalette);
      expect(output).toContain(`background: '${darkPalette.hex('bg1')}'`);
    });

    test('foreground matches fg1 hex', () => {
      const output = exportWarp(darkPalette);
      expect(output).toContain(`foreground: '${darkPalette.hex('fg1')}'`);
    });

    test('cursor matches cursor hex', () => {
      const output = exportWarp(darkPalette);
      expect(output).toContain(`cursor: '${darkPalette.hex('cursor')}'`);
    });

    test('accent matches ac1 hex', () => {
      const output = exportWarp(darkPalette);
      expect(output).toContain(`accent: '${darkPalette.hex('ac1')}'`);
    });

    test('normal red matches ansiRed hex', () => {
      const output = exportWarp(darkPalette);
      expect(output).toContain(`        red: '${darkPalette.hex('ansiRed')}'`);
    });

    test('bright red matches ansiBrightRed hex', () => {
      const output = exportWarp(darkPalette);
      // In bright section, red appears
      const brightSection = output.split('    bright:')[1].split('    normal:')[0];
      expect(brightSection).toContain(`        red: '${darkPalette.hex('ansiBrightRed')}'`);
    });

    test('all hex values are valid #RRGGBB format', () => {
      const output = exportWarp(darkPalette);
      const hexMatches = output.match(/'(#[0-9a-f]{6,8})'/gi) ?? [];
      expect(hexMatches.length).toBeGreaterThan(10);
      for (const match of hexMatches) {
        expect(match).toMatch(/^'#[0-9a-f]{6,8}'$/i);
      }
    });
  });

  describe('options', () => {
    test('custom name appears in output', () => {
      const output = exportWarp(darkPalette, { name: 'Sacred Geometry' });
      expect(output).toContain("name: 'Sacred Geometry'");
    });

    test('dark mode defaults to details: darker', () => {
      expect(exportWarp(darkPalette)).toContain("details: 'darker'");
    });

    test('light mode defaults to details: lighter', () => {
      expect(exportWarp(lightPalette)).toContain("details: 'lighter'");
    });

    test('details option overrides auto-detection', () => {
      expect(exportWarp(darkPalette, { details: 'lighter' })).toContain("details: 'lighter'");
    });

    test('no name option uses spec name as fallback', () => {
      expect(exportWarp(darkPalette)).toContain("name: 'terminal'");
    });
  });

});

import { describe, test, expect, beforeAll } from 'bun:test';
import { exportVSCode } from '../../src/exporters/vscode/index.js';
import { createVSCodeSpec } from '../../src/specs/vscode.js';
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
  const spec  = createVSCodeSpec();
  darkPalette  = extract(cloud, spec, 'dark',  { randomSeed: 42 });
  lightPalette = extract(cloud, spec, 'light', { randomSeed: 42 });
  parsed = JSON.parse(exportVSCode(darkPalette));
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exporters/vscode', () => {

  describe('output format', () => {
    test('returns a non-empty string', () => {
      expect(exportVSCode(darkPalette).length).toBeGreaterThan(0);
    });

    test('produces valid JSON', () => {
      expect(() => JSON.parse(exportVSCode(darkPalette))).not.toThrow();
    });

    test('JSON is pretty-printed (contains newlines)', () => {
      expect(exportVSCode(darkPalette)).toContain('\n');
    });

    test('top-level name field matches spec name by default', () => {
      expect(parsed.name).toBe('vscode');
    });

    test('type field is dark for dark palette', () => {
      const out = JSON.parse(exportVSCode(darkPalette));
      expect(out.type).toBe('dark');
    });

    test('type field is light for light palette', () => {
      const out = JSON.parse(exportVSCode(lightPalette));
      expect(out.type).toBe('light');
    });

    test('semanticHighlighting is true by default', () => {
      expect(parsed.semanticHighlighting).toBe(true);
    });

    test('semanticClass is theme.rlabs', () => {
      expect(parsed.semanticClass).toBe('theme.rlabs');
    });

    test('colors section is a non-empty object', () => {
      expect(typeof parsed.colors).toBe('object');
      expect(Object.keys(parsed.colors).length).toBeGreaterThan(100);
    });

    test('tokenColors section is a non-empty array', () => {
      expect(Array.isArray(parsed.tokenColors)).toBe(true);
      expect(parsed.tokenColors.length).toBeGreaterThan(50);
    });

    test('semanticTokenColors section is a non-empty object', () => {
      expect(typeof parsed.semanticTokenColors).toBe('object');
      expect(Object.keys(parsed.semanticTokenColors).length).toBeGreaterThan(20);
    });
  });

  describe('UI color mappings', () => {
    test('editor.background matches bg1 hex', () => {
      expect(parsed.colors['editor.background']).toBe(darkPalette.hex('bg1'));
    });

    test('editor.foreground matches fg1 hex', () => {
      expect(parsed.colors['editor.foreground']).toBe(darkPalette.hex('fg1'));
    });

    test('editorCursor.foreground matches ac1 hex', () => {
      expect(parsed.colors['editorCursor.foreground']).toBe(darkPalette.hex('ac1'));
    });

    test('statusBar.background matches ac2 hex', () => {
      expect(parsed.colors['statusBar.background']).toBe(darkPalette.hex('ac2'));
    });

    test('statusBar.foreground matches ac2Fg hex', () => {
      expect(parsed.colors['statusBar.foreground']).toBe(darkPalette.hex('ac2Fg'));
    });

    test('panel.border matches ac1 hex', () => {
      expect(parsed.colors['panel.border']).toBe(darkPalette.hex('ac1'));
    });

    test('editor.selectionBackground matches selectionBg hex', () => {
      expect(parsed.colors['editor.selectionBackground']).toBe(darkPalette.hex('selectionBg'));
    });

    test('editor.lineHighlightBackground matches lineHighlight hex', () => {
      expect(parsed.colors['editor.lineHighlightBackground']).toBe(darkPalette.hex('lineHighlight'));
    });

    test('editor.findMatchBackground matches findMatch hex', () => {
      expect(parsed.colors['editor.findMatchBackground']).toBe(darkPalette.hex('findMatch'));
    });

    test('editorError.foreground matches error hex', () => {
      expect(parsed.colors['editorError.foreground']).toBe(darkPalette.hex('error'));
    });

    test('editorWarning.foreground matches warning hex', () => {
      expect(parsed.colors['editorWarning.foreground']).toBe(darkPalette.hex('warning'));
    });

    test('editorInfo.foreground matches info hex', () => {
      expect(parsed.colors['editorInfo.foreground']).toBe(darkPalette.hex('info'));
    });

    test('focusBorder matches border hex', () => {
      expect(parsed.colors['focusBorder']).toBe(darkPalette.hex('border'));
    });

    test('terminal.background matches bg1 hex', () => {
      expect(parsed.colors['terminal.background']).toBe(darkPalette.hex('bg1'));
    });

    test('terminal.ansiRed matches ansiRed hex', () => {
      expect(parsed.colors['terminal.ansiRed']).toBe(darkPalette.hex('ansiRed'));
    });

    test('terminal.ansiBrightBlue matches ansiBrightBlue hex', () => {
      expect(parsed.colors['terminal.ansiBrightBlue']).toBe(darkPalette.hex('ansiBrightBlue'));
    });

    test('all 8 normal ANSI terminal colors present', () => {
      for (const name of ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']) {
        expect(parsed.colors[`terminal.ansi${name}`]).toBeDefined();
      }
    });

    test('all 8 bright ANSI terminal colors present', () => {
      for (const name of ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White']) {
        expect(parsed.colors[`terminal.ansiBright${name}`]).toBeDefined();
      }
    });

    test('hex values in colors section are valid #RRGGBB or #RRGGBBAA format', () => {
      const colorValues = Object.values(parsed.colors) as string[];
      for (const v of colorValues) {
        expect(v).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
      }
    });

    test('button.background has hex alpha suffix (opacity)', () => {
      // ac2 + 'db' = 8-char hex
      expect(parsed.colors['button.background']).toMatch(/^#[0-9a-f]{8}$/i);
    });

    test('list.activeSelectionBackground has hex alpha suffix', () => {
      expect(parsed.colors['list.activeSelectionBackground']).toMatch(/^#[0-9a-f]{8}$/i);
    });
  });

  describe('token colors', () => {
    test('each tokenColor entry has a scope field', () => {
      for (const tc of parsed.tokenColors) {
        expect(tc.scope).toBeDefined();
      }
    });

    test('each tokenColor settings field has at least foreground or fontStyle', () => {
      for (const tc of parsed.tokenColors) {
        const hasColor = tc.settings.foreground !== undefined;
        const hasStyle = tc.settings.fontStyle !== undefined;
        expect(hasColor || hasStyle).toBe(true);
      }
    });

    test('foreground values in tokenColors are valid hex strings', () => {
      for (const tc of parsed.tokenColors) {
        if (tc.settings.foreground) {
          expect(tc.settings.foreground).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
        }
      }
    });

    test('comment scope is present in tokenColors', () => {
      const found = parsed.tokenColors.some((tc: { scope: string | string[] }) =>
        (Array.isArray(tc.scope) ? tc.scope : [tc.scope]).some((s: string) => s === 'comment')
      );
      expect(found).toBe(true);
    });

    test('keyword scope is present in tokenColors', () => {
      const found = parsed.tokenColors.some((tc: { scope: string | string[] }) =>
        (Array.isArray(tc.scope) ? tc.scope : [tc.scope]).some((s: string) => s === 'keyword')
      );
      expect(found).toBe(true);
    });
  });

  describe('semantic token colors', () => {
    test('variable key is present', () => {
      expect(parsed.semanticTokenColors['variable']).toBeDefined();
    });

    test('function key is present', () => {
      expect(parsed.semanticTokenColors['function']).toBeDefined();
    });

    test('class key is present', () => {
      expect(parsed.semanticTokenColors['class']).toBeDefined();
    });

    test('type key is present', () => {
      expect(parsed.semanticTokenColors['type']).toBeDefined();
    });

    test('keyword key matches keyword palette hex', () => {
      expect(parsed.semanticTokenColors['keyword']).toBe(darkPalette.hex('keyword'));
    });

    test('comment semantic token matches comment palette hex', () => {
      expect(parsed.semanticTokenColors['comment']).toBe(darkPalette.hex('comment'));
    });

    test('rust-specific semantic tokens present', () => {
      expect(parsed.semanticTokenColors['macro:rust']).toBeDefined();
    });

    test('python-specific semantic tokens present', () => {
      expect(parsed.semanticTokenColors['class:python']).toBeDefined();
    });

    test('typescript-specific semantic tokens present', () => {
      expect(parsed.semanticTokenColors['variable.readonly:typescript']).toBeDefined();
    });

    test('string semantic token matches fg1 hex', () => {
      expect(parsed.semanticTokenColors['string']).toBe(darkPalette.hex('fg1'));
    });
  });

  describe('options', () => {
    test('custom name option is used', () => {
      const out = JSON.parse(exportVSCode(darkPalette, { name: 'Sacred Geometry Dark' }));
      expect(out.name).toBe('Sacred Geometry Dark');
    });

    test('semanticHighlighting can be disabled', () => {
      const out = JSON.parse(exportVSCode(darkPalette, { semanticHighlighting: false }));
      expect(out.semanticHighlighting).toBe(false);
    });

    test('no name falls back to palette spec name', () => {
      const out = JSON.parse(exportVSCode(darkPalette));
      expect(out.name).toBe('vscode');
    });

    test('light palette produces type: light', () => {
      const out = JSON.parse(exportVSCode(lightPalette));
      expect(out.type).toBe('light');
    });

    test('light palette editor.background matches bg1 hex of light palette', () => {
      const out = JSON.parse(exportVSCode(lightPalette));
      expect(out.colors['editor.background']).toBe(lightPalette.hex('bg1'));
    });
  });

});

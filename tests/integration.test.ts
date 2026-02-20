import { describe, test, expect, beforeAll } from 'bun:test';
import { generate, getAllPatterns, type OklchColor } from '@rlabs-inc/color-generator';

import {
  // Specs
  createTerminalSpec,
  createVSCodeSpec,
  createZedSpec,
  createHelixSpec,
  createVimSpec,
  createNvimSpec,
  createShadcnSpec,
  createBrandingSpec,
  createTailwindSpec,
  // Extraction
  extract,
  // Exporters
  exportWarp,
  exportGhostty,
  exportWezTerm,
  exportVSCode,
  exportZed,
  exportVim,
  exportNvim,
  exportHelix,
  // Types
  type ThemePalette,
  type ThemeSpec,
  type ThemeMode,
} from '../src/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a real color cloud from a sacred geometry pattern */
function generateCloud(patternName: string, hue: number, count = 12): OklchColor[] {
  const seed: OklchColor = { l: 0.55, c: 0.20, h: hue };
  const result = generate(patternName, seed, { count });
  return result.colors;
}

/** Verify every role in the spec is present in the palette */
function assertAllRolesResolved(palette: ThemePalette, spec: ThemeSpec) {
  for (const role of spec.roles) {
    const color = palette.get(role.name);
    expect(color).toBeDefined();
    expect(color!.hex).toMatch(/^#[0-9a-f]{6,8}$/i);
  }
  for (const derived of spec.derived) {
    const color = palette.get(derived.name);
    expect(color).toBeDefined();
    expect(color!.hex).toMatch(/^#[0-9a-f]{6,8}$/i);
  }
}

/** Verify a palette has correct mode metadata */
function assertPaletteMetadata(palette: ThemePalette, specName: string, mode: ThemeMode) {
  expect(palette.spec).toBe(specName);
  expect(palette.mode).toBe(mode);
}

/** Verify bg lightness is within mode-appropriate range */
function assertBgLightnessForMode(palette: ThemePalette, mode: ThemeMode) {
  const bg = palette.get('bg1');
  if (!bg) return; // specs without bg1 (branding, tailwind) skip this
  if (mode === 'dark') {
    // Dark bg1 constraint: L [0, 0.35]
    expect(bg.oklch.l).toBeLessThanOrEqual(0.36);
  } else {
    // Light bg1 constraint: L [0.93, 1.0]
    expect(bg.oklch.l).toBeGreaterThanOrEqual(0.92);
  }
}

// ── Test Data ────────────────────────────────────────────────────────────────

/** 5 diverse sacred geometry patterns for integration testing */
const TEST_PATTERNS = [
  'Golden Ratio',
  'Fibonacci Sequence',
  'Triadic',
  'Möbius Strip',
  'Solfeggio Frequencies',
];

const SEED = 42;

// ── Full Pipeline Tests ──────────────────────────────────────────────────────

describe('integration: full pipeline', () => {

  // ── Terminal → Warp / Ghostty / WezTerm ──────────────────────────────────

  describe('terminal targets (Warp, Ghostty, WezTerm)', () => {
    const spec = createTerminalSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('palette metadata correct', () => {
          for (const palette of palettes) {
            assertPaletteMetadata(palette, 'terminal', mode);
          }
        });

        test('bg lightness matches mode', () => {
          for (const palette of palettes) {
            assertBgLightnessForMode(palette, mode);
          }
        });

        test('exportWarp produces valid YAML-like output', () => {
          for (const palette of palettes) {
            const out = exportWarp(palette, { name: 'Integration Test' });
            expect(out.length).toBeGreaterThan(100);
            expect(out).toContain("name: 'Integration Test'");
            expect(out).toContain('background:');
            expect(out).toContain('foreground:');
            expect(out).toContain('terminal_colors:');
          }
        });

        test('exportGhostty produces key=value config', () => {
          for (const palette of palettes) {
            const out = exportGhostty(palette, { name: 'Integration Test' });
            expect(out.length).toBeGreaterThan(50);
            expect(out).toContain('background =');
            expect(out).toContain('foreground =');
            expect(out).toContain('palette =');
          }
        });

        test('exportWezTerm produces valid TOML', () => {
          for (const palette of palettes) {
            const out = exportWezTerm(palette, { name: 'Integration Test' });
            expect(out.length).toBeGreaterThan(50);
            expect(out).toContain('[metadata]');
            expect(out).toContain('[colors]');
            expect(out).toContain('foreground =');
            expect(out).toContain('background =');
          }
        });
      });
    }
  });

  // ── VSCode ─────────────────────────────────────────────────────────────────

  describe('VSCode target', () => {
    const spec = createVSCodeSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('bg lightness matches mode', () => {
          for (const palette of palettes) {
            assertBgLightnessForMode(palette, mode);
          }
        });

        test('exportVSCode produces valid JSON with required keys', () => {
          for (const palette of palettes) {
            const out = exportVSCode(palette, { name: 'Integration Test' });
            const parsed = JSON.parse(out);
            expect(parsed.name).toBe('Integration Test');
            expect(parsed.type).toBe(mode);
            expect(parsed.colors).toBeDefined();
            expect(parsed.tokenColors).toBeDefined();
            expect(parsed.semanticTokenColors).toBeDefined();
            expect(Object.keys(parsed.colors).length).toBeGreaterThan(50);
            expect(parsed.tokenColors.length).toBeGreaterThan(10);
          }
        });
      });
    }
  });

  // ── Zed ────────────────────────────────────────────────────────────────────

  describe('Zed target', () => {
    const spec = createZedSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('exportZed produces valid JSON with Zed schema', () => {
          for (const palette of palettes) {
            const out = exportZed(palette, { name: 'Integration Test' });
            const parsed = JSON.parse(out);
            expect(parsed.$schema).toContain('zed.dev/schema/themes');
            expect(parsed.name).toBe('Integration Test');
            expect(parsed.themes).toBeArrayOfSize(1);
            expect(parsed.themes[0].style).toBeDefined();
            expect(parsed.themes[0].style.players).toBeArrayOfSize(6);
          }
        });
      });
    }
  });

  // ── Helix ──────────────────────────────────────────────────────────────────

  describe('Helix target', () => {
    const spec = createHelixSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('exportHelix produces TOML with UI and syntax scopes', () => {
          for (const palette of palettes) {
            const out = exportHelix(palette, { name: 'Integration Test' });
            expect(out.length).toBeGreaterThan(100);
            expect(out).toContain('"ui.background"');
            expect(out).toContain('"ui.text"');
            expect(out).toContain('"ui.cursor"');
            expect(out).toContain('"keyword"');
            expect(out).toContain('"function"');
          }
        });
      });
    }
  });

  // ── Vim ────────────────────────────────────────────────────────────────────

  describe('Vim target', () => {
    const spec = createVimSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('exportVim produces VimScript with highlight groups', () => {
          for (const palette of palettes) {
            const out = exportVim(palette, { colorSchemeName: 'sacred-test' });
            expect(out.length).toBeGreaterThan(100);
            expect(out).toContain("let g:colors_name = 'sacred-test'");
            expect(out).toContain('highlight');
            expect(out).toContain('Normal');
            expect(out).toContain('Comment');
            expect(out).toContain('Keyword');
          }
        });
      });
    }
  });

  // ── Nvim ───────────────────────────────────────────────────────────────────

  describe('Nvim target', () => {
    const spec = createNvimSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('exportNvim produces Lua with TreeSitter groups and terminal colors', () => {
          for (const palette of palettes) {
            const out = exportNvim(palette, { colorSchemeName: 'sacred-test' });
            expect(out.length).toBeGreaterThan(100);
            expect(out).toContain("vim.cmd('highlight clear')");
            expect(out).toContain('vim.g.colors_name');
            expect(out).toContain('@keyword');
            expect(out).toContain('@function');
            expect(out).toContain('vim.g.terminal_color_0');
            expect(out).toContain('vim.g.terminal_color_15');
          }
        });
      });
    }
  });

  // ── shadcn/ui ──────────────────────────────────────────────────────────────

  describe('shadcn target', () => {
    const spec = createShadcnSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('palette metadata correct', () => {
          for (const palette of palettes) {
            assertPaletteMetadata(palette, 'shadcn', mode);
          }
        });
      });
    }
  });

  // ── Branding ───────────────────────────────────────────────────────────────

  describe('branding target', () => {
    const spec = createBrandingSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('palette metadata correct', () => {
          for (const palette of palettes) {
            assertPaletteMetadata(palette, 'branding', mode);
          }
        });
      });
    }
  });

  // ── Tailwind ───────────────────────────────────────────────────────────────

  describe('tailwind target', () => {
    const spec = createTailwindSpec();

    for (const mode of ['dark', 'light'] as ThemeMode[]) {
      describe(`${mode} mode`, () => {
        let palettes: ThemePalette[];

        beforeAll(() => {
          palettes = TEST_PATTERNS.map(p => {
            const cloud = generateCloud(p, SEED);
            return extract(cloud, spec, mode, { randomSeed: SEED });
          });
        });

        test('all roles resolved for every pattern', () => {
          for (const palette of palettes) {
            assertAllRolesResolved(palette, spec);
          }
        });

        test('palette metadata correct', () => {
          for (const palette of palettes) {
            assertPaletteMetadata(palette, 'tailwind', mode);
          }
        });

        test('all 7 families × 11 shades = 77 colors present', () => {
          for (const palette of palettes) {
            for (const family of ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error']) {
              for (const shade of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
                const role = `${family}${shade}`;
                // 500 is the anchor (a role), others are derived
                const color = palette.get(role);
                expect(color).toBeDefined();
                expect(color!.hex).toMatch(/^#[0-9a-f]{6,8}$/i);
              }
            }
          }
        });
      });
    }
  });
});

// ── Cross-Cutting Concerns ─────────────────────────────────────────────────

describe('integration: cross-cutting', () => {

  test('deterministic: same pattern + seed → identical palettes', () => {
    const cloud = generateCloud('Golden Ratio', SEED);
    const spec = createVSCodeSpec();
    const p1 = extract(cloud, spec, 'dark', { randomSeed: SEED });
    const p2 = extract(cloud, spec, 'dark', { randomSeed: SEED });

    for (const role of spec.roles) {
      expect(p1.hex(role.name)).toBe(p2.hex(role.name));
    }
    for (const d of spec.derived) {
      expect(p1.hex(d.name)).toBe(p2.hex(d.name));
    }
  });

  test('different seeds → different palettes', () => {
    const cloud1 = generateCloud('Golden Ratio', 42);
    const cloud2 = generateCloud('Golden Ratio', 99);
    const spec = createTerminalSpec();
    const p1 = extract(cloud1, spec, 'dark', { randomSeed: 42 });
    const p2 = extract(cloud2, spec, 'dark', { randomSeed: 99 });

    // At least some colors differ (statistical certainty with different seeds)
    const mismatches = spec.roles.filter(r => p1.hex(r.name) !== p2.hex(r.name));
    expect(mismatches.length).toBeGreaterThan(0);
  });

  test('different patterns → different palettes', () => {
    const cloud1 = generateCloud('Golden Ratio', SEED);
    const cloud2 = generateCloud('Möbius Strip', SEED);
    const spec = createTerminalSpec();
    const p1 = extract(cloud1, spec, 'dark', { randomSeed: SEED });
    const p2 = extract(cloud2, spec, 'dark', { randomSeed: SEED });

    const mismatches = spec.roles.filter(r => p1.hex(r.name) !== p2.hex(r.name));
    expect(mismatches.length).toBeGreaterThan(0);
  });

  test('dark and light modes produce fundamentally different bg/fg', () => {
    const cloud = generateCloud('Fibonacci Sequence', SEED);
    const spec = createVSCodeSpec();
    const dark  = extract(cloud, spec, 'dark',  { randomSeed: SEED });
    const light = extract(cloud, spec, 'light', { randomSeed: SEED });

    // Dark bg is dark, light bg is light
    expect(dark.get('bg1')!.oklch.l).toBeLessThanOrEqual(0.36);
    expect(light.get('bg1')!.oklch.l).toBeGreaterThanOrEqual(0.92);
    // FG flips accordingly
    expect(dark.get('fg1')!.oklch.l).toBeGreaterThan(0.7);
    expect(light.get('fg1')!.oklch.l).toBeLessThan(0.35);
  });

  test('constrained ANSI mode assigns hue-matched ANSI colors', () => {
    const cloud = generateCloud('Golden Ratio', SEED);
    const spec = createTerminalSpec({ ansiMode: 'constrained' });
    const palette = extract(cloud, spec, 'dark', { randomSeed: SEED, ansiMode: 'constrained' });

    // Red should be in the reddish hue range (roughly 0-40 or 340-360)
    const red = palette.get('ansiRed');
    expect(red).toBeDefined();
    const h = red!.oklch.h;
    expect(h < 50 || h > 330).toBe(true);
  });

  test('uniform (iso-lightness) mode produces same L for all accent/syntax roles', () => {
    const cloud = generateCloud('triadic', SEED);
    const spec = createVSCodeSpec();
    const palette = extract(cloud, spec, 'dark', { randomSeed: SEED, uniform: true });

    // Collect lightness values from non-excluded roles
    const excluded = new Set(['bg1', 'bg2', 'bg3', 'fg1', 'fg2', 'fg3', 'border']);
    const brightNames = new Set([
      'ansiBrightBlack', 'ansiBrightRed', 'ansiBrightGreen', 'ansiBrightYellow',
      'ansiBrightBlue', 'ansiBrightMagenta', 'ansiBrightCyan', 'ansiBrightWhite',
    ]);
    const lightnesses: number[] = [];
    for (const role of spec.roles) {
      if (excluded.has(role.name) || brightNames.has(role.name)) continue;
      const c = palette.get(role.name);
      if (c) lightnesses.push(c.oklch.l);
    }

    // All should be within a tight range (same shared L)
    const min = Math.min(...lightnesses);
    const max = Math.max(...lightnesses);
    expect(max - min).toBeLessThan(0.05);
  });

  test('locked colors are preserved through extraction', () => {
    const cloud = generateCloud('Golden Ratio', SEED);
    const spec = createTerminalSpec();
    const lockedHex = '#ff6600';
    const palette = extract(cloud, spec, 'dark', {
      randomSeed: SEED,
      locked: { ac1: lockedHex },
    });

    expect(palette.hex('ac1').toLowerCase()).toBe(lockedHex);
  });

  test('every registered pattern can produce a valid terminal theme', () => {
    const allPatterns = getAllPatterns();
    const spec = createTerminalSpec();
    const seed: OklchColor = { l: 0.55, c: 0.20, h: 180 };

    // Test a sample — every 10th pattern to keep test time reasonable
    const sample = allPatterns.filter((_, i) => i % 10 === 0);
    expect(sample.length).toBeGreaterThan(5);

    for (const pattern of sample) {
      const cloud = generate(pattern.name, seed, { count: 12 }).colors;
      const palette = extract(cloud, spec, 'dark', { randomSeed: SEED });
      const out = exportWarp(palette);
      expect(out.length).toBeGreaterThan(100);
    }
  });
});

// ── Public API Surface ─────────────────────────────────────────────────────

describe('integration: public API completeness', () => {

  test('all 9 spec creators are functions', () => {
    expect(typeof createTerminalSpec).toBe('function');
    expect(typeof createVSCodeSpec).toBe('function');
    expect(typeof createZedSpec).toBe('function');
    expect(typeof createHelixSpec).toBe('function');
    expect(typeof createVimSpec).toBe('function');
    expect(typeof createNvimSpec).toBe('function');
    expect(typeof createShadcnSpec).toBe('function');
    expect(typeof createBrandingSpec).toBe('function');
    expect(typeof createTailwindSpec).toBe('function');
  });

  test('all 8 exporters are functions', () => {
    expect(typeof exportWarp).toBe('function');
    expect(typeof exportGhostty).toBe('function');
    expect(typeof exportWezTerm).toBe('function');
    expect(typeof exportVSCode).toBe('function');
    expect(typeof exportZed).toBe('function');
    expect(typeof exportVim).toBe('function');
    expect(typeof exportNvim).toBe('function');
    expect(typeof exportHelix).toBe('function');
  });

  test('extract is a function', () => {
    expect(typeof extract).toBe('function');
  });
});

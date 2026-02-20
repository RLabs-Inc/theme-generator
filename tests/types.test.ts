import { describe, test, expect } from 'bun:test';
import type {
  ThemeMode,
  RoleConstraints,
  ContrastConstraint,
  RoleDefinition,
  DerivedTransform,
  DerivedDefinition,
  ThemeSpec,
  ExtractionOptions,
  PaletteColor,
  ExporterOptions,
  WarpExporterOptions,
  VSCodeExporterOptions,
  TerminalSpecOptions,
  VSCodeSpecOptions,
  ZedSpecOptions,
  ShadcnSpecOptions,
  BrandingSpecOptions,
  TailwindSpecOptions,
} from '../src/types.js';

describe('types — ThemeMode', () => {
  test('dark and light are valid values', () => {
    const dark: ThemeMode = 'dark';
    const light: ThemeMode = 'light';
    expect(dark).toBe('dark');
    expect(light).toBe('light');
  });
});

describe('types — RoleConstraints', () => {
  test('can define L/C constraints without hue', () => {
    const c: RoleConstraints = { l: [0, 0.2], c: [0, 0.04] };
    expect(c.l[0]).toBe(0);
    expect(c.l[1]).toBe(0.2);
    expect(c.c[0]).toBe(0);
    expect(c.c[1]).toBe(0.04);
    expect(c.h).toBeUndefined();
  });

  test('can define L/C/H constraints with hue', () => {
    const c: RoleConstraints = { l: [0.2, 1.0], c: [0.1, 0.4], h: [233, 270] };
    expect(c.h![0]).toBe(233);
    expect(c.h![1]).toBe(270);
  });

  test('wrapping hue range (min > max)', () => {
    const c: RoleConstraints = { l: [0, 1], c: [0, 0.4], h: [350, 30] };
    expect(c.h![0]).toBeGreaterThan(c.h![1]); // wrapping
  });
});

describe('types — ContrastConstraint', () => {
  test('min-only constraint', () => {
    const c: ContrastConstraint = { role: 'fg1', against: 'bg1', min: 7.5 };
    expect(c.min).toBe(7.5);
    expect(c.max).toBeUndefined();
  });

  test('min+max constraint (comments)', () => {
    const c: ContrastConstraint = { role: 'comment', against: 'bg1', min: 2.5, max: 3.5 };
    expect(c.min).toBe(2.5);
    expect(c.max).toBe(3.5);
  });
});

describe('types — RoleDefinition', () => {
  test('has dark and light constraints', () => {
    const role: RoleDefinition = {
      name: 'bg1',
      priority: 100,
      dark: { l: [0, 0.20], c: [0, 0.04] },
      light: { l: [0.93, 1.0], c: [0, 0.04] },
    };
    expect(role.name).toBe('bg1');
    expect(role.priority).toBe(100);
    expect(role.dark.l[1]).toBe(0.20);
    expect(role.light.l[0]).toBe(0.93);
  });
});

describe('types — DerivedTransform', () => {
  test('blend transform', () => {
    const t: DerivedTransform = { type: 'blend', a: 'fg1', b: 'bg1', amount: 0.4 };
    expect(t.type).toBe('blend');
  });

  test('adjustLightness transform', () => {
    const t: DerivedTransform = { type: 'adjustLightness', source: 'ansiRed', delta: 0.1 };
    expect(t.type).toBe('adjustLightness');
  });

  test('withAlpha transform', () => {
    const t: DerivedTransform = { type: 'withAlpha', source: 'ac1', alpha: 0.5 };
    expect(t.type).toBe('withAlpha');
  });

  test('ensureContrast transform', () => {
    const t: DerivedTransform = { type: 'ensureContrast', source: 'ac1', against: 'bg1', min: 2.5 };
    expect(t.type).toBe('ensureContrast');
  });

  test('copy transform', () => {
    const t: DerivedTransform = { type: 'copy', source: 'bg1' };
    expect(t.type).toBe('copy');
  });

  test('withHexAlpha transform', () => {
    const t: DerivedTransform = { type: 'withHexAlpha', source: 'ac2', hexAlpha: '30' };
    expect(t.type).toBe('withHexAlpha');
  });
});

describe('types — ThemeSpec', () => {
  test('can construct a minimal spec', () => {
    const spec: ThemeSpec = {
      name: 'test',
      roles: [
        { name: 'bg1', priority: 100, dark: { l: [0, 0.2], c: [0, 0.04] }, light: { l: [0.93, 1], c: [0, 0.04] } },
      ],
      derived: [
        { name: 'selection', transform: { type: 'blend', a: 'fg1', b: 'bg1', amount: 0.4 } },
      ],
      constraints: [
        { role: 'fg1', against: 'bg1', min: 7.5 },
      ],
      ansiMode: 'free',
    };
    expect(spec.name).toBe('test');
    expect(spec.roles).toHaveLength(1);
    expect(spec.derived).toHaveLength(1);
    expect(spec.constraints).toHaveLength(1);
    expect(spec.ansiMode).toBe('free');
  });
});

describe('types — ExtractionOptions', () => {
  test('default options (all undefined)', () => {
    const opts: ExtractionOptions = {};
    expect(opts.locked).toBeUndefined();
    expect(opts.randomSeed).toBeUndefined();
    expect(opts.ansiMode).toBeUndefined();
  });

  test('locked colors', () => {
    const opts: ExtractionOptions = {
      locked: { bg1: '#1a1b2e', fg1: '#f0f0f0' },
      randomSeed: 42,
      ansiMode: 'constrained',
    };
    expect(Object.keys(opts.locked!)).toHaveLength(2);
    expect(opts.randomSeed).toBe(42);
    expect(opts.ansiMode).toBe('constrained');
  });

  test('iso-lightness mode — off by default', () => {
    const opts: ExtractionOptions = {};
    expect(opts.uniform).toBeUndefined();
    expect(opts.uniformBrightDelta).toBeUndefined();
  });

  test('iso-lightness mode — all palette roles share one L value', () => {
    // accent + status + ANSI + syntax all get the same L
    // bg/fg/border excluded (must stay at extremes for contrast)
    const opts: ExtractionOptions = { uniform: true };
    expect(opts.uniform).toBe(true);
    // uniformBrightDelta defaults to 0.20 in the extraction engine when not set
    expect(opts.uniformBrightDelta).toBeUndefined();
  });

  test('iso-lightness mode — custom bright ANSI delta', () => {
    const opts: ExtractionOptions = { uniform: true, uniformBrightDelta: 0.15 };
    expect(opts.uniform).toBe(true);
    expect(opts.uniformBrightDelta).toBe(0.15);
  });
});

describe('types — ExporterOptions', () => {
  test('base options', () => {
    const opts: ExporterOptions = { name: 'Merkaba Dark', author: 'RLabs' };
    expect(opts.name).toBe('Merkaba Dark');
  });

  test('Warp options extend base', () => {
    const opts: WarpExporterOptions = { name: 'Test', details: 'darker' };
    expect(opts.details).toBe('darker');
  });

  test('VSCode options extend base', () => {
    const opts: VSCodeExporterOptions = { semanticHighlighting: false };
    expect(opts.semanticHighlighting).toBe(false);
  });
});

describe('types — Spec Preset Options', () => {
  test('terminal options', () => {
    const opts: TerminalSpecOptions = {
      ansiMode: 'constrained',
      contrastFg: 5.5,
      contrastAnsi: 3.5,
      contrastCursor: 4.5,
    };
    expect(opts.contrastFg).toBe(5.5);
  });

  test('VSCode options', () => {
    const opts: VSCodeSpecOptions = {
      contrastSyntax: 4.5,
      commentMin: 2.0,
      commentMax: 4.0,
    };
    expect(opts.commentMin).toBe(2.0);
  });

  test('Zed options extend VSCode', () => {
    const opts: ZedSpecOptions = {
      contrastFg: 7.5,
      playerCount: 8,
    };
    expect(opts.playerCount).toBe(8);
  });

  test('shadcn options', () => {
    const opts: ShadcnSpecOptions = { chartColors: 8, includeSidebar: false };
    expect(opts.chartColors).toBe(8);
  });

  test('branding options', () => {
    const opts: BrandingSpecOptions = { neutralCount: 7 };
    expect(opts.neutralCount).toBe(7);
  });

  test('tailwind options', () => {
    const opts: TailwindSpecOptions = { families: ['primary', 'accent'] };
    expect(opts.families).toHaveLength(2);
  });
});

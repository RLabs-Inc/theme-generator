# @rlabs-inc/theme-generator

Transform 3D OKLCH color clouds into complete editor and terminal themes. Feed it the output of [`@rlabs-inc/color-generator`](https://www.npmjs.com/package/@rlabs-inc/color-generator) and get production-ready themes for Warp, Ghostty, WezTerm, VSCode, Zed, Helix, Vim, Neovim, shadcn/ui, Tailwind CSS, and brand identity systems.

Ships with a CLI (`sacred-colors`) for interactive theme generation with live terminal previews.

## Install

```bash
npm install @rlabs-inc/theme-generator @rlabs-inc/color-generator culori
# or
bun add @rlabs-inc/theme-generator @rlabs-inc/color-generator culori
```

For the CLI only:

```bash
npx sacred-colors
# or install globally
npm install -g @rlabs-inc/theme-generator
sacred-colors
```

## CLI: `sacred-colors`

Interactive theme generator with live terminal previews.

```
$ sacred-colors
```

The CLI walks you through:

1. **Pattern selection** — Choose from 256 sacred geometry, mathematical, and physics patterns
2. **Seed color** — Enter an OKLCH seed or get a random one
3. **Theme mode** — Dark or light
4. **ANSI mode** — Free (mathematical mapping) or constrained (hue-matched: red stays red, blue stays blue)
5. **Target** — Pick your editor/terminal (or export all)
6. **Preview** — Live ANSI true-color preview with Apple logo art, syntax highlighting samples, and color swatches
7. **Explore loop** — Keep generating, adjusting ANSI mode, switching patterns — export when you find one you love

## Programmatic API

### Full Pipeline

```typescript
import { generate, randomColor } from '@rlabs-inc/color-generator';
import { createTerminalSpec, extract, exportGhostty } from '@rlabs-inc/theme-generator';

// 1. Generate a color cloud from a sacred geometry pattern
const seed = { l: 0.6, c: 0.15, h: 270 };
const { colors } = generate('Flower of Life', seed);

// 2. Create a spec (defines roles, constraints, contrast rules)
const spec = createTerminalSpec({ ansiMode: 'constrained' });

// 3. Extract: assign colors to roles via constraint satisfaction
const palette = extract(colors, spec, 'dark');

// 4. Export to target format
const ghosttyConfig = exportGhostty(palette, { name: 'My Sacred Theme' });
// => "palette = 0=#1a1a2e\npalette = 1=#e94560\n..."
```

### Extraction Options

```typescript
const palette = extract(colors, spec, 'dark', {
  locked: { bg1: '#1a1a2e', fg1: '#e0e0e0' }, // Pre-assign specific roles
  randomSeed: 42,                                // Deterministic tie-breaking
  ansiMode: 'constrained',                       // Override spec's ANSI mode
  uniform: true,                                  // Iso-lightness mode
  uniformBrightDelta: 0.20,                       // Bright ANSI offset
});
```

### Reading the Palette

```typescript
// Get a specific color
const bg = palette.get('bg1');
bg.hex;        // '#1a1a2e'
bg.oklch;      // { l: 0.15, c: 0.03, h: 270 }
bg.rgb;        // { r: 26, g: 26, b: 46 }
bg.css.oklch;  // 'oklch(0.15 0.03 270)'
bg.css.p3;     // 'color(display-p3 0.10 0.10 0.18)'

// Shorthand
palette.hex('fg1');  // '#e0e0e0'

// All assigned colors
Object.entries(palette.colors); // [['bg1', PaletteColor], ['fg1', PaletteColor], ...]
```

## 9 Spec Presets

Specs define **what** a theme needs — roles, constraints, contrast rules, derived colors. Each target has different requirements.

### Terminal

```typescript
import { createTerminalSpec } from '@rlabs-inc/theme-generator';

const spec = createTerminalSpec({
  ansiMode: 'constrained',  // 'free' | 'constrained'
  contrastFg: 7.5,          // FG vs BG minimum (WCAG AAA)
  contrastAnsi: 4.5,        // ANSI vs BG minimum
  contrastCursor: 5.5,      // Cursor vs BG minimum
});
```

**Roles (~30)**: bg1-bg3, fg1-fg3, ac1-ac2, border, cursor, info/error/warning/success, 8 ANSI colors + 8 bright variants, selectionBg/Fg, cursorText.

**Targets**: Warp, Ghostty, WezTerm, Kitty, any terminal emulator.

### VSCode

```typescript
import { createVSCodeSpec } from '@rlabs-inc/theme-generator';

const spec = createVSCodeSpec({
  ansiMode: 'free',
  contrastFg: 7.5,
  contrastSyntax: 5.5,
  commentMin: 2.5,          // Comment contrast floor
  commentMax: 3.5,          // Comment contrast ceiling (keeps them muted)
});
```

**Roles (~70)**: Full UI + 42 syntax roles (keyword, function, variable, type, string, number, property, operator, comment, and 33 more) + ANSI + derived overlays (selectionBg, lineHighlight, findMatch with alpha transparency) + 6 adaptive foreground colors.

### Zed

```typescript
import { createZedSpec } from '@rlabs-inc/theme-generator';

const spec = createZedSpec({
  ansiMode: 'constrained',
  contrastSyntax: 5.5,
  commentMin: 2.5,
  commentMax: 3.5,
});
```

**Roles (~71)**: Same as VSCode + cursor role. Exports include player cursors, status color groups, and full syntax token types.

### Helix

```typescript
import { createHelixSpec } from '@rlabs-inc/theme-generator';

const spec = createHelixSpec({
  ansiMode: 'constrained',
  contrastSyntax: 5.5,
});
```

**Roles (~71)**: Full editor spec with UI, cursor, syntax, ANSI. Exports TOML with ui.*, diagnostic, diff, markup, and syntax scopes.

### Vim

```typescript
import { createVimSpec } from '@rlabs-inc/theme-generator';

const spec = createVimSpec({
  contrastFg: 7.5,
  contrastSyntax: 5.5,
});
```

**Roles (~62)**: UI + cursor + 42 syntax roles. No ANSI (Vim doesn't control terminal palette). Exports VimScript with `set background`, highlight groups, spell checking, diff, diagnostics, and legacy syntax groups.

### Neovim

```typescript
import { createNvimSpec } from '@rlabs-inc/theme-generator';

const spec = createNvimSpec({
  ansiMode: 'constrained',
  contrastSyntax: 5.5,
});
```

**Roles (~70)**: Vim + ANSI + bright ANSI. Exports Lua with `vim.api.nvim_set_hl()`, TreeSitter groups (@keyword, @function, @variable, etc.), and `vim.g.terminal_color_*` for the integrated terminal.

### shadcn/ui

```typescript
import { createShadcnSpec } from '@rlabs-inc/theme-generator';

const spec = createShadcnSpec({
  chartColors: 5,         // Number of chart accent colors
  includeSidebar: true,   // Include sidebar color roles
});
```

**Roles (~25-35)**: background, card, popover, foreground, primary, secondary, muted, accent, destructive, border, input, ring, sidebar + chart colors. Exports CSS custom properties in HSL (shadcn convention).

### Branding

```typescript
import { createBrandingSpec } from '@rlabs-inc/theme-generator';

const spec = createBrandingSpec({
  neutralCount: 5,   // Number of neutral scale steps
});
```

**Roles (~8)**: brandPrimary, brandSecondary, brandAccent + neutral1-neutral5. Compositional palette for brand identity and design systems.

### Tailwind CSS

```typescript
import { createTailwindSpec } from '@rlabs-inc/theme-generator';

const spec = createTailwindSpec({
  families: ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error'],
});
```

**Roles (77)**: 7 color families x 11 shades each (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950). The 500-level is the anchor extracted from the color cloud; all other shades are derived via lightness adjustments. Neutral family is achromatic (c <= 0.03). Status families (success, warning, error) are hue-constrained.

## 8 Exporters

Exporters transform a `ThemePalette` into the exact config format each target expects.

```typescript
import {
  exportWarp,      // YAML
  exportGhostty,   // Key=value config
  exportWezTerm,   // TOML color scheme
  exportVSCode,    // JSON with ~200 UI keys + tokenColors + semanticTokenColors
  exportZed,       // JSON (Zed theme schema v0.2.0)
  exportVim,       // VimScript (.vim)
  exportNvim,      // Lua (.lua) with TreeSitter + terminal colors
  exportHelix,     // TOML with UI + syntax scopes
} from '@rlabs-inc/theme-generator';

// All exporters follow the same signature
const output = exportGhostty(palette, {
  name: 'Sacred Flower',
  author: 'Your Name',
});
// => string (ready to write to file)
```

### Exporter Output Examples

**Ghostty** — Drop into `~/.config/ghostty/themes/`:
```
palette = 0=#1a1a2e
palette = 1=#e94560
...
background=#1a1a2e
foreground=#e0e0e0
cursor-color=#c084fc
```

**VSCode** — Save as `.json` in `~/.vscode/extensions/`:
```json
{
  "name": "Sacred Flower",
  "type": "dark",
  "colors": {
    "editor.background": "#1a1a2e",
    "editor.foreground": "#e0e0e0",
    ...
  },
  "tokenColors": [
    { "scope": "keyword", "settings": { "foreground": "#c084fc" } },
    ...
  ]
}
```

**Neovim** — Drop into `~/.config/nvim/colors/`:
```lua
local M = {}
function M.setup()
  vim.cmd('hi clear')
  vim.o.background = 'dark'
  vim.g.colors_name = 'sacred-flower'
  vim.api.nvim_set_hl(0, 'Normal', { fg = '#e0e0e0', bg = '#1a1a2e' })
  vim.api.nvim_set_hl(0, '@keyword', { fg = '#c084fc' })
  vim.g.terminal_color_0 = '#1a1a2e'
  ...
end
return M
```

## How Extraction Works

The extraction engine uses a 5-phase constraint satisfaction algorithm:

1. **Lock** — Honor any pre-assigned colors (`options.locked`)
2. **Sort & Expand** — Order roles by priority (most constrained first); expand the color cloud if needed
3. **Assign** — Score each candidate color by centrality (40% weight, how close to the center of the constraint box) + diversity (60% weight, how different from already-assigned colors). Apply hue group snapping so related roles (e.g., all string-like syntax) share the same hue
4. **Enforce Contrast** — Adjust role colors via binary search on lightness to meet all contrast constraints. Comments get special dual-BG enforcement (must contrast against both editor background and gutter background)
5. **Derive & Uniformize** — Apply derived color transforms (blend, adjustLightness, withAlpha, ensureContrast, copy, withHexAlpha, adaptiveFg). Optionally apply iso-lightness normalization

### ANSI Constrained Mode

In **free** mode, ANSI colors are assigned mathematically — "red" might be blue if the math says so.

In **constrained** mode, each ANSI color is forced into its expected hue range (OKLCH-native):

| ANSI Color | Hue Range (OKLCH) |
|------------|-------------------|
| Red | 15-55 degrees |
| Yellow | 55-120 degrees |
| Green | 120-170 degrees |
| Cyan | 170-230 degrees |
| Blue | 230-280 degrees |
| Magenta | 280-15 degrees (wrapping) |
| Black/White | By lightness only |

This ensures your `git diff` reds are actually red, while still deriving the exact shade from the sacred geometry pattern.

### Contrast Guarantees

All specs enforce WCAG-aware contrast minimums:

- **Foreground vs Background**: 7.5:1 (WCAG AAA)
- **Syntax vs Background**: 5.5:1 (WCAG AA+)
- **ANSI vs Background**: 4.5:1 (WCAG AA)
- **Comments**: Clamped between 2.5-3.5:1 (readable but visually muted)

### Derived Color Transforms

Seven composable transforms for computed colors:

| Transform | Description |
|-----------|-------------|
| `blend` | Mix two colors in OKLCH space |
| `adjustLightness` | Shift lightness by delta |
| `withAlpha` | Set opacity (0-1) |
| `ensureContrast` | Binary search lightness to meet minimum contrast |
| `copy` | Duplicate another role's color |
| `withHexAlpha` | Append hex alpha suffix (e.g., `#ff6b3580`) |
| `adaptiveFg` | Smart foreground selection based on accent luminance |

## Advanced: Custom Specs

Build a spec from scratch for any target:

```typescript
import type { ThemeSpec, RoleDefinition, ContrastConstraint, DerivedDefinition } from '@rlabs-inc/theme-generator';
import { buildSyntaxRoles, buildAnsiRolesConstrained, buildDefaultConstraints } from '@rlabs-inc/theme-generator';

const mySpec: ThemeSpec = {
  name: 'my-target',
  ansiMode: 'constrained',
  roles: [
    // Define each role with dark/light constraints
    {
      name: 'bg1',
      priority: 100,
      dark:  { l: [0.05, 0.18], c: [0.00, 0.05] },
      light: { l: [0.92, 1.00], c: [0.00, 0.05] },
    },
    {
      name: 'fg1',
      priority: 90,
      dark:  { l: [0.85, 1.00], c: [0.00, 0.05] },
      light: { l: [0.05, 0.20], c: [0.00, 0.05] },
    },
    // Add syntax roles
    ...buildSyntaxRoles(),
    // Add ANSI roles
    ...buildAnsiRolesConstrained(),
  ],
  constraints: [
    // Cross-role contrast rules
    { role: 'fg1', against: 'bg1', min: 7.5 },
    ...buildDefaultConstraints('constrained', { contrastAnsi: 4.5 }),
  ],
  derived: [
    // Computed colors
    { name: 'selectionBg', transform: { type: 'blend', a: 'fg1', b: 'bg1', amount: 0.4 } },
    { name: 'cursorText', transform: { type: 'ensureContrast', source: 'bg1', against: 'cursor', min: 5.5 } },
  ],
};
```

## Constraints API

Lower-level functions for building constraint systems:

```typescript
import {
  satisfiesConstraints,
  projectIntoConstraints,
  enforceContrast,
  enforceCommentContrast,
  getActiveConstraints,
  ANSI_HUE_RANGES,
  UI_ROLES,
  STATUS_ROLES,
  SYNTAX_ROLE_NAMES,
} from '@rlabs-inc/theme-generator';

// Check if a color fits within constraints
satisfiesConstraints(color, { l: [0.3, 0.7], c: [0.1, 0.3] }); // boolean

// Project to nearest valid point
projectIntoConstraints(color, constraints); // OklchColor

// Binary search lightness for contrast target
enforceContrast(roleColor, bgColor, 5.5);           // min contrast
enforceContrast(roleColor, bgColor, 5.5, 8.0);     // min + max

// Special dual-BG enforcement for comments
enforceCommentContrast(commentColor, bg1, bg3, 'dark', { min: 2.5, max: 3.5 });

// Constants
ANSI_HUE_RANGES;    // { ansiRed: [15, 55], ansiGreen: [120, 170], ... }
UI_ROLES;           // ['bg1', 'bg2', 'bg3', 'fg1', 'fg2', 'fg3', 'ac1', 'ac2', 'border']
STATUS_ROLES;       // ['info', 'error', 'warning', 'success']
SYNTAX_ROLE_NAMES;  // 42 syntax role names
```

## Peer Dependencies

- [`@rlabs-inc/color-generator`](https://www.npmjs.com/package/@rlabs-inc/color-generator) — Provides color generation, manipulation, and conversion
- [`culori`](https://culorijs.org/) — Underlying color science library

## License

MIT

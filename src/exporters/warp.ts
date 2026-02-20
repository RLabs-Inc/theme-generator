import type { ThemePalette } from '../types.js';
import type { WarpExporterOptions } from '../types.js';

/**
 * Export a ThemePalette to Warp terminal YAML format.
 *
 * Maps palette roles:
 * - bg1      → background
 * - fg1      → foreground
 * - cursor   → cursor
 * - ac1      → accent (falls back to cursor if ac1 is absent)
 * - ansi*    → terminal_colors.normal.*
 * - ansiBright* → terminal_colors.bright.*
 *
 * @param palette - The resolved ThemePalette from extract()
 * @param options - Optional name, author, details override
 * @returns YAML string ready to save as a .yaml Warp theme file
 */
export function exportWarp(palette: ThemePalette, options?: WarpExporterOptions): string {
  const name    = options?.name    ?? palette.spec;
  const details = options?.details ?? (palette.mode === 'dark' ? 'darker' : 'lighter');

  // Convenience: hex value or fallback
  const h = (role: string, fallback = '#000000') => palette.hex(role) || fallback;

  // accent falls back to cursor if ac1 is absent (minimal-spec palettes)
  const accent = h('ac1', h('cursor'));

  return `name: '${name}'
accent: '${accent}'
cursor: '${h('cursor')}'
background: '${h('bg1')}'
foreground: '${h('fg1')}'
details: '${details}'
terminal_colors:
    bright:
        black: '${h('ansiBrightBlack')}'
        blue: '${h('ansiBrightBlue')}'
        cyan: '${h('ansiBrightCyan')}'
        green: '${h('ansiBrightGreen')}'
        magenta: '${h('ansiBrightMagenta')}'
        red: '${h('ansiBrightRed')}'
        white: '${h('ansiBrightWhite')}'
        yellow: '${h('ansiBrightYellow')}'
    normal:
        black: '${h('ansiBlack')}'
        blue: '${h('ansiBlue')}'
        cyan: '${h('ansiCyan')}'
        green: '${h('ansiGreen')}'
        magenta: '${h('ansiMagenta')}'
        red: '${h('ansiRed')}'
        white: '${h('ansiWhite')}'
        yellow: '${h('ansiYellow')}'
`;
}

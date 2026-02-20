import type { ThemePalette, ExporterOptions } from '../types.js';

/**
 * Export a ThemePalette to Ghostty terminal config format (key=value).
 *
 * Maps palette roles:
 * - bg1          → background
 * - fg1          → foreground
 * - cursor       → cursor-color
 * - selectionBg  → selection-background
 * - selectionFg  → selection-foreground (falls back to fg1)
 * - ansi[0-7]   → palette 0–7  (normal ANSI)
 * - ansiBright[0-7] → palette 8–15 (bright ANSI)
 *
 * @param palette - The resolved ThemePalette from extract()
 * @param options - Optional name, author (unused in Ghostty format but accepted for consistency)
 * @returns Config string ready to append to a Ghostty config file
 */
export function exportGhostty(palette: ThemePalette, _options?: ExporterOptions): string {
  const h = (role: string, fallback = '#000000') => palette.hex(role) || fallback;

  return `palette = 0=${h('ansiBlack')}
palette = 1=${h('ansiRed')}
palette = 2=${h('ansiGreen')}
palette = 3=${h('ansiYellow')}
palette = 4=${h('ansiBlue')}
palette = 5=${h('ansiMagenta')}
palette = 6=${h('ansiCyan')}
palette = 7=${h('ansiWhite')}
palette = 8=${h('ansiBrightBlack')}
palette = 9=${h('ansiBrightRed')}
palette = 10=${h('ansiBrightGreen')}
palette = 11=${h('ansiBrightYellow')}
palette = 12=${h('ansiBrightBlue')}
palette = 13=${h('ansiBrightMagenta')}
palette = 14=${h('ansiBrightCyan')}
palette = 15=${h('ansiBrightWhite')}
background = ${h('bg1')}
foreground = ${h('fg1')}
cursor-color = ${h('cursor')}
selection-background = ${h('selectionBg')}
selection-foreground = ${h('selectionFg', h('fg1'))}
`;
}

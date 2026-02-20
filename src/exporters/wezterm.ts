import type { ThemePalette, ExporterOptions } from '../types.js';

/**
 * Export a ThemePalette to WezTerm TOML color scheme format.
 *
 * Maps palette roles:
 * - bg1         → background
 * - fg1         → foreground
 * - cursor      → cursor_bg + cursor_border
 * - cursorText  → cursor_fg (text rendered inside block cursor; falls back to bg1)
 * - selectionBg → selection_bg
 * - selectionFg → selection_fg (falls back to fg1)
 * - ansi[0-7]  → ansi array (normal ANSI colors)
 * - ansiBright[0-7] → brights array (bright ANSI colors)
 *
 * @param palette - The resolved ThemePalette from extract()
 * @param options - Optional name and author for the [metadata] section
 * @returns TOML string ready to save as a WezTerm color scheme file
 */
export function exportWezTerm(palette: ThemePalette, options?: ExporterOptions): string {
  const name = options?.name ?? palette.spec;
  const h = (role: string, fallback = '#000000') => palette.hex(role) || fallback;

  const ansi = [
    h('ansiBlack'), h('ansiRed'),    h('ansiGreen'),   h('ansiYellow'),
    h('ansiBlue'),  h('ansiMagenta'), h('ansiCyan'),   h('ansiWhite'),
  ];
  const brights = [
    h('ansiBrightBlack'), h('ansiBrightRed'),     h('ansiBrightGreen'),   h('ansiBrightYellow'),
    h('ansiBrightBlue'),  h('ansiBrightMagenta'), h('ansiBrightCyan'),    h('ansiBrightWhite'),
  ];

  return `[colors]
ansi = [
    "${ansi[0]}",
    "${ansi[1]}",
    "${ansi[2]}",
    "${ansi[3]}",
    "${ansi[4]}",
    "${ansi[5]}",
    "${ansi[6]}",
    "${ansi[7]}",
]
background = "${h('bg1')}"
brights = [
    "${brights[0]}",
    "${brights[1]}",
    "${brights[2]}",
    "${brights[3]}",
    "${brights[4]}",
    "${brights[5]}",
    "${brights[6]}",
    "${brights[7]}",
]
cursor_bg = "${h('cursor')}"
cursor_border = "${h('cursor')}"
cursor_fg = "${h('cursorText', h('bg1'))}"
foreground = "${h('fg1')}"
selection_bg = "${h('selectionBg')}"
selection_fg = "${h('selectionFg', h('fg1'))}"

[metadata]
name = "${name}"
`;
}

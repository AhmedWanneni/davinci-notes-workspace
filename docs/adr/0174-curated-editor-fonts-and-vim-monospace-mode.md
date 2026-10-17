# ADR-0174: Expanded Curated Editor Fonts and Vim Monospace Mode

## Status

Accepted

## Context

Users require an expanded curated selection of high-quality editor typefaces covering Sans (Inter, IBM Plex Sans), Serif (Literata, Source Serif 4), Monospace (JetBrains Mono), and Display (Montserrat, Raleway), alongside the system default and custom local font inputs. Furthermore, proportional fonts cause character glyph widths to vary, which causes the Vim normal-mode block cursor to expand and contract across characters (such as "w", "i", "m", and whitespace). To ensure consistent cursor metrics in Vim mode, a dedicated setting "Use monospace font in vim mode" is introduced.

## Decision

1. **Curated Font Roster & Latin-only WOFF2 Assets**:
   - `system`: System UI default stack (`var(--font-ui)`), 0 KB.
   - `inter`: `@fontsource-variable/inter` (Latin normal: 48,256 B, italic: 51,832 B, total: 97.7 KB).
   - `ibm-plex-sans`: `@fontsource/ibm-plex-sans` (Latin weights 400, 500, 600, 700 normal and italic, 8 files, total: 195.6 KB).
   - `literata`: `@fontsource-variable/literata` (Latin normal: 52,496 B, italic: 53,728 B, total: 103.7 KB).
   - `source-serif-4`: `@fontsource-variable/source-serif-4` (Latin normal: 50,936 B, italic: 51,576 B, total: 100.1 KB).
   - `jetbrains-mono`: `@fontsource-variable/jetbrains-mono` (Latin normal: 40,404 B, italic: 42,964 B, total: 81.4 KB).
   - `montserrat`: `@fontsource-variable/montserrat` (Latin normal: 37,956 B, italic: 39,632 B, total: 75.8 KB).
   - `raleway`: `@fontsource-variable/raleway` (Latin normal: 48,264 B, italic: 50,244 B, total: 96.2 KB).
   - `custom`: User-provided locally installed font, validated and sanitized against CSS injection.
   - All web fonts are strictly self-hosted; 0 runtime calls to external CDNs (`fonts.googleapis.com`).
   - Web font chunks are imported dynamically on selection only, preserving 0 KB initial bundle overhead at app startup.

2. **Font Fallback Stacks & Swap Policy**:
   - Sans: `'Inter Variable', var(--font-ui)` / `'IBM Plex Sans', var(--font-ui)`.
   - Serif: `'Literata Variable', Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif`.
   - Monospace: `'JetBrains Mono Variable', ui-monospace, "SF Mono", Menlo, Consolas, Monaco, monospace`.
   - Display: `'Montserrat Variable', var(--font-ui)` / `'Raleway Variable', var(--font-ui)`.
   - All `@font-face` definitions use `font-display: swap`.

3. **Vim Monospace Mode**:
   - Introduces setting `vimMonospaceMode` (boolean, default: `true`).
   - When `useVimMode && vimMonospaceMode` is active, the effective font applied to the editor root is overridden with `jetbrains-mono`.
   - When Vim mode is toggled off or `vimMonospaceMode` is disabled, the editor smoothly reverts to the user's selected `editorFont`.
   - Applied live via `--font-editor` and `--editor-font-family` CSS variables on the editor root without rebuilding CodeMirror extensions or reloading the editor.
   - Dispatches `view.requestMeasure()` after `document.fonts.load(...)` settles to guarantee precise cursor coordinates and selection geometry.

## Consequences

- Full offline functionality maintained across all curated typography choices.
- Total asset weight across all 7 curated fonts: 750.5 KB (16 WOFF2 files), split into lazy chunks loaded solely upon user selection.
- Uniform Vim block cursor width guaranteed across glyphs without compromising typography preferences in standard editor mode.

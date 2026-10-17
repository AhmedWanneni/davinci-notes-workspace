# ADR-0173: Curated Editor Fonts and Custom Font Input Sanitization

## Status

Accepted

## Decision

Editor font options expand from the initial baseline to a curated set and an
opt-in custom system font option, preserving the offline-first, local-first
principles defined in ADR-0160:

1. **Curated font selection**:
   - `system`: System UI default stack (`var(--font-ui)`), 0 KB assets.
   - `serif`: Curated local serif stack (`Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif`), 0 KB assets.
   - `monospace`: Curated local monospace stack (`"JetBrains Mono", "Fira Code", Menlo, Consolas, Monaco, monospace`), 0 KB assets.
   - `montserrat`: Self-hosted `@fontsource-variable/montserrat` (5.2.8), Latin normal (37,956 bytes) and italic (39,632 bytes) WOFF2 files.
   - `raleway`: Self-hosted `@fontsource-variable/raleway` (5.2.8), Latin normal (48,264 bytes) and italic (50,244 bytes) WOFF2 files.
   - `custom`: System-installed font name entered by the user.

2. **Self-hosted and offline delivery**:
   - No Google Fonts CDN or remote endpoints are contacted.
   - `@font-face` definitions use `font-display: swap` so text renders immediately with fallback stacks.
   - Web font chunks load lazily on selection only via dynamic CSS imports; initial application startup bundle contains 0 bytes of font files.

3. **Custom font input validation and CSS injection prevention**:
   - Custom font names are capped at 50 characters and strictly validated with `/^[a-zA-Z0-9\s\-',.]+$/`.
   - Disallowed characters (`;`, `{`, `}`, `<`, `>`, `"`, `\`) reject the input and safely fall back to `var(--font-ui)`.
   - Valid inputs are wrapped in quotes and escaped (`"\"" + escaped + "\", var(--font-ui)"`) before CSS property application.

4. **Live re-measurement**:
   - Settings are applied via CSS variables (`--editor-font-size`, `--editor-font-family`) on the editor container, avoiding theme or extension rebuilds.
   - CodeMirror re-measures (`view.requestMeasure()`) after `document.fonts.load(...)` settles or font size changes.

## Consequences

- Full offline operation is preserved across all font choices.
- Zero new runtime or npm dependencies added.
- Custom fonts cannot break out of CSS styling declarations or execute script.

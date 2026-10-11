# Design tokens

Source token values live in `src/*.json`; `build.js` generates the committed
CSS, SCSS, and TypeScript outputs in `dist/`.

## Editor Obsidian-parity set

`src/editor.json` contains an `editor.obsidian` namespace for the editor values
approved from `docs/editor-style-audit.md`. These compile to
`--editor-obsidian-*` custom properties. It is deliberately separate from the
existing `editor.*` tokens: those values are already public and differ in
several places (notably heading metrics, body line height, and horizontal
content padding). Keep both sets until a later phase explicitly chooses which
consumer should use each set; this token-only phase does not redefine existing
tokens.

The body-size baseline uses `1rem`; heading and list measurements use `em` so
they scale relative to the editor font size. Paragraph spacing is mode-qualified
because the audit distinguishes Live Preview (`1rem`) from source mode (`0`).
The 700px readable-width reference is represented as `43.75rem` at a 16px root
size. Dark editor marker/link/tag colors live in this editor namespace and do
not replace the current shared color tokens.

Heading vertical spacing remains represented by the existing
`editor.heading.h1.space-above` through `editor.heading.h6.space-above`, and
their `space-below` counterparts. The audit did not approve replacement values
for those per-level values, so this set leaves them unchanged rather than
infer new Obsidian values.

| Token | Value | Unit / type |
|---|---:|---|
| `--editor-obsidian-body-font-size` | `1rem` | rem |
| `--editor-obsidian-body-line-height` | `1.5` | unitless |
| `--editor-obsidian-content-max-width` | `43.75rem` | rem |
| `--editor-obsidian-content-line-padding-inline` | `0` | unitless |
| `--editor-obsidian-heading-h1-size` | `1.618em` | em |
| `--editor-obsidian-heading-h1-weight` | `700` | unitless |
| `--editor-obsidian-heading-h1-line-height` | `1.2` | unitless |
| `--editor-obsidian-heading-h2-size` | `1.462em` | em |
| `--editor-obsidian-heading-h2-weight` | `680` | unitless |
| `--editor-obsidian-heading-h2-line-height` | `1.2` | unitless |
| `--editor-obsidian-heading-h3-size` | `1.318em` | em |
| `--editor-obsidian-heading-h3-weight` | `660` | unitless |
| `--editor-obsidian-heading-h3-line-height` | `1.3` | unitless |
| `--editor-obsidian-heading-h4-size` | `1.188em` | em |
| `--editor-obsidian-heading-h4-weight` | `640` | unitless |
| `--editor-obsidian-heading-h4-line-height` | `1.4` | unitless |
| `--editor-obsidian-heading-h5-size` | `1.076em` | em |
| `--editor-obsidian-heading-h5-weight` | `620` | unitless |
| `--editor-obsidian-heading-h5-line-height` | `1.5` | unitless |
| `--editor-obsidian-heading-h6-size` | `1em` | em |
| `--editor-obsidian-heading-h6-weight` | `600` | unitless |
| `--editor-obsidian-heading-h6-line-height` | `1.5` | unitless |
| `--editor-obsidian-spacing-paragraph-live-preview` | `1rem` | rem |
| `--editor-obsidian-spacing-paragraph-source-mode` | `0` | unitless |
| `--editor-obsidian-spacing-list` | `0.075em` | em |
| `--editor-obsidian-color-markdown-marker` | `#666666` | color |
| `--editor-obsidian-color-link` | `hsl(255 89.76% 75.9%)` | color |
| `--editor-obsidian-color-tag` | `var(--editor-obsidian-color-link)` | color alias |
| `--editor-obsidian-color-tag-background` | `color-mix(in oklch, var(--editor-obsidian-color-tag) 10%, transparent)` | color |
| `--editor-obsidian-color-tag-background-mobile` | `color-mix(in oklch, var(--editor-obsidian-color-tag) 20%, transparent)` | color |

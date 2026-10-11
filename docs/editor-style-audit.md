# Editor styling audit: Obsidian comparison

**Scope:** documentation-only comparison of the supplied Obsidian CodeMirror
CSS references with `packages/editor` styling. No editor, theme, or token
implementation was changed. The Obsidian references were queried by selector
and variable name; they were not imported or copied.

## Comparison

| Property | Obsidian value in supplied CSS | Our current value | File:line | Proposed change |
|---|---|---|---|---|
| Heading H1 size / weight / line height | `1.618em` / `700` / `1.2` (about `25.9px` at 16px body size). | `2rem` / bold (`700`) / `1.2` (32px at a 16px root size). The size uses the root `rem`, not the editor's configurable font size. | [editorHighlightStyle.ts:6-13](../packages/editor/editorHighlightStyle.ts#L6-L13); [type.json:7-24](../packages/design-system/tokens/src/type.json#L7-L24) | If visual parity is intended, use the editor heading token with an `em`-relative `1.618` size, weight `700`, and line height `1.2`. Confirm heading sizing should scale with the editor font setting. |
| Heading H2 size / weight / line height | `1.462em` / `680` / `1.2` (about `23.4px`). | `1.5rem` / semibold (`600`) / `1.2` (24px at a 16px root size). | [editorHighlightStyle.ts:14-20](../packages/editor/editorHighlightStyle.ts#L14-L20) | If parity is intended, set the editor heading token to `1.462em` / `680` / `1.2`; confirm use of the unusual `680` weight is desired for the selected font. |
| Heading H3 size / weight / line height | `1.318em` / `660` / `1.3` (about `21.1px`). | `1.25rem` / semibold (`600`) / `1.5` (20px at a 16px root size). | [editorHighlightStyle.ts:21-27](../packages/editor/editorHighlightStyle.ts#L21-L27) | If parity is intended, use `1.318em` / `660` / `1.3` in the editor heading tokens. |
| Heading H4 size / weight / line height | `1.188em` / `640` / `1.4` (about `19px`). | `1rem` / semibold (`600`) / `1.5` (16px at a 16px root size). | [editorHighlightStyle.ts:28-34](../packages/editor/editorHighlightStyle.ts#L28-L34) | If parity is intended, use `1.188em` / `640` / `1.4` in the editor heading tokens. |
| Heading H5 size / weight / line height | `1.076em` / `620` / `1.5` (about `17.2px`). | `1rem` / medium (`500`) / `1.5` (16px at a 16px root size). | [editorHighlightStyle.ts:35-41](../packages/editor/editorHighlightStyle.ts#L35-L41) | If parity is intended, use `1.076em` / `620` / `1.5` in the editor heading tokens. |
| Heading H6 size / weight / line height | `1em` / `600` / `1.5` (16px). Heading color inherits normal text. | `1rem` / medium (`500`) / `1.5`; H6 is additionally muted rather than inheriting normal text. | [editorHighlightStyle.ts:42-48](../packages/editor/editorHighlightStyle.ts#L42-L48) | Confirm whether H6 should inherit normal text and use weight `600`; retain the current muted hierarchy only if intentional. |
| Body font size and line height | Text size defaults to `16px`; editor scroller line height is `1.5`. | Editable editor uses `var(--editor-font-size)` (settings default `16`) and `var(--type-leading-relaxed)` (`1.75`). Read-only editor instead uses `var(--type-scale-sm)` (`0.875rem`, 14px at a 16px root) and literal `1.5`. | [editorTheme.ts:4-13](../packages/editor/editorTheme.ts#L4-L13), [editorTheme.ts:149-166](../packages/editor/editorTheme.ts#L149-L166); [editorSettings.ts:22-27](../packages/editor/editorSettings.ts#L22-L27); [type.json:7-24](../packages/design-system/tokens/src/type.json#L7-L24) | Decide whether readable `MarkdownView` intentionally uses smaller text. For editor parity, default both paths to 16px and line height `1.5`; preserve user-selected editor sizes if that is the product contract. |
| Content max width | `700px` when Obsidian's readable-line-width mode is enabled; the reference does not make this a universal editor width. | No max width is set on `.cm-content`; it fills the available width. Horizontal inset is `var(--space-8)` (32px at the current scale). | [editorTheme.ts:21-26](../packages/editor/editorTheme.ts#L21-L26); [Editor.module.scss:1-14](../packages/editor/Editor.module.scss#L1-L14); [cm-rules.css:109-121](references/cm-rules.css#L109-L121); [cm-variables.css:59-59](references/cm-variables.css#L59) | Product decision: add an optional readable-width setting capped at 700px only if the app wants Obsidian's optional mode. Avoid imposing 700px on every viewport without approval. |
| Content and line padding | Obsidian `.cm-content` and `.cm-line` use `padding: 0`; readable width centers the content. | `.cm-content` has `var(--space-6)` top, `var(--space-8)` horizontal, and hardcoded `30vh` bottom padding. No explicit line padding is set in the audited theme. | [editorTheme.ts:21-26](../packages/editor/editorTheme.ts#L21-L26); [cm-rules.css:165-180](references/cm-rules.css#L165-L180), [cm-rules.css:516-519](references/cm-rules.css#L516-L519) | Keep the app's deliberate editor gutters if desired; route bottom padding through the existing editor token. Decide separately whether horizontal padding should shrink toward Obsidian's zero line/content padding. |
| Paragraph and list spacing | Base variables are paragraph `1rem` and list `0.075em`; non-live-preview source view overrides paragraph spacing to `0`, and the supplied CodeMirror rules zero direct child margins and line padding. Live Preview uses the base paragraph setting. | No explicit paragraph or list spacing rule is present in the audited theme. CodeMirror lines use the editor's `1.75` line height. Heading lines additionally receive tokenized top/bottom padding in `markdownAnnotationTheme`. | [editorTheme.ts:4-13](../packages/editor/editorTheme.ts#L4-L13); [markdownAnnotationTheme.ts:8-36](../packages/editor/markdownAnnotationTheme.ts#L8-L36); [cm-rules.css:76-87](references/cm-rules.css#L76-L87), [cm-rules.css:177-180](references/cm-rules.css#L177-L180); [cm-variables.css:198-205](references/cm-variables.css#L198-L205), [cm-variables.css:250-251](references/cm-variables.css#L250-L251) | Clarify whether the target is Obsidian source mode or Live Preview before changing spacing. If matching Live Preview, consider explicit editor-local paragraph/list spacing tokens; do not infer spacing from line height alone. |
| Markdown markers in Live Preview | Formatting/header/quote delimiters are hidden away from the active line; active syntax remains editable. | `cm-markdown-syntax` is `display:none !important`; active-line syntax is shown at opacity `0.5`. The live-preview plugin marks emphasis, strike/highlight, heading/link/quote marks, code delimiters/info, escapes, and horizontal rules. Link decorations also hide link syntax. List widgets replace markers off the active line; ordered numerals remain widget-rendered on the active line, while unordered/task markers remain raw. | [editorTheme.ts:126-132](../packages/editor/editorTheme.ts#L126-L132); [livePreviewExtension.ts:11-53](../packages/editor/livePreviewExtension.ts#L11-L53); [listExtension.ts:83-125](../packages/editor/listExtension.ts#L83-L125); [linkExtension.ts:97-162](../packages/editor/linkExtension.ts#L97-L162) | No parity change recommended from these references. Preserve the existing active-line exceptions unless a distinct editing behavior is approved; they are intentional per ADR-0069. |
| Code blocks and inline code | Inline code uses the monospace stack, `0.875em` size, normal text color, alternate background, `4px` radius, and `0.15em 0.3em` padding; border width is `0`. Code blocks use the same monospace family and smaller size with code background. | Inline `t.monospace` uses `var(--font-editor)`, accent text, secondary background, a thin border, small radius, and `0 var(--space-1)` padding; no code-specific font size is set. The token family can be user-configured and the default editor font setting is `system`, so monospace is not guaranteed. Code-block lines get secondary background and vertical padding from the annotation theme; long lines do not wrap. | [editorHighlightStyle.ts:59-66](../packages/editor/editorHighlightStyle.ts#L59-L66); [markdownAnnotationTheme.ts:33-36](../packages/editor/markdownAnnotationTheme.ts#L33-L36); [codeBlockLayoutTheme.ts:3-9](../packages/editor/codeBlockLayoutTheme.ts#L3-L9); [editorSettings.ts:22-27](../packages/editor/editorSettings.ts#L22-L27); [cm-variables.css:33-45](references/cm-variables.css#L33-L45), [cm-variables.css:77-77](references/cm-variables.css#L77); [cm-rules.css:1323-1353](references/cm-rules.css#L1323-L1353), [cm-rules.css:1459-1476](references/cm-rules.css#L1459-L1476), [cm-rules.css:3308-3318](references/cm-rules.css#L3308-L3318) | Decide whether code should remain accent-colored and bordered, or follow Obsidian's normal-text, monospace, no-border treatment. If matching, give code a dedicated monospace token/family independent of the configurable prose font, and tokenise the size/padding/background. |
| Link color (dark theme) | `--link-color` and external link color resolve to `--text-accent`; in the supplied dark theme this resolves to `--color-accent-1`, `hsl(255, 89.76%, 75.9%)` with the supplied default accent inputs. | Markdown links and wikilinks use `var(--color-text-accent)`, as do external links; actual runtime color depends on the loaded app theme. The design-system source default currently resolves to `#7f6df2`. | [editorTheme.ts:38-65](../packages/editor/editorTheme.ts#L38-L65); [color.json:16-24](../packages/design-system/tokens/src/color.json#L16-L24); [cm-variables.css:182-197](references/cm-variables.css#L182-L197), [cm-variables.css:364-393](references/cm-variables.css#L364-L393); [cm-rules.css:3111-3146](references/cm-rules.css#L3111-L3146) | Keep semantic link color token-based. Confirm whether dark themes should map the token to Obsidian's accent-derived color; the provided source uses an HSL-derived accent, not the static default token hex. |
| Tag color (dark theme) | Markdown hashtags use `--tag-color: var(--text-accent)` (`hsl(255, 89.76%, 75.9%)` with the supplied default dark accent inputs) on a low-opacity accent mix (`10%` in the base tag variable; the supplied mobile dark override is `20%`). | The app replaces matched tags with `.cm-tag` badges colored `var(--color-text-accent)` on `var(--color-bg-secondary)`, with a subtle border. This is an opaque secondary surface rather than Obsidian's transparent accent mix. | [tagTheme.ts:3-19](../packages/editor/tagTheme.ts#L3-L19); [tagExtension.ts:42-46](../packages/editor/tagExtension.ts#L42-L46); [cm-variables.css:307-321](references/cm-variables.css#L307-L321), [cm-variables.css:364-404](references/cm-variables.css#L364-L404); [cm-rules.css:3679-3709](references/cm-rules.css#L3679-L3709) | Confirm whether the app's tag badge is intentionally distinct. If parity is desired, use semantic tag foreground/background tokens with a dark-theme accent mix; preserve the badge-vs-inline presentation decision separately. |

### Tag presentation decision

Obsidian's Markdown tag is styled as an inline hashtag. `@app/editor` deliberately
replaces matched tags with badge widgets and uses first-seen casing (ADR-0077).
The color comparison above is therefore about foreground/background semantics,
not a recommendation to remove the app's badge treatment.

## Token boundary recommendations

- **Design-system tokens:** semantic text/link/tag/code colors; shared type
  scales and weights; border, radius, and spacing primitives; values that need
  to remain consistent across desktop and mobile. The editor-specific token
  group already exists in `packages/design-system/tokens/src/editor.json`,
  including heading metrics, content padding, and bottom padding. Prefer
  consuming those tokens instead of duplicating their values in editor styles.
- **Editor-local tokens/settings:** optional readable line width; paragraph,
  list, and heading spacing if they are editor-only; active Markdown marker
  opacity; code-specific typography; user-selected editor font and size. Keep
  user preferences/settings distinct from theme tokens.
- **Behavior rather than a token:** which syntax is hidden/revealed, the active
  line exceptions, list widget replacement, and cursor/editability rules. These
  are rendering policy, not design-system values.

The editor token source currently has values that do not match the supplied
Obsidian snapshot, and the audited `editorTheme.ts` / `editorHighlightStyle.ts`
do not consume most of those editor-specific metrics. Aligning token values and
switching their consumers would be an implementation decision, not an automatic
consequence of this audit.

## Hardcoded values and design-system bypasses

- `editorTheme.ts:25` hardcodes `30vh` even though
  `editor.json` defines `editor.content-padding-bottom` as a token.
- `editorTheme.ts:29` hardcodes a `2px` cursor width.
- `editorTheme.ts:131` hardcodes active syntax opacity `0.5`; this is plausibly
  editor-local behavior rather than a cross-product token.
- `editorTheme.ts:156` hardcodes read-only line height `1.5`, duplicating
  `--type-leading-normal`.
- `editorSettings.ts:24` sets default editor font size to numeric `16`. This is
  an intentional user-setting default under ADR-0065/ADR-0160, not necessarily
  a token bypass.
- `editorHighlightStyle.ts` mostly consumes global type/color tokens rather
  than the populated `editor.heading.*` tokens. Its `rem` sizes also do not
  follow the configurable editor font size.
- `Editor.module.scss` contains no raw color or pixel dimension; it only
  establishes the editor wrapper's flex layout.

## CUBE CSS note: `Editor.module.scss`

`Editor.module.scss` is a CSS Module rather than a CUBE-organized global
desktop block stylesheet. Its `.editor-container` root uses kebab-case and is
limited to wrapper/layout mechanics; `&:global(.cm-editor)` targets CodeMirror's
external class. ADR-0038 explicitly scopes the CUBE migration to
`apps/desktop`-local styling, while `@app/editor` is a shared package (ADR-0027).
So this is a **scope ambiguity**, not an unambiguous violation under the ADR as
written. Flag for maintainers: decide whether the desktop CUBE prohibition also
applies to styles owned by shared packages; no style changes were made.

## Assumptions and decisions to confirm

1. The supplied CSS files are the comparison authority; their declarations
   include both light and dark theme rules and duplicate heading-weight
   assignments. The heading weights above use the final root declarations
   (`700`, `680`, `660`, `640`, `620`, `600`).
2. Obsidian line width is conditional on readable-line-width mode, not an
   always-on 700px constraint.
3. The requested color comparison targets Obsidian dark theme. Its accent is
   computed from the supplied HSL variables; the app's resolved current color
   may vary with the loaded theme. The checked design-system token source has
   a static `#7f6df2` text-accent default.
4. **Decision needed:** should the target be Obsidian's Live Preview values or
   its non-live-preview source-mode values for paragraph spacing?
5. **Decision needed:** should heading/code/tag treatment intentionally
   diverge from Obsidian for the app's visual identity, or should the existing
   editor tokens be tuned for closer parity?
6. **Decision needed:** does the CUBE CSS rule apply to shared-package
   component styles as well as `apps/desktop`-local styles?

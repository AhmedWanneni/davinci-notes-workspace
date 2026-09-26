# Public-token default-style diff

Baseline: `1ad9064` (`chore: baseline documented stylelint exceptions`), the
commit immediately before the public-token reconciliation began. Comparison:
the default generated theme with the magenta development override disabled.
The audit resolves the baseline fallback/alias chain and the current public
token chain for one representative element in every checklist surface.

## Expected: fallback/inert -> public token

| Surface | Representative | Baseline path -> current path |
| --- | --- | --- |
| Settings | `.settings-search-input` | undocumented large-radius alias -> public border-radius role |
| Search | `.search-dialog__dialog` | inert text/border aliases -> normal public text/border |
| Tags | `.tags-dialog__dialog` | inert text/type aliases -> public text/type roles |
| Command Palette | `.command-palette__dialog` | existing public surface/radius roles retained |
| Canvas | `.canvas-export-overlay` and card controls | fallback/inert aliases -> scrim, surface, border, and accent roles |
| Graph | graph node/edge styles | fallback edge colors -> public border, status, and accent roles |
| Editor | `.cm-editor` and syntax headings | editor aliases/fallbacks -> public typography, surface, text, and accent roles |
| File tree | `.file-tree` rows and emoji picker | undocumented border alias -> public normal border |
| Tabs | tab row | existing public surface/text roles retained |
| Panels | empty state and side panels | fallback spacing/border aliases -> public roles |
| Status bar | `.status-bar` | undocumented border alias -> public normal border |
| Menus | dropdown/context menu | raw elevation color -> public shadow base with compatibility fallback |
| Modals | Dialog and Settings backdrop | raw backdrop color -> public scrim role |
| Scrollbars/focus | canvas scrollbar and focused inputs | existing public border/focus roles retained |

The status-tint and shadow additions in ADR-0164 are also default-equivalent:
the new status backgrounds/borders retain their previous 15%/30% alpha values,
and unsupported webviews retain the existing raw shadow layer.

## Regressions found and fixed

| Surface | Regression | Fix |
| --- | --- | --- |
| Editor | The vault-scoped font-size setting stopped affecting the CodeMirror root when the internal editor alias was removed. | Restored the runtime `--editor-font-size` setting. The guard explicitly treats it as a documented runtime setting, not a theme API token. |

After the fix, the default-theme audit has no remaining regressions. The
manual magenta override pass confirms that enabling and removing the
development-only sheet leaves no residual styling on these same surfaces.

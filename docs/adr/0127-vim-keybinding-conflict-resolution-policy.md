# ADR-0127: Vim keybinding conflict resolution policy

## Status
Accepted

## Context
Phase 3 of the Vim keybindings integration plan requires enumerating all custom keybindings and extensions in `@app/editor` and cross-referencing them against `@replit/codemirror-vim`'s keymaps to establish an explicit conflict resolution policy.

Existing keybindings in `@app/editor` include:
- `Shift-Enter`: `insertHardLineBreak` (inserts two trailing spaces + `\n`).
- `defaultKeymap`: Standard CodeMirror navigation, insertion, and selection keybindings.
- `historyKeymap`: `Mod-z` (undo) and `Mod-y` / `Mod-Shift-z` (redo).
- `listIndentKeymap`: `Tab` (indent list item) and `Shift-Tab` (dedent list item).
- `autocompleteExtension`: `[[` trigger regex for wikilink title autocompletion dropdown.
- Click handlers on `.cm-wikilink` / `.cm-link` elements for internal and external navigation.

## Keybinding Cross-Reference Findings
- **No Direct Keymap Collisions**: `@app/editor` defines no custom single-letter normal-mode keybindings (e.g. `i`, `a`, `o`, `d`, `y`, `p`, `w`, `b`).
- **Autocompletion Boundary (`[[`)**: `[[` triggers CodeMirror's autocompletion popup in Insert mode. In Normal mode, `[[` executes Vim's section motion. The two behaviors exist in disjoint modes without conflict.
- **Modifier Shortcuts (`Mod-z`, `Mod-f`, `Mod-k`)**: OS/app modifier shortcuts (`Mod` / `Cmd`) pass through CodeMirror's event handling and remain fully operational alongside Vim mode.
- **List Indentation (`Tab` / `Shift-Tab` vs `>>` / `<<`)**: `Tab` and `Shift-Tab` operate in Insert mode for list indentation, while `>>` and `<<` operate in Normal mode.

## Conflict Resolution Policy
When Vim mode is explicitly enabled:
1. **Normal & Visual Modes**: `@replit/codemirror-vim` keymap takes precedence for un-modified navigation, text objects, and modal editing operations (`hjkl`, `w`, `b`, `dd`, `yy`, `p`, etc.).
2. **App & OS Shortcuts**: Modifier-gated shortcuts (`Cmd-z`, `Cmd-f`, `Cmd-k`) retain higher precedence or pass through unchanged.
3. **Insert Mode**: Standard text input, `[[` wikilink autocompletion, `Shift-Enter` hard line breaks, and `Tab`/`Shift-Tab` list indentation execute normally.

## Consequences
- No keymap modifications or key unmapping were required in `@app/editor`.
- Full compatibility guaranteed between modal editing, live-preview decorations, and wikilink autocompletion.

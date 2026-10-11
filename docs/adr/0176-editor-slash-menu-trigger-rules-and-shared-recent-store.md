# ADR-0176: Editor Slash Menu Trigger Rules and Shared Recent Store

## Status

Accepted

## Context

The editor needs an inline `/` slash menu autocompletion source that connects to the insert registry while avoiding false triggers during normal writing, code editing, mathematical notation, frontmatter, URLs, paths, and IME composition. In addition, Vim modal editing must preserve normal and visual search, Command Palette commands must insert at the current cursor without losing focus, and recent items must stay coherent across entry points.

## Decision

- Trigger `/` autocompletion only when enabled in settings and positioned at a line start or immediately following whitespace.
- Exclude triggers inside fenced code blocks, inline code, and Markdown links/URLs using CodeMirror `syntaxTree` node hierarchy inspection.
- Exclude triggers inside YAML frontmatter via bounded top-of-document line scanning rather than whole-document regular expressions.
- Exclude triggers inside block and inline math via `mathBlocksField` state field inspection and single-line delimiter scanning.
- Suppress autocompletion during active IME composition via `view.composing`.
- Preserve Vim mode semantics: `/` in Normal and Visual mode remains dedicated to Vim search; slash menu suggestions trigger only in Insert and Replace modes.
- Expose `Insert: <label>` commands in the Command Palette backed by `insertRegistry`. Commands insert at the captured editor selection, are hidden or no-op when no editable editor is focused or the view is read-only, and closing the palette restores editor focus without losing selection.
- Consolidate recently used insert items into a single shared in-memory MRU store (`recentInsertStore`) consumed by the header `...` popover menu, the slash autocomplete menu, and the Command Palette.

## Consequences

- Slash suggestions never corrupt code blocks, math environments, frontmatter, URLs, paths, or IME input.
- Vim modal keybindings remain completely unintercepted for search commands.
- Insertion templates and recent item ordering remain consistent regardless of whether the user triggers the action via the header button, slash command, or Command Palette.

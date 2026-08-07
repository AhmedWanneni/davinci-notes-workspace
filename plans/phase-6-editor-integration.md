# Implementation Plan — Phase 6: Editor Integration

This plan integrates CodeMirror 6 as the core markdown editor, implementing live-preview decorations, wikilink styling and autocomplete, debounced saving and reindexing, and multi-note tab state management.

## User Review Required

> [!IMPORTANT]
> The editor is implemented as a shared workspace package (`@app/editor`) under `packages/editor`. This makes the editor reusable for the mobile app later, in accordance with the `mobile-app-stack-architecture.md` guidelines.

> [!NOTE]
> Live-preview markdown syntax hiding will be implemented using a combination of a custom CodeMirror extension (`livePreview.ts`) and CSS. The extension will mark markdown syntax delimiters (like `**` for bold, `#` for headers, `[[` and `]]` for wikilinks) with a special class `.cm-markdown-syntax`. A global stylesheet will hide these characters by default, but display them when the line containing them has the active selection cursor (indicated by CodeMirror's `.cm-activeLine` class). This is extremely performant and avoids messing with editor offsets.

## Open Questions

None at this time. The requirements are clearly specified in the prompt and architecture documents.

---

## Proposed Changes

### Shared Workspace Packages

#### [NEW] [package.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/package.json)

Create the package descriptor for the shared editor package, defining workspace dependencies and scripts.
Dependencies will include:

- `@codemirror/state`
- `@codemirror/view`
- `@codemirror/language`
- `@codemirror/commands`
- `@codemirror/autocomplete`
- `@codemirror/lang-markdown`
- `@lezer/markdown`
- `@lezer/common`

#### [NEW] [tsconfig.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/tsconfig.json)

Configure TypeScript compiler settings for the React + CodeMirror package.

#### [NEW] [index.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/index.ts)

A barrel file exporting the public surface of the `@app/editor` package.

#### [NEW] [Editor.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/Editor.tsx)

The main React component wrapping CodeMirror 6. Handles:

- Initializing the `EditorView` and mounting it to a container ref
- Updating editor state when `value` changes (only if it differs from current editor state, preventing cursor jumps)
- Exposing `onChange` callback
- Styling using design-system tokens (`--font-editor` for monospace edit mode, color tokens)

#### [NEW] [Editor.module.scss](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/Editor.module.scss)

Styling for the editor component, referencing the design system tokens.

#### [NEW] [livePreview.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/livePreview.ts)

A custom CodeMirror extension that parses the markdown syntax tree and applies a `.cm-markdown-syntax` mark decoration to delimiters:

- Header mark (e.g. `#`)
- Strong emphasis delimiter (e.g. `**`)
- Emphasis delimiter (e.g. `*` or `_`)
- Wikilink brackets (e.g. `[[` and `]]` and the `|` pipe separator)

#### [NEW] [wikilinks.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/wikilinkExtension.ts)

A custom CodeMirror extension that styles `[[wikilinks]]` distinctly (clickable, colored with `--color-text-accent`). It will:

- Use the wikilink parsing pattern from `@app/indexer/parseLinks` (avoiding custom regex re-implementation)
- Highlight unresolved link targets differently (e.g. dashed underline) by matching against the list of existing note paths
- Make links clickable (either Cmd/Ctrl + Click or a custom click handler) to trigger a `onLinkClick(targetRaw)` callback
- Render syntax brackets `[[` and `]]` with the `.cm-markdown-syntax` class so they are hidden on inactive lines

#### [NEW] [autocomplete.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/editor/autocompleteExtension.ts)

An autocomplete extension using `@codemirror/autocomplete`.

- Matches when typing `[[`
- Queries the suggestion provider with the partial text to filter existing note titles
- Inserts `[[Note Title]]` on selection

#### [MODIFY] [Link.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/core-types/Link.ts)

Add optional `start?: number` and `end?: number` to the `Link` interface to store the offset positions of parsed links.

#### [MODIFY] [parseLinks.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/packages/indexer/parseLinks.ts)

Export `WIKILINK_PATTERN` and include `start`/`end` positions in the parsed results, or add `parseLinksWithPositions` to support the editor.

#### [MODIFY] [tsconfig.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/tsconfig.json)

Add `@app/editor` path mapping to root config.

---

### Desktop App (`apps/desktop`)

#### [NEW] [useWorkspaceStore.ts](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/state/useWorkspaceStore.ts)

Zustand store managing:

- `activeNotePath: string | null`
- `openNotes: string[]` (tabs)
- `notesContent: Record<string, string>` (in-memory unsaved edits)
- `dirtyNotes: Set<string>` (modified notes waiting for save)
- `allNotePaths: string[]` (cached list of vault notes for autocomplete / link resolution)
- Actions:
  - `openNote(path: string)`: load note content from Rust IPC (`readNote`) and switch active note.
  - `closeNote(path: string)`: close tab.
  - `updateNoteContent(path: string, content: string)`: update in-memory buffer, mark dirty, trigger debounced save.
  - `saveNoteNow(path: string)`: immediate flush to disk via Rust IPC (`writeNote`), incremental index update, clear dirty.

#### [MODIFY] [package.json](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/package.json)

Add dependencies:

- `@app/editor`: `workspace:*`
- `zustand`: `^5.0.0`

#### [MODIFY] [App.tsx](file:///Users/ahmedwaanneni/Desktop/davinci-notes/apps/desktop/src/App.tsx)

Integrate the editor and basic tab switching UI:

- Tabs row at the top showing open notes, click to switch, 'x' to close.
- Debug picker or minimal note list to choose a note to open.
- The `Editor` component loaded with the active note's content.
- Ensure note-switch immediately flushes any unsaved edits of the previous note.

---

## Verification Plan

### Automated Tests

Run workspace checks to verify compiling and linting:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

### Manual Verification

1. **Load/Save & Debounce**:
   - Open a note, type continuously. Watch the app console / logs to verify it does NOT write to disk on every keystroke.
   - Stop typing, verify that after 750ms it writes to disk.
   - Type, then immediately switch tabs or click away. Verify it immediately saves to disk (no lost edits).
2. **Wikilink Rendering & Interactivity**:
   - Verify wikilinks render with accent color.
   - Verify unresolved wikilinks render with a dashed underline.
   - Command+click (or click) on a resolved link. Verify it navigates to that note.
   - Command+click (or click) on an unresolved link. Verify it creates a new empty note and opens it.
3. **Autocomplete**:
   - Type `[[` in a note. Verify a popup opens suggesting existing notes.
   - Select a note, verify it completes to `[[Note]]`.
4. **Performance**:
   - Profile typing latency on the large fixture vault (350 notes). Record typing lag/responsiveness in `PROGRESS.md`.

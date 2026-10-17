# ADR-0179: Note Embeds (![[Note]] and ![[Note#Heading]]) and Safety Guards

## Status

Accepted (extends ADR-0115)

## Context

ADR-0115 closed the Attachments plan and explicitly noted that note and non-image embeds were separated for subsequent specification:
> "The Attachments plan does not include audio/video/PDF/note rendering. Embed Files is a separate feature. Its Phase 1 resolution and Phase 2 image rendering are now implemented independently; later embed kinds remain separately scoped."

Users require Obsidian-style note embeds (`![[Note]]` and section embeds `![[Note#Heading]]`) inline within the editor without creating separate parsers, introducing security holes, crashing on circular references, or degrading typing latency.

## Decision

1. **Lightweight Read-Only Renderer Reusing CodeMirror 6**:
   - Note embeds render inline read-only blocks using the existing `createReadOnlyEmbedView` pipeline with `readOnlyEditorTheme`, markdown syntax highlighting, live preview, tables, math, and mermaid.
   - We deliberately chose a stripped-down read-only `EditorView` (without history, selection markers, active line highlighters, autocompletion, or keymaps) over an editable CodeMirror instance or a React root.
   - Memory cost: each read-only embed consumes ~35 KB of memory. 10 embeds on a page consume ~350 KB total, compared to ~10 MB for 10 editable CodeMirror instances.
   - Header row displays the note title (and heading breadcrumb); clicking the header opens the target note. Clicking embed content does not edit it.

2. **Safety Guards**:
   - **Cycle Prevention**: Ancestor note chains are tracked via `embedChain: readonly string[]`. When a target note is already present in the chain (`A -> A`, `A -> B -> A`, `A -> B -> C -> A`), recursion terminates immediately and renders a `.cm-note-embed-circular` ("Circular embed") placeholder.
   - **Depth Limit**: Capped at `MAX_EMBED_DEPTH = 3`. Embeds at depth 4 or deeper render as a plain clickable wikilink (`[[Note]]`).
   - **Size Limit**: Unbounded notes are never rendered inline. Embeds render at most `DEFAULT_EMBED_MAX_LINES = 25` lines by default, with an accessible "Show more (X more lines)" / "Show less" toggle button.
   - **Sandboxing**: Embedded content adheres to the same sandboxing rules as primary note views. Script execution and remote media loads follow the existing strict allowlists.

3. **Performance & Viewport Lazy Loading**:
   - Target note text is loaded lazily via `IntersectionObserver` with a `200px` root margin; notes outside the viewport display a lightweight loading placeholder without reading from disk.
   - Vault index/cache is reused for lookups; no file reads occur synchronously in the typing loop.
   - Target note mutations notify embeds via a debounced pub/sub bus (`noteEmbedUpdateEmitter`, 200 ms debounce).
   - Live updates modify only the child embed view; the host document and host editor decorations are completely untouched.

4. **"Note Embed" Insert Registry Item**:
   - Added "Note embed" to `insertRegistry` under a dedicated `"Links"` group.
   - The item automatically appears in the `"..."` menu, slash menu (`/`), and Command Palette.
   - Clicking opens `InsertNotePicker`, a small modal dialog built with design-system primitives that searches vault notes by title with keyboard navigation (ArrowUp/Down/Enter), followed by an optional heading selector.
   - Inserts standard `![[Note]]` or `![[Note#Heading]]` syntax with standard wikilink disambiguation (folder-qualified target for duplicate stems, bare stem for unique stems), single transaction, single undo, and block padding.

## Consequences

- Note embeds render smoothly and safely without recursing or hanging the UI.
- No new runtime dependencies were added.
- Non-note embeds (images, audio, video, PDF) continue to pass through to their existing handlers.

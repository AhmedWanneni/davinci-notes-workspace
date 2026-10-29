# Local-First Note App — Stack & Architecture

## Philosophy

- Plain markdown files on disk are the source of truth. No proprietary format, no lock-in.
- App is a *view* over a folder ("vault"), not a database owning the data.
- Works fully offline. Sync is the user's choice (iCloud/Dropbox/Syncthing), not baked into the core.
- Fast on large vaults (10k+ notes) — index, don't re-scan.

---

## Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Shell | **Tauri v2** | Rust + native webview. ~8MB bundle vs Electron's ~150MB, lower memory, faster startup. v2 supports desktop *and* mobile (iOS/Android) from one codebase. |
| Frontend | **React + TypeScript** | Matches existing skillset, huge ecosystem for the graph/editor UI pieces. |
| Editor core | **CodeMirror 6** | What Obsidian itself uses. Built for live-preview markdown via decorations — raw text stays the source, rendering is a layer on top. |
| File I/O | **Tauri `fs` plugin** + **`fs-watch` plugin** | Read/write vault files, react to external edits (sync clients, other editors). |
| Index / search | In-memory graph + **SQLite via `tauri-plugin-sql`** (FTS5) | In-memory for small vaults; SQLite FTS once vault size makes full re-scans slow. |
| Graph view | **d3-force** or **react-force-graph** | Force-directed layout over the link graph you already built for backlinks. |
| State management | **Zustand** | Lightweight, matches patterns you already use. |
| Styling | **SCSS / CSS modules** | Consistent with your existing frontend work. |
| Sync (optional, later) | **Yjs (CRDT)** or defer to filesystem sync (iCloud/Dropbox/Syncthing) | Don't build this for v1. |
| Plugin system (optional, later) | Sandboxed JS (iframe or QuickJS) + typed app API | Hardest subsystem — design after core is solid, not before. |

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│  React UI (editor, sidebar, graph, cmd-k) │
├─────────────────────────────────────────┤
│  App state (Zustand): open notes,        │
│  active vault, index cache                │
├─────────────────────────────────────────┤
│  Indexer: parses files → link graph,      │
│  frontmatter, tags, headings              │
├─────────────────────────────────────────┤
│  Tauri IPC bridge                         │
├─────────────────────────────────────────┤
│  Rust: fs read/write, file watcher,       │
│  SQLite (FTS), OS integration             │
└─────────────────────────────────────────┘
```

The indexer is the load-bearing piece. Everything — backlinks, graph view, search, tag pane — reads from it. Get the data model right before touching UI.

---

## Data Model

### Vault
A vault is a directory. No special marker file required for v1 (Obsidian uses `.obsidian/` for config — copy that pattern later if you want per-vault settings).

### Note
```ts
interface Note {
  path: string;          // relative to vault root
  title: string;          // filename without extension, or frontmatter override
  frontmatter: Record<string, unknown>;
  content: string;         // raw markdown
  outlinks: Link[];        // parsed from content
  tags: string[];
  mtime: number;
}

interface Link {
  target: string;       // resolved note path, or raw text if unresolved
  displayText?: string;  // [[target|displayText]]
  type: "wikilink" | "markdown"; // [[..]] vs [text](..)
  resolved: boolean;      // does target note exist?
}
```

### Graph
Derived, not stored:
```ts
interface GraphNode { id: string; label: string; }
interface GraphEdge { source: string; target: string; }
```
Backlinks = reverse index over `outlinks`. Build once on vault load, update incrementally on file save/change (don't rebuild the whole graph per keystroke).

### Link parsing
Regex/parser needs to handle:
- `[[Note Name]]`
- `[[Note Name|Display Text]]`
- `[[Note Name#Heading]]`
- `[[Note Name#^block-id]]`
- Standard `[text](relative/path.md)`
- Unresolved links (target doesn't exist yet — still shown, styled differently, common pattern for "create note from link")

---

## Core Feature Set

### MVP
- Open a folder as vault
- File tree sidebar
- CodeMirror markdown editor with syntax highlighting
- Live preview toggle (or inline rendering mode)
- `[[wikilink]]` autocomplete + click-to-navigate
- Backlinks panel per note
- Basic full-text search (Cmd+K style quick switcher)

### v1
- Graph view (local graph per-note + global graph)
- Tags pane
- Frontmatter-aware search/filter
- Daily notes
- Multiple panes / split view
- Command palette

### Later
- Plugin API
- Themes
- Sync
- Mobile builds (Tauri v2 already gives you the path here)

---

## Project Structure

```
app/
├── src/                      # React frontend
│   ├── components/
│   │   ├── Editor/            # CodeMirror wrapper + markdown extensions
│   │   ├── Sidebar/            # file tree
│   │   ├── Graph/              # d3-force / react-force-graph view
│   │   ├── Backlinks/
│   │   └── CommandPalette/
│   ├── state/                  # Zustand stores
│   ├── indexer/                # link parsing, graph building, search
│   │   ├── parseLinks.ts
│   │   ├── buildGraph.ts
│   │   └── search.ts
│   └── lib/
├── src-tauri/                 # Rust backend
│   ├── src/
│   │   ├── fs.rs                # vault read/write commands
│   │   ├── watcher.rs           # file system watcher → emit events to frontend
│   │   └── db.rs                # SQLite FTS setup
│   └── tauri.conf.json
└── package.json
```

---

## Implementation Notes

**Editor**: Use CodeMirror 6's decoration API for live-preview rendering (bold/italic/links rendered inline while cursor is elsewhere, raw markdown shown when cursor is on that line — this is the actual mechanism Obsidian uses, not a separate preview pane).

**File watching**: Needed because the user's OS-level sync client (iCloud, Dropbox, Syncthing) can write to vault files outside the app. Watch for external changes, diff against in-memory state, prompt on conflict rather than silently overwriting.

**Search**: Start with in-memory substring search over titles for the quick switcher. Move to SQLite FTS5 once you need full-content search across a large vault — don't build FTS on day one, it's premature.

**Graph rendering perf**: For vaults with 1000+ notes, don't re-render the full force simulation on every note switch. Debounce, and consider WebGL rendering (e.g. `sigma.js`) if `react-force-graph`'s canvas/SVG rendering gets sluggish.

**Mobile**: Tauri v2's mobile story works but has fewer plugins ported than desktop (check plugin parity before assuming a desktop feature "just works" on iOS/Android). Budget extra time here if mobile is a v1 goal, not an afterthought.

---

## Explicit Non-Goals (v1)

- Real-time collaborative editing
- Cloud-hosted backend / accounts
- Plugin marketplace
- Custom file format — always plain `.md`
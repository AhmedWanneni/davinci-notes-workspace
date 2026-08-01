# DECISIONS.md — Architecture Decision Log

Non-obvious decisions and their rationale. Check here before "fixing" something that looks like an odd choice — it may be deliberate. Append new entries at the bottom, don't edit past entries (add a superseding entry instead if a decision changes).

---

### App shell: Tauri v2, not Electron
Rust + native webview, ~8MB bundle vs Electron's ~150MB, lower idle memory, faster startup. v2 (stable as of Oct 2024, actively released through 2026) supports desktop *and* mobile (iOS/Android) from one codebase — this was the deciding factor over Electron, which has no mobile path.

### Frontend: React + TypeScript
Matches existing skillset. No framework debate needed — this was a fit-to-existing-experience call, not a technical necessity.

### Editor: CodeMirror 6, not ProseMirror/Tiptap
This is what Obsidian itself uses. Markdown stays the source of truth; live-preview rendering is a decoration layer on top, not a separate WYSIWYG document model. ProseMirror is more WYSIWYG-first and fights against "raw markdown is the file."

### Data storage: plain `.md` files on disk, not a database
Core to the local-first value proposition — portable, grep-able, no lock-in, works with any external tool. The app is a *view* over a folder, not the owner of the data.

### Index/search: SQLite + FTS5, not a NoSQL store, not Tantivy
Data is inherently relational (notes, links, tags — join-shaped queries like "notes tagged X linking to Y"). NoSQL doesn't fit. Tantivy was considered for search-ranking quality but rejected for v1: it would mean maintaining two data stores in sync for marginal gains on a problem (structured + text queries together) SQLite already handles well. Revisit only if search relevance becomes a real user complaint.

### Wikilink schema: `links` table with target/source/resolved columns, indexed on target
Makes backlinks a single indexed query instead of a full-vault scan. Must support: plain links, `|alias`, `#heading`, `#^block-id`, and unresolved links (target doesn't exist yet, still rendered, click-to-create). Rename propagation (rewriting `[[old name]]` across the vault) is the highest-risk feature here — plan for it explicitly, don't bolt it on later.

### Styling: SCSS + PostCSS, not Tailwind, not a hybrid
The app's aesthetic (editorial, typography-driven, borders-as-depth, deliberately not the common AI-generated-UI look) doesn't map to utility-class composition. Tailwind's defaults actively fight this direction. A hybrid was rejected too — two styling systems means AI-generated code inconsistently reaches for whichever one first, undermining the file-organization discipline. Token layer (SCSS vars + CSS custom properties) gives the consistency benefit Tailwind would have provided, without the utility-class syntax mismatch.

### Sync: manifest-diff file sync, not CRDT (Yjs)
The actual problem is single-user, multi-device, rarely-simultaneous editing — not live multi-user collaboration. CRDTs solve a harder problem than the one that exists. Sync operates at the file layer (hash + mtime comparison, push/pull whole files) underneath the editor, not inside it. Conflicts (rare, same note edited on two devices since last sync) are resolved Dropbox-style: server version wins, losing version saved as a conflicted copy file, resolved manually. Revisit CRDTs only if true live cross-device sync or multi-user collaboration becomes an actual goal — treat that as a distinct, larger-scope feature, not a v1 requirement.

### Mobile storage: app-sandboxed, not arbitrary folder access
iOS/Android don't allow desktop-style folder access. Vault lives in app-private storage; all external changes arrive through the sync client, not a filesystem watcher (which desktop uses instead, since sync clients like iCloud/Dropbox can write directly into a folder there).

### Mobile navigation: stack-based, not multi-pane
Desktop's multi-pane/split-view model doesn't translate to a phone screen. Backlinks/graph/tags become sheets or dedicated screens rather than always-visible panels.

### Mobile graph view: scoped down or deferred
Weaker mobile GPUs + small screens make full force-directed graph rendering a real risk. Default to backlinks-only on mobile for v1; revisit full graph rendering only after validating it's actually needed once the app is in daily use on a phone.
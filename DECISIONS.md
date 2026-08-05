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

### Design tokens: Obsidian dark theme as color baseline
Color tokens in `packages/design-system/tokens/src/color.json` are sourced from Obsidian's published dark theme (`#1e1e1e` bg, `#dcddde` text, `#7f6df2` accent). These are starting values, not final brand-locked — validate against a running Obsidian instance before treating as canonical. Success/warning semantic colors for Badge are **not yet tokenized**; `Badge.module.scss` uses placeholder hex (`#2ecc71`, `#f1c40f`) until confirmed.

### Storybook 10: essentials merged into core
`@storybook/addon-essentials` removed from dependencies (empty/deprecated since SB 9). Controls, actions, and viewport ship in `storybook` core. Interaction test imports use `storybook/test`, not `@storybook/test`.

### Changesets over semantic-release; trunk-based branching
Changesets chosen for independent per-package versioning in the monorepo. Trunk-based branching (main + short-lived PRs) chosen over GitFlow for simplicity given small team size.

### Mobile storage: app-sandboxed, not arbitrary folder access
iOS/Android don't allow desktop-style folder access. Vault lives in app-private storage; all external changes arrive through the sync client, not a filesystem watcher (which desktop uses instead, since sync clients like iCloud/Dropbox can write directly into a folder there).

### Mobile navigation: stack-based, not multi-pane
Desktop's multi-pane/split-view model doesn't translate to a phone screen. Backlinks/graph/tags become sheets or dedicated screens rather than always-visible panels.

### Mobile graph view: scoped down or deferred
Weaker mobile GPUs + small screens make full force-directed graph rendering a real risk. Default to backlinks-only on mobile for v1; revisit full graph rendering only after validating it's actually needed once the app is in daily use on a phone.

### `.gitignore`: Tauri mobile `gen/` ignored
`apps/*/src-tauri/gen/` is gitignored — Tauri regenerates iOS/Android native project scaffolding via `tauri ios init` / `tauri android init`. Keeps the repo free of large, churn-heavy generated platform code. CI/mobile dev docs should document the regen step.

### `.gitignore`: Style Dictionary output committed
`packages/design-system/tokens/dist/` (SCSS vars, CSS custom properties, typed TS) is **committed**, not ignored. Output is small, human-readable, and useful to diff in PR review when token source JSON changes. CI still runs `build:tokens` to verify generated output matches source.

### Desktop bundle identifier: `com.davinci.notes` (provisional)
No bundle ID was documented in repo docs when scaffolding `apps/desktop`. Used `com.davinci.notes` derived from the workspace name — **confirm or replace before any App Store / notarization work**. Change in `apps/desktop/src-tauri/tauri.conf.json` → `identifier`.

### Desktop shell: baseline Tauri plugins pre-installed
`tauri-plugin-fs` (with `watch` feature for vault file watching), `tauri-plugin-sql` (SQLite feature for FTS index), and `tauri-plugin-log` (debug builds only) are registered in `src-tauri/src/lib.rs` with default capabilities — not wired to app features yet, so future sessions don't start from zero on plugin setup. File watching lives in the fs plugin's `watch` feature, not a separate crate (Tauri v2).

### Desktop window defaults
Initial window 1200×800, minimum 640×480 — sized for a future multi-pane note app shell, not a minimal dialog. Deliberately larger than Tauri's 800×600 default.
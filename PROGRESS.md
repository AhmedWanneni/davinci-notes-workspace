# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

**Fix: "New note" does nothing** — resolved. Next up: Dogfooding `v0.1.0-rc.1` with canvas included.

## Last Session

**Fix: "New note" silently does nothing (pre-existing since Phase 7 / UI grid layout)**

### Diagnosis (steps 1–5)

**1. Entry points wired**
| Entry point | Handler | Notes |
|---|---|---|
| Sidebar `FilePlus` button (`AppSidebar`) | `onCreateNote` → `handleCreateNote` | Click handler attached ✓ |
| Tab bar `+` (`AppTabs`) | `onNewTab` → `handleCreateNote` | Click handler attached ✓ |
| Icon rail | *No new-note button* | Daily note + new canvas only |
| Command palette (Enter, no matches) | `onSelectNote(query)` → `handleLinkClick` → `createNewNote(title)` | **Worked** — never used `prompt()` |
| Wikilink click (unresolved) | `handleLinkClick` → `createNewNote(targetRaw)` | **Worked** |
| Daily note (icon rail) | `handleDailyNotes` → `createNewNote(date)` | **Worked** |

**2. Console behavior**
Clicking sidebar/tab "new note" produced **zero console output** — handler ran but `window.prompt()` returns `null` immediately in the Tauri webview (same class of bug fixed for canvas in the prior session; note path was never updated).

**3. Creation call chain**
`handleCreateNotePrompt` → `prompt()` → early return when `null` → **`createNewNote` never called**. Downstream IPC (`write_note`), Rust `fs::write_note`, and indexing were never reached. Command registration and `write_note` name match were already correct (used successfully by wikilink/daily-note paths).

**4. Rust write**
Not exercised by broken entry points. Shared `write_note` command is the same path used by working flows.

**5. Post-creation**
N/A for broken entry points (no file written). Working paths (palette, wikilink) already opened editor + updated tree + indexed.

### Root cause
`App.tsx` `handleCreateNotePrompt` used `window.prompt("Enter note title:")`. Native `prompt()` is unsupported in Tauri webviews — returns `null` with no UI, so `createNewNote` was never invoked. Silent failure, zero console output.

### Fix (ADR-0058)
- Removed `prompt()`; sidebar/tab actions now call `createNewNote()` with no title → auto `Untitled.md`, `Untitled 1.md`, … via `resolveUniqueNotePath` (mirrors canvas `Untitled.canvas` pattern).
- Extracted canonical `createNoteInVault(path, content)` — single write + SQLite index + `updateAllPaths`, wrapped in `withVaultWatchSuppressed`.
- `useVaultSession.createNewNote` and `EditorArea.handleCreateNote` (canvas text→file) both delegate to `createNoteInVault`.
- `createNewNote(title?)` now accepts optional title (wikilink/palette/daily paths unchanged).

### Verification gap (which phase should have caught this)
- **Phase 9** (`plans/phase-9-quick-switcher.md` step 7): "Create a new note (via unresolved link **or 'New Note' button**)" — step listed the button but verification likely only exercised palette/wikilink paths.
- **UI grid layout plan** (`plans/ui-grid-layout-plan.md`): specifies "New Note action" in sidebar header but manual verification focused on layout collapse, not creation.
- **Phase 7** file-tree plan verification did not include new-note creation (tree navigation only).

**Tighten for future phases:** any step that names multiple entry points ("A or B") should require explicit checklist ticks per entry point, not one path proving the feature.

### Files changed
- `apps/desktop/src/App.tsx` — remove `prompt()`, wire `handleCreateNote`
- `apps/desktop/src/vault/createNoteInVault.ts` — canonical creation
- `apps/desktop/src/vault/resolveUniqueNotePath.ts` + test
- `apps/desktop/src/vault/useVaultSession.ts` — use shared helpers
- `apps/desktop/src/components/EditorArea/EditorArea.tsx` — delegate to `createNoteInVault`
- `apps/desktop/src/vault/index.ts` — exports
- `docs/adr/0058-canonical-note-creation-path.md` — new ADR
- `DECISIONS.md` — ADR-0058 row

### Automated verification
- `resolveUniqueNotePath.test.ts`: 2/2 passing
- `pnpm exec tsc --noEmit` in `apps/desktop`: clean

---

## Next Up (in order)

1. **Dogfooding `v0.1.0-rc.1`** for daily note-taking + canvas workflows together.
2. **Unlinked Mentions Detection**: vault-wide scanner / FTS for plain-text mentions of the active note's title.
3. **Inline Property Editing**: interactive property add/edit in `PropertiesBlock` with frontmatter serialization to disk.
4. **Outline Scroll Synchronization**: connect `NoteOutline` heading clicks to CodeMirror 6 scroll/cursor dispatch.
5. Add success/warning semantic color tokens (Badge currently uses placeholder raw hex — see `DECISIONS.md`).
6. Set up Chromatic or Playwright screenshot regression for `components/`.
7. Fix pre-existing lint error: `CanvasBenchmark.test.ts` boundaries/no-private (import from fixtures subfolder)

## Deferred Performance Items (canvas Phase 8 follow-ups)

- **Edge visibility with culling**: If `onlyRenderVisibleElements` causes artefacts where edge source is visible but target is off-screen (edge not rendered), revisit with a custom edge visibility strategy. Not observed in testing but worth watching during dogfood.
- **Alignment spatial indexing**: If canvas regularly exceeds 500+ nodes, replace the linear `otherNodes` scan in `snapNodeAlignment` with a spatial index (e.g. R-tree). Not warranted at 120 nodes.

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` in `tauri.conf.json` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex in `Badge.module.scss` — need confirmed Obsidian semantic palette values or new token entries.
- **Visual regression**: Chromatic account or Playwright screenshot CI not yet configured.
- **Total JS/CSS size budgets**: configured in `check-bundle-size.mjs` count lazy-loaded chunks (editor vendor + canvas + PDF nested all sum to totals that exceed the original "total" budgets even though they never ship in first paint. Adjust to only-paint-budget-only or move lazy-chunk ceiling if/when configured.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.

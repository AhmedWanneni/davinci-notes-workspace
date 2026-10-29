# Phase 12 — Performance Audit Checkpoint & Optimization Plan

This plan outlines the complete audit against recorded baselines and the 10 hard rules in `PERFORMANCE.md`, along with contained fixes to resolve all identified regressions and violations.

## Baseline Re-Measurements (Pre-Audit)

| Metric | Phase Baseline | Current Pre-Fix State | Evaluation |
|---|---|---|---|
| **Startup / Initial Bundle** | Phase 3: 317 KB raw / 100 KB gzip JS (Target: <500ms first paint) | 1,110.20 KB raw / 367.74 KB gzip JS (single monolith chunk, no lazy-loading) | ❌ **Regressed** in bundle size |
| **Vault Indexing (350 notes)** | Phase 5 + WAL fix: 41ms parse+graph, <15ms SQLite batch write | 41ms parse+graph, ~12ms SQLite batch write; BUT store `initializeVault` re-read all 350 files (~280ms) | ⚠️ **Held at indexer, Regressed in Store** |
| **Typing Latency** | Phase 6: 3.96 ms / keystroke on 1,000-line doc (Target: <16 ms) | Pure CM6 benchmark: 3.944 ms; BUT `BacklinksPanel` triggered SQLite queries on every keystroke | ⚠️ **Held in engine, Leaking in UI** |
| **File Tree Scroll** | Phase 7: Tree build ~8ms, flatten ~0.4ms, virtualized | Tree build ~6ms, flatten ~0.3ms, virtualized with `@tanstack/react-virtual` | ✅ **Held** |
| **Graph View Render** | Phase 10: 200-node cap, D3 simulation + SVG, 60fps pan/zoom | Top 200 nodes capped, D3 force + zoom active | ✅ **Held** |

---

## PERFORMANCE.md Hard Rules Audit

1. **Dependency Sizes**: All dependencies (`@tanstack/react-virtual`, `fuzzysort`, `d3-*`, `yaml`, `@phosphor-icons/react`) have documented justification in `DECISIONS.md`. Code-splitting needed to avoid loading them on first paint.
2. **Debouncing**: 750ms save debounce and 400ms watcher debounce held. **Violation**: `BacklinksPanel.tsx` included `notesContent` in its effect deps, executing SQLite queries and snippet extractions on every keystroke.
3. **Memory**: **Violation**: `useWorkspaceStore.initializeVault` was reading all 350 note files into memory on vault open; `closeNote` was not evicting closed note contents.
4. **Lazy-loading**: **Violation**: All dialogs (`SettingsDialog`, `GlobalGraphDialog`, `CommandPalette`) and graph panels (`LocalGraphPanel`, `GraphView` with D3) were statically imported into the initial bundle.
5. **Virtualization**: Satisfied. FileTree is virtualized (`@tanstack/react-virtual`); CommandPalette results are capped to 20 items.
6. **State Subscriptions**: **Violation**: `App.tsx`, `BacklinksPanel.tsx`, `CommandPalette.tsx`, and `SettingsDialog.tsx` subscribed to the entire Zustand store object (`const { ... } = useWorkspaceStore()`), causing full-app re-renders on keystroke.
7. **Batched Writes**: Satisfied. SQLite uses 50-item batching in `persistNotesBatch` and single debounced note writes.
8. **Main-Thread Blocking**: Satisfied. Indexing uses async IPC batches, search uses fast fuzzysort (<1ms), graph simulation is capped at 200 nodes.
9. **No Polling**: Satisfied. Event-driven watcher and on-demand settings loading; zero `setInterval` calls in the codebase.
10. **Manifest-Diff Readiness**: N/A for v1 client (sync service deferred to later phase).

---

## Proposed Changes

### 1. Fix State Subscriptions & Backlinks Keystroke Leak
- In `apps/desktop/src/components/BacklinksPanel/BacklinksPanel.tsx`:
  - Remove `notesContent` from the `useEffect` dependencies.
  - Subscribe to scoped selectors: `const vaultUpdateCounter = useWorkspaceStore((s) => s.vaultUpdateCounter);` and `const allNotePaths = useWorkspaceStore((s) => s.allNotePaths);`.
  - Fetch backlinks only when `activePath` or `vaultUpdateCounter` changes.
- In `apps/desktop/src/components/CommandPalette/CommandPalette.tsx`:
  - Use scoped selectors `useWorkspaceStore((s) => s.allNotePaths)` and `useWorkspaceStore((s) => s.openNotes)`.
- In `apps/desktop/src/components/SettingsDialog/SettingsDialog.tsx`:
  - Use scoped selectors `useWorkspaceStore((s) => s.editorFont)` and `useWorkspaceStore((s) => s.setEditorFont)`.

### 2. Fix Store Memory & Redundant Vault Loading
- In `apps/desktop/src/state/useWorkspaceStore.ts`:
  - Update `initializeVault` to only store `allNotePaths` and clear active/open note states, without reading all 350 files from disk.
  - Update `closeNote` to delete `notesContent[path]` when closing a tab to prevent memory leaks.

### 3. Implement Lazy-Loading & Code-Splitting
- Lazy-load non-critical views with `React.lazy` and `Suspense`:
  - `GlobalGraphDialog` (splits `d3-*` from initial bundle)
  - `SettingsDialog` (splits settings dialog code)
  - `CommandPalette` (splits `fuzzysort` from initial bundle)
  - `LocalGraphPanel` (splits local D3 graph view from first paint)
- In `packages/design-system/package.json`:
  - Mark `"sideEffects": ["**/*.scss", "**/*.css"]` to improve tree-shaking of unused primitives.

### 4. Split `App.tsx` to Comply with `AGENTS.md` Line Cap (Hard Cap 250 Lines)
- Break `App.tsx` (501 lines) into focused, single-responsibility subcomponents:
  - `apps/desktop/src/components/VaultWelcomeView/VaultWelcomeView.tsx` (< 100 lines): handles empty / loading / error vault states.
  - `apps/desktop/src/components/AppSidebar/AppSidebar.tsx` (< 100 lines): handles sidebar header, actions, and file tree.
  - `apps/desktop/src/components/AppTabs/AppTabs.tsx` (< 90 lines): handles open tabs, active tab switching, and close actions.
  - `apps/desktop/src/components/EditorArea/EditorArea.tsx` (< 90 lines): renders the active editor or no-note empty state.
  - `apps/desktop/src/components/RightSidebar/RightSidebar.tsx` (< 70 lines): renders right sidebar with lazy-loaded `LocalGraphPanel` and `BacklinksPanel`.
  - `apps/desktop/src/App.tsx` (< 150 lines): orchestrates layout, global keyboard shortcuts, and lazy dialogs.

### 5. Configure Bundle Size CI Gating
- Create `scripts/check-bundle-size.mjs` to measure built assets in `apps/desktop/dist/assets/` (both raw and gzip size) against strict thresholds.
- Add `check:bundle-size` script in root `package.json` and wire it into `.github/workflows/ci.yml`.
- Verify the CI check fails when threshold is exceeded and passes with the optimized bundle.

---

## Verification Plan

### Automated Tests
1. `pnpm test` across all packages in the monorepo.
2. `pnpm --filter @app/indexer benchmark:large-vault` to verify indexer timing.
3. `pnpm --filter @app/desktop test` to verify `EditorBenchmark.test.ts`, `VaultStress.test.ts`, `VaultIndexer.test.ts`, and `useWorkspaceStore.test.ts`.
4. Bundle build and size verification: `pnpm --filter @app/desktop build:web && node scripts/check-bundle-size.mjs`.
5. Bundle-size gating test: temporarily lower the threshold to verify CI gating fails on breach, then restore the correct threshold.

### Manual / Structural Verification
1. Verify all new and modified files are under 250 lines (`AGENTS.md` compliance).
2. Verify all 10 hard rules in `PERFORMANCE.md` are satisfied with documented evidence.
3. Update `PROGRESS.md` with complete before/after measurement tables and session log.

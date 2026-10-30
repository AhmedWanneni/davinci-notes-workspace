# Phase 7: File Tree Sidebar

This document outlines the implementation plan for building the File Tree Sidebar (Phase 7) for vault navigation, replacing the temporary flat list in the sidebar.

## Proposed Approach

1. **File Tree Data Construction (JS-side)**:
    - While Phase 5 introduced `getFileTree()` in Rust, passing a deeply nested JSON tree over IPC on every watcher update adds unnecessary serialization overhead.
    - Since `allNotePaths` (a flat array of all markdown paths) is already maintained in `useWorkspaceStore` and kept perfectly in sync via the watcher, we will build a pure JS helper `buildTreeFromPaths(paths)` that constructs the `FileTreeNode[]` tree synchronously. This respects the **Performance Principle** by avoiding redundant IPC calls.
    - The tree will be sorted: folders first, then files, alphabetically within each group.

2. **Virtualization (`@tanstack/react-virtual`)**:
    - To render the tree efficiently and support vaults with thousands of notes, we will use `@tanstack/react-virtual`.
    - Because standard virtualizers expect flat lists, we will manage the tree state (expand/collapse) in a custom hook. The hook will traverse the `FileTreeNode[]` and produce a flat array of **visible nodes** based on which folders are currently expanded.
    - The virtualizer will render this flattened visible array. We will maintain indentation visually using CSS `padding-left` based on the node's depth.

3. **UI & Interactions (`@phosphor-icons/react`)**:
    - We will introduce a `FileTree` component in `apps/desktop/src/components/FileTree/`.
    - Rows will use Phosphor icons (`CaretRight`/`CaretDown` for folders, `FileText` or similar for files).
    - Clicking a folder will toggle its expanded state.
    - Clicking a file will call `openNote(path)` (which already handles debounced save flushing natively in `useWorkspaceStore`).
    - Active note styling will apply to the currently selected file.

## Open Questions

> [!WARNING]
> **Dependency Addition**: I plan to add `@tanstack/react-virtual` and `@phosphor-icons/react` to `apps/desktop` dependencies. `@tanstack/react-virtual` is very lightweight (~3.5KB gzipped) and fits the stack. Is this acceptable?

## Proposed Changes

### Dependencies

#### [MODIFY] package.json (apps/desktop)

- Add `@tanstack/react-virtual` and `@phosphor-icons/react` (if not exported by design system).

---

### Core Logic

#### [NEW] apps/desktop/src/components/FileTree/tree-utils.ts

- `buildTreeFromPaths(paths: string[])`: Takes flat paths and returns a sorted `FileTreeNode[]` (folders first, files second, alphabetical).
- `flattenVisibleTree(tree: FileTreeNode[], expandedFolders: Set<string>)`: Returns a flat array of visible nodes with their computed depth for the virtualizer.

---

### UI Components

#### [NEW] apps/desktop/src/components/FileTree/FileTree.tsx

#### [NEW] apps/desktop/src/components/FileTree/FileTree.module.scss

- The virtualized tree component.
- Maintains `expandedFolders` state (React state or Zustand, preferably React state since it's UI specific).
- Uses `useVirtualizer` to render the flattened visible tree list.

---

### App Shell Wiring

#### [MODIFY] apps/desktop/src/App.tsx

#### [MODIFY] apps/desktop/src/App.module.scss

- Replace the existing flat `.sidebar-content` map with the new `<FileTree />` component.
- Pass `allNotePaths` to the `FileTree` so it can derive its state.

## Verification Plan

### Manual Verification

- Load the large fixture vault (350 notes, nested folders) via the debug button.
- Verify smooth scrolling of the virtualized list.
- Expand/collapse multiple nested folders without jank or layout thrashing.
- Click a note deep in the tree and verify it opens in the editor, flushing any existing dirty note saves.
- Trigger an external file change (via terminal `touch path/to/new_note.md`) and verify the tree updates automatically via the watcher without collapsing currently open folders.
- Record scroll performance observations (DOM node count vs total items) in `PROGRESS.md`.

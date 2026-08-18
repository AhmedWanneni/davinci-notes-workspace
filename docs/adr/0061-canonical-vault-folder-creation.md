# ADR-0061: Canonical vault folder creation

## Status
Accepted

## Context
Empty vault folders are real filesystem directories (ADR-0004) but do not appear in `allNotePaths` or SQLite — only files are indexed (ADR-0025). The file tree (ADR-0028) previously built folder nodes only from file path prefixes, so empty folders were invisible and could not be created from the UI.

## Decision
- **`createFolderInVault(parentFolder?)`** is the single folder-creation path: Rust `create_folder` IPC → update `allFolderPaths` in workspace state (no SQLite write).
- **`list_folders`** Rust command walks the vault filesystem on open and on watcher batches; results stored in `allFolderPaths`.
- **`buildTreeFromPaths(filePaths, folderPaths)`** merges explicit empty folders with folders implied by file paths.
- **Triggers**: sidebar `FolderPlus` button (creates in selected folder or vault root) + file-tree context menu "New folder" (on folder row or tree background).
- **Naming**: default `New Folder`, auto-disambiguate (`New Folder 2`, …) per ADR-0060 collision convention — never overwrite.
- **Post-create UX**: inline rename immediately (same pattern as notes) via `renameFolderInVault`.

## Consequences
- Empty folders persist on disk and survive app restart via `list_folders`.
- Folder creation does not touch the SQLite index — correct, folders are not notes.
- Notes created inside a new folder use existing `createNoteInVault` with path prefix; indexing unchanged.

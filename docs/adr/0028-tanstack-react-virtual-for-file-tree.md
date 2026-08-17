# ADR-0028: `@tanstack/react-virtual` for the file tree

## Status
Accepted

## Context
The file tree has dynamic height, nested collapsible folders, and must handle thousands of items without dropping frames.

## Decision
Virtualize the file tree with `@tanstack/react-virtual` (~3.5 KB, headless, dynamic list items). Flatten the nested tree into a list of "visible nodes" based on expand/collapse state. Build the tree synchronously in JS from `allNotePaths` rather than calling the Rust IPC `get_file_tree` on every watcher update.

## Consequences
- <10 ms re-renders for large fixture vaults; no serialization overhead or IPC lag on watcher updates.

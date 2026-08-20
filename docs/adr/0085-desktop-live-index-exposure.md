# ADR-0085: Expose live vault indexes through workspace state

## Status
Accepted

## Context

`@app/indexer` provides pure TagIndex mutation functions, but the desktop app
previously discarded the index created during vault indexing. Search therefore
had no safe way to access the incremental tag state. Full-text search is
already a SQLite FTS5 table behind the singleton `getVaultIndexDb()` accessor.

## Decision

Create one `TagIndex` during the existing `indexVaultFull` note load and store
that same mutable instance as `useWorkspaceStore.tagIndex`. Pass it through
watcher reconciliation, mutating it with the existing indexer update/remove
functions. Note saves update it; canonical deletes remove entries. UI code
reads the instance through the workspace selector. UI code accesses the live
FTS index through the existing `getVaultIndexDb()` singleton rather than
creating another full-text index object.

## Consequences

- No component mount or query performs a vault scan or builds a duplicate tag
  index.
- The tag index is replaced only when a new vault is opened and otherwise lives
  for that vault session.
- The SQLite connection remains the single full-text index authority.
- Future create/duplicate/rename paths must keep using the canonical vault
  helpers so their tag updates remain on the same state path.

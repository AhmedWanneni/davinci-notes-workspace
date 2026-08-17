# ADR-0037: Bulk indexing batching & links conflict handling

## Status
Accepted

## Context
Vault indexing and watcher reconciliation must avoid lock errors and preserve valid duplicate outlinks.

## Decision
`indexVaultFull` and `reconcileVaultChanges` use `persistNotesBatch`, chunking notes and links into parameterized bulk SQL operations (50 items per query). Because `links` has a surrogate `id` and **no unique constraint** on `(source_path, target_path)` (multiple outlinks like `[[Note#Heading1]]` and `[[Note#Heading2]]` are valid), upserts are semantically invalid on `links`. Instead: `DELETE FROM links WHERE source_path IN (...)` for batch source paths, then bulk `INSERT INTO links`.

## Consequences
- Verified 10/10 consecutive vault open/index cycles without lock errors.
- Backlinks/duplicate-link semantics preserved (see ADR-0006, ADR-0024).

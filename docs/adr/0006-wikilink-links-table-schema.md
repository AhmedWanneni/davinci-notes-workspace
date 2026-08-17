# ADR-0006: Wikilink `links` table schema

## Status
Accepted

## Context
Backlinks must be a single indexed query, not a full-vault scan.

## Decision
A `links` table with `source`/`target`/`resolved` columns, indexed on target. Must support plain links, `|alias`, `#heading`, `#^block-id`, and unresolved links (target doesn't exist yet, still rendered, click-to-create).

## Consequences
- Rename propagation (rewriting `[[old name]]` across the vault) is the highest-risk feature here — plan for it explicitly, don't bolt it on later.
- Schema details in ADR-0024 and ADR-0037.

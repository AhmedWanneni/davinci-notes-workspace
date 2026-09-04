# ADR-0144: AI Remediation A durable chunk text

## Status

Accepted

## Context

ADR-0140 identified that vector rows retained citation metadata but not the
chunk text required to build grounded context and verify citations.

## Decision

Apply an incremental SQLite migration v5 adding non-null `text` with an empty
default to `embedding_chunks`. New and regenerated embeddings persist the
exact chunk text; ask-your-vault rejects rows without text rather than sending
empty context or presenting an unsupported citation.

The applied v4 migration remains unchanged. Existing empty-text rows require
re-embedding before they are eligible for ask-your-vault.

## Consequences

Chunk text is available from the same store query used for ranking, avoiding a
second source lookup. The migration does not reconstruct text that was never
stored, so existing AI rows need normal incremental regeneration.

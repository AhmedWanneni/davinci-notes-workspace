# ADR-0136: AI embedding chunks and a dedicated embedding model

## Status
Accepted

## Context
Embedding infrastructure must support precise Phase 5 citations without
re-embedding unrelated vault content. The Phase 0 provider contract already
separates `embed` from `complete`; Phase 0 also found that a full local model
is not viable at launch, so the initial implementation uses the cloud path.

## Decision

1. Notes are split at Markdown headings and blank-line paragraph boundaries.
   Paragraphs larger than 2,000 characters are split into bounded windows.
   Every chunk stores its vault-relative note path, heading, start line, end
   line, and a stable cache key. This gives later retrieval a paragraph-level
   citation target rather than only a note-level target.
2. Reconciliation hashes each chunk's text and only calls `AIProvider.embed`
   for new or changed chunks. Removed chunk keys are deleted. If an edit
   shifts boundaries, the changed chunk hashes and source ranges invalidate
   the affected chunks; unchanged chunks remain cached. A note-level file
   size/mtime fast path remains the caller's first check, matching the sync
   manifest algorithm and its native BLAKE3 adapter.
3. Embeddings use a dedicated embedding model, separate from chat completion.
   Embedding models are optimized for vector quality, throughput, and payload
   cost; a chat model is optimized for generation. The provider's returned
   model identifier is stored with each vector so a later model change can
   invalidate the vector index explicitly.
4. Generation is queued behind the existing 450ms vault watcher settle
   boundary, coalesced by note path, batched in groups of 50, and yields after
   each batch. It never runs in the editor mutation call stack.

## Consequences

Chunk locations are precise enough for citations, but paragraph insertion can
shift later ranges and cause those affected chunks to regenerate. Character
windows are intentionally simple and dependency-free; token-aware splitting
and vector persistence belong to later phases. The embedding package is only
imported through `loadEmbeddingInfrastructure()` inside the already lazy AI
subsystem, so users who never enable AI pay no initial bundle cost.

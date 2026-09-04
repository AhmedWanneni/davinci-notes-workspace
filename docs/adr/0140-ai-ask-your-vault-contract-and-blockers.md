# ADR-0140: Ask-your-vault consent, retrieval, and citation contract

## Status
Proposed - blocked

## Context

Ask-your-vault has the highest per-query data exposure of the AI features. It
must not inherit semantic-search consent, and every citation must correspond
to context actually sent to the chat provider. The current earlier-phase
implementation is not sufficient to build this safely: Phase 0 defines
injected provider operations but no live cloud transport or persisted feature
consent state, while Phase 2 stores citation metadata but not chunk text.
`SqliteEmbeddingStore.querySimilar()` therefore reconstructs rows with an
empty `text` field.

## Decision

1. Ask-your-vault requires a separate explicit confirmation after global cloud
   consent, even when semantic search or suggest-links are already enabled.
   The confirmation names the provider and states that the user's question
   plus the selected retrieved note chunks will leave the device. Declining
   sends no embedding or completion request.
2. Retrieval context starts at **8 chunks**, independently from suggest-links'
   top 5. Eight is a bounded quality/latency starting point; it limits the
   amount of note content sent per question and must be tuned with answer
   grounding data later.
3. The completion request contains exactly the question and the eight (or
   fewer) retrieved chunk texts used to construct the prompt. No full vault,
   unrelated metadata, API key, or second citation lookup may be sent.
4. Citations are generated from the same immutable retrieved-chunk objects
   used to build the completion request. Each citation carries note path,
   heading, and line range and opens that source location.
5. `AIProviderError` authentication, rate-limit, network, unavailable, and
   invalid-request states must surface as explicit UI errors; no answer is
   shown as successful when completion fails.

## Blockers

Implementation is blocked until a prior phase supplies: (a) a real provider
transport and key/consent state, (b) durable chunk text in the vector store or
an equivalent safe source-text resolver, and (c) a production editor/source
location opener. Adding these here would silently change Phase 2 storage and
Phase 0 consent contracts. Phase 6 settings/provider management follows only
after those gaps are resolved.

# ADR-0229: Non-Destructive Vault Grounding & Wikilink Suggestion Engine

## Status

Accepted

## Context

A core value proposition of taking notes in Sophia is bi-directional hyperlinking and contextual retrieval from the user's existing personal knowledge graph. During a meeting, attendees often reference past projects, decisions, clients, or specific technical terms that already exist in vault notes.

However, generating embeddings for every sentence or querying heavy language models continuously creates unacceptable latency and battery drain on desktop machines during calls. Furthermore, an AI agent must never automatically rewrite or overwrite existing notes without user confirmation.

## Decision

1. **Lightweight FTS5 Retrieval Loop**:
   - The listening agent processes transcripts in **60-second sliding batches**.
   - Entities, filenames, and key topics are extracted using the AI model or rapid regex keyword extraction.
   - Grounding lookups query the local SQLite full-text search table (`notes_fts`) using BM25 ranking. Lookups complete in <5ms locally with zero API cost.
   - Vector embeddings (`@app/ai-embeddings`) are bypassed for the live loop to maintain 0ms cold-start and low CPU overhead.

2. **Non-Destructive User-Gated Suggestions**:
   - Suggested `[[wikilinks]]` and relevant past note snippets are presented in an expandable sidebar drawer.
   - The user can click `[+ Insert Link]` to include the link in the meeting note, or click `[Dismiss]`.
   - Existing vault notes are **never** altered or rewritten silently. All updates to other notes require explicit confirmation per ADR-0212 and ADR-0221.

## Consequences

- Instantaneous, low-power retrieval during live calls.
- Preserves user trust: notes are never modified without explicit consent.
- Enforces strict universal lock discipline via `withDbLock` on every SQLite FTS lookup.

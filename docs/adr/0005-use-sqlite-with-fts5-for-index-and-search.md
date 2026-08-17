# ADR-0005: Use SQLite + FTS5 for index and search

## Status
Accepted

## Context
Data is inherently relational (notes, links, tags — join-shaped queries like "notes tagged X linking to Y"). NoSQL doesn't fit. Tantivy was considered for search-ranking quality.

## Decision
Use SQLite (with FTS5 for text search) as the index/store. Reject NoSQL and Tantivy for v1.

## Consequences
- One data store; structured + text queries in the same SQLite database.
- Tantivy would mean maintaining two stores in sync for marginal gains — revisit only if search relevance becomes a real user complaint.

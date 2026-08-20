# ADR-0084: General search execution and ranking

## Status
Accepted

## Decision

Positive query clauses use implicit AND. Plain terms and quoted phrases run
against FTS5; tag clauses filter through Phase 4's `queryNotesByTag` directly.
Leading-minus clauses remove matches after positive clauses are intersected.
When no positive clause exists, execution starts from indexed note paths.

FTS results use SQLite's deterministic `bm25` score, with lower scores treated
as more relevant; ties use title then path. Snippets are returned from the FTS
query for Phase 4. Tag-only results receive score zero and use the same title,
then path ordering. Combined queries retain FTS relevance within the
tag-filtered set. Phase 1 indexes body content only, so no title/heading weight
is applied yet.

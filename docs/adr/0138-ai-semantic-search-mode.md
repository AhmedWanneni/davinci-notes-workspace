# ADR-0138: Semantic search is an opt-in mode in the content Search dialog

## Status
Accepted

## Context

The app has a Cmd+K quick switcher for fast title/path fuzzy matching and a
separate lazy Search dialog for content queries. ADR-0079 reserves content
search for the latter. Phase 0 chose independent consent for semantic search.

## Decision

Semantic search is an additive `Semantic` mode in the existing Search dialog;
Cmd+K and its fuzzysort behavior remain unchanged. The mode is rendered only
when both the feature's consent state and a ready semantic query callback are
true. It is not shown disabled or teased when AI is off.

The existing Search dialog's 150ms debounce is reused. Semantic queries must
contain at least three non-whitespace characters before the provider is called;
shorter input is too ambiguous and would create unnecessary cloud requests.
Semantic results are labeled `Semantic match` and retain note path, heading,
and source line range. Exact and semantic results are not silently interleaved:
the user selects the mode, so each list has one ranking contract.

## Consequences

The existing exact/content search path remains regression-isolated and the
semantic callback can stay behind the AI lazy boundary. A real relevance
benchmark is blocked until Phase 0's injected provider operations are backed by
an actual cloud embedding transport and Phase 2's persisted vectors are
populated from real note text.

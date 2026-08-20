# ADR-0088: Tags feature plan decision index and closeout

## Status
Accepted

## Decision index

Tags use the dependency-free shared `@app/core-types` parser and model
(ADR-0075), with Unicode letters/numbers/marks/symbols plus `_`, `-`, `/`, and
ZWJ allowed; punctuation and whitespace terminate tags (ADR-0076). The
indexer maintains a vault-wide reverse `TagIndex` with case-insensitive keys,
first-seen canonical display casing, and descendant-inclusive but
ancestor-asymmetric queries. The editor renders tags outside code and forwards
canonical keys to General Search. Frontmatter and inline tags merge into the
same note tag set (ADR-0078).

The desktop Tags view reads the live workspace index, synthesizes nested parent
rows, shows direct-use counts only, and refreshes from `vaultUpdateCounter`
(ADR-0087). Tag selection and editor tag clicks share the General Search
`tag:` path; `#` is optional and normalized away by the shared query parser.

## Scope boundary

Tag rename/merge UI and Bases `hasTag` integration remain explicitly out of
scope. No rename/merge controls or Bases query integration were introduced by
the Tags plan.

## Verification

Core tag rules passed 11 tests, index/parser/execution passed 14 tests, editor
tag rendering passed 5 tests, and focused desktop vault update tests passed 4
tests. The editor suite explicitly covers headings, lists, blockquotes, table
cells, inline code, and fenced code exclusion. A 1,000-note nested index/query
benchmark completed in a 3 ms Vitest test phase. The separate real SQLite
cold-start benchmark remains blocked by the pre-existing `NoteTags.js`
strip-types module-resolution issue recorded in ADR-0086.

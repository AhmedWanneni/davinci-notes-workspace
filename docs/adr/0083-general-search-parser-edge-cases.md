# ADR-0083: General search parser edge-case behavior

## Status
Accepted

## Decision

The v1 parser reports `tag:` without a value as a structured parse error and
omits that clause. An empty query produces no clauses or errors. Unknown
`name:value` prefixes fall back to one plain-text term, preserving the raw
token so future operators can be added through the registry without changing
tokenization. Registered operators receive a value without the optional `#`
normalization unless their handler defines such normalization; the built-in
`tag` handler normalizes it and lowercases the resulting key.

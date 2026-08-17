# ADR-0023: `parseLinks` ignores links inside code

## Status
Accepted

## Context
`[[wikilink]]` inside code samples must not pollute the graph.

## Decision
Mask fenced code blocks and inline backtick spans before link extraction.

## Consequences
- Code examples behave as users expect; graph stays clean.

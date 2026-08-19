# ADR-0070: Initial editor code-block language coverage

## Status

Accepted

## Context

Phase 6 needs fenced language tags to activate syntax highlighting without
adding a large all-language bundle to the always-loaded editor. The existing
editor uses CodeMirror 6 with Lezer Markdown and had no nested code language
configured.

## Decision

Configure `@codemirror/lang-javascript` as the first embedded grammar. The
resolver recognizes `js`, `jsx`, `javascript`, `mjs`, `cjs`, `ts`, `tsx`, and
`typescript` tags. Python, Rust, Go, CSS, HTML, SQL, and other languages remain
unconfigured until actual product usage justifies their bundle cost.

## Consequences

JavaScript-family fenced blocks receive real Lezer token highlighting in both
the editor and read-only MarkdownView. Unknown language tags remain literal
code, preserving correctness without claiming unsupported highlighting or
shipping every possible grammar.

# ADR-0020: Case-insensitive filename-stem wikilink resolution

## Status
Accepted

## Context
Wikilink targets need a deterministic resolution rule matching Obsidian conventions.

## Decision
Resolve wikilink targets against the **filename stem** (path basename without `.md`), compared case-insensitively — not against frontmatter `title`. When two notes share the same stem in different folders, the **alphabetically first vault-relative path** wins (deterministic, testable).

## Consequences
- Matches Obsidian's default "link name = file name" convention; resolution independent of parsed metadata.
- Ambiguous links are a known v1 limitation until a disambiguation UI exists.

# ADR-0215: LLM-Wiki Synthesis Engine and Map of Content (MOC) Architecture

## Status

Accepted (extends ADR-0004, ADR-0067)

## Context

Knowledge bases often suffer from topic fragmentation: users take atomic notes across disparate folders, but synthesize them into evergreen topics infrequently. The AI Agent can autonomously maintain a Karpathy-inspired "digital garden / LLM-wiki" inside the user's vault without proprietary schemas or databases.

## Decision

1. **Dedicated Wiki Namespace (`Wiki/`)**:
   - Store synthesized evergreen pages under `Wiki/` by default (configurable).
   - Topic notes are standard `.md` files tagged with YAML frontmatter `type: wiki-topic` and `tags: [wiki, evergreen]`.

2. **Map of Content (`Wiki/Index.md`)**:
   - The agent maintains an active index file with categorized `[[Wikilinks]]` pointing to each topic note with a single-line summary.

3. **Standard Wikilink Cross-Referencing**:
   - Concepts and source citations use standard `[[Wikilinks]]` resolving directly through the existing indexer (ADR-0067) and CodeMirror link widgets.
   - Topics are validated against path traversal before writing.

## Consequences

- Notes remain 100% plain Markdown files that can be browsed, edited, and searched normally.
- Zero extra database tables required.
- Bidirectional links seamlessly integrate into Graph View and BacklinksPanel.

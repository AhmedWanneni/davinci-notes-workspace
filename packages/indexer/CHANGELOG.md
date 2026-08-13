# @app/indexer

## 0.1.0

### Minor Changes

- Initial release of `@app/indexer` (reconstructed from Phases 4–5 and Phase 11 session logs):

  - **Parsers**: High-performance wikilink parser supporting aliases (`[[Note|Alias]]`), headings (`[[Note#Heading]]`), block references (`[[Note#^block-id]]`), and code-block masking; robust YAML frontmatter parser.
  - **Graph Builder**: In-memory and SQLite-backed graph index construction with degree calculations and reverse backlink indexing.
  - **Database Schema**: Canonical SQLite DDL (`schema.sql`) defining indexed `notes`, `links` (with `idx_links_target`), and `settings` tables.

### Patch Changes

- Updated dependencies
  - @app/core-types@0.1.0

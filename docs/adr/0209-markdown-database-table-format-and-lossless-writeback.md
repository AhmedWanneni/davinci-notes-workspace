# ADR-0209: Markdown Database Table Format and Lossless Write-Back

## Status

Accepted

## Context

Users require a Notion-style typed Database Table View stored in a single Markdown note (`database: table`). The format must combine YAML frontmatter (for column types, select options, and schema metadata) with a standard GitHub Flavored Markdown (GFM) pipe table (for column ordering, header names, and row data):
- The header row of the first pipe table defines the column names and their display order.
- The YAML frontmatter specifies types (`text`, `number`, `select`, `checkbox`, `date`) and select option palettes.
- Header columns missing from frontmatter are treated as `text` without rewriting frontmatter.
- Frontmatter columns missing from the table are displayed as empty cells without altering the table structure.
- Content before and after the first pipe table (titles, headings, comments, subsequent tables) is opaque and must be preserved byte-for-byte.
- Cell escaping (`\|`) and line breaks (`<br>`) must remain valid Markdown without breaking table parsing.
- Invalid or mismatched values (e.g. non-numeric text in a number column, unlisted select value) must be preserved verbatim and never discarded or rewritten.

## Decision

1. **Dedicated Lazy-Loaded Package (`@app/database`)**:
   Implement the data model, line-preserving parser, minimal-diff operations, and table view in `packages/database`. Restrict dependencies under ESLint boundaries to `@app/core-types` and `@app/design-system`, adding zero initial bundle cost.

2. **Lossless Round-Trip Architecture**:
   `parseDatabase(text)` partitions notes into `frontmatterText`, parsed `frontmatterDoc` (using `yaml.parseDocument` to preserve comments and key ordering), `preambleLines`, structured table `headers`, `delimiterLine`, `rows`, and `epilogueLines`.
   - If `!model.isModified`, `serializeDatabase(model)` returns `model.rawText` in O(1) time with identical byte-for-byte fidelity across LF/CRLF line endings and trailing newlines.

3. **Minimal-Diff Row Splicing**:
   Mutations (`editCell`, `toggleCheckbox`, `addRow`, `deleteRow`, `duplicateRow`) splice only the affected row lines. Untouched lines remain byte-identical.
   - Spliced rows use compact spacing (`| a | b |`) or preserve original column bounds when fitting.

4. **Comment-Preserving YAML Frontmatter Updates**:
   Schema mutations (`addColumn`, `renameColumn`, `deleteColumn`, `reorderColumns`, `changeColumnType`, `addSelectOption`) update the YAML AST via `yaml.parseDocument` without dropping existing YAML comments, formatting, or unrelated frontmatter keys.

5. **ADR-0170 Save-Path & External Reconciliation Alignment**:
   Table view writes go through the workspace store save queue with a 750 ms debounce, change-stat guard, and atomic file renaming.
   - External file changes reload the table live while preserving active in-progress cell editing drafts.
   - Malformed notes fail safely by opening in standard Markdown mode with an alert banner and are never rewritten.

## Consequences

- Full interoperability with Obsidian, standard Markdown viewers, and git sync.
- Zero data loss for unrecognized markdown, raw values, or comments.
- Sub-15ms parse latency for 5,000 table rows.

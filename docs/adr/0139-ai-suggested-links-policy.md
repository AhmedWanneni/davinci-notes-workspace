# ADR-0139: Suggested-link ranking and right-sidebar placement

## Status
Accepted

## Decision

Suggest-links is independently consent-gated, debounced at the existing
450ms embedding scheduler boundary, and queries the current note against the
Phase 2 vector store after the note is open or settled from edits. The initial
candidate window is top 5 notes with a cosine threshold of 0.78. These are
tuning defaults, not a permanent relevance contract; threshold and N must be
re-evaluated with real provider embeddings.

Suggestions appear as a collapsible-style subsection directly below Backlinks
in the existing right sidebar. Empty and disabled states render no section,
so backlinks and outline retain their existing layout. Each action calls the
existing editor adapter's `insertText` boundary with `[[vault/path.md]]`; it
does not write files or maintain a second link index. The normal editor change
handler therefore performs the same debounced save and backlink/index update
as manually typed syntax.

## Rationale and limitation

The 0.78/5 combination favors precision over recall for a small, glanceable
panel. A real threshold-tuning run is blocked until Phase 0's provider
delegate has a live embedding transport and Phase 2's table contains vectors
generated from actual fixture content. No fabricated relevance score is used
to claim otherwise.

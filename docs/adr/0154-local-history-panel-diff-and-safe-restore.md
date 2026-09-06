# ADR-0154: Local history uses a right-sidebar panel, in-project line diff, and append-only restore

## Status

Accepted

## Context

Phase 2 makes the local Git history from ADR-0153 useful without introducing a
remote or sync concept. ADR-0029 places note-context navigation in the
discoverable right sidebar, and ADR-0057 establishes explicit unavailable
states for non-Markdown content. The history UI must remain lightweight.

## Decision

1. Version History is a collapsible right-sidebar section beside Linked
   mentions and Outline. It lists the active Markdown note's real Git commits
   newest first, with the generated message and timestamp.
2. The panel itself is loaded with `React.lazy()` only when the right sidebar
   renders it. `lineDiff` is a small in-project longest-common-subsequence
   implementation; it produces readable added, removed, and unchanged lines.
   No diff dependency is added.
3. Selecting a version compares it with the immediately preceding version for
   that note. This provides a stable, readable change view rather than a raw
   `git diff` dump.
4. Restore writes the chosen committed content and makes a new `Restore:
   <path> to <short-revision>` commit. It never resets, rebases, or deletes
   history. The existing Git-operation mutex covers the restore write through
   staging and commit, and the loaded editor content is replaced without
   marking it dirty.
5. Phase 2 persists no commit metadata to `vault-index.db`; Git's `.git`
   directory remains the only history store, so no database lock operation or
   migration is introduced.

## Verification

- A real temporary vault received three actual `Auto-save: note` commits.
  The native history result was compared field-for-field and in order with
  `git log --format=%H%x1f%s%x1f%ct -- note.md`; they were exactly equal.
- A separate real Git repository comparison confirmed `git diff` reports
  `-first` and `+second`, and the rendered diff's changed lines are exactly
  `-first`, `+second` in that order. The component test confirms those lines
  and the actual selected revision flow render in the panel.
- The real-history test restored two distinct older revisions in sequence.
  After each restore, disk content exactly equaled `git show <revision>:note.md`.
  `git log` retained all three original commits and added two restore commits,
  with the newest two messages naming their restored revisions.
- Production web build: entry `index-B7KAhj-w.js` is 369,700 raw / 116,940
  gzip bytes. The deferred Version History chunk is 2,689 raw / 1,188 gzip
  bytes. No package was added.

## Consequences

Users can safely inspect and recover local versions without Git knowledge.
Phase 3 may add a remote model separately; it must not change this local-first
history behavior by implication.

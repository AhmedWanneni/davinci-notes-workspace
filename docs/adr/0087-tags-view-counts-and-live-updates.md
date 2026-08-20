# ADR-0087: Tags view tree counts and live updates

## Status
Accepted

## Decision

The Tags view is opened through a `Browse Tags` Command Palette action and is
separate from the Quick Switcher result behavior. It derives its nested tree
from the live workspace `TagIndex`; parent nodes are synthesized when only a
descendant is stored. Counts are direct-use counts from
`tagIndex.tagToNotes.get(key).size`; descendant counts are not added to
parents. Canonical display casing comes from `getCanonicalTag`, with a
normalized fallback for synthesized parents.

The view subscribes to `vaultUpdateCounter`, which the existing incremental
vault reconciliation and note-save paths update. It does not poll or rebuild
the index. Selecting a row closes the view and calls the same `tag:<key>`
Search callback used by editor tag clicks.

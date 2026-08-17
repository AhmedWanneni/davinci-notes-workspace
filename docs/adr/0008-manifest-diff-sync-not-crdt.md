# ADR-0008: Manifest-diff file sync, not CRDT (Yjs)

## Status
Accepted

## Context
The actual problem is single-user, multi-device, rarely-simultaneous editing — not live multi-user collaboration. CRDTs solve a harder problem than the one that exists.

## Decision
Sync at the file layer: hash + mtime comparison, push/pull whole files, underneath the editor. Conflicts (rare) resolve Dropbox-style — server version wins, the losing version is saved as a conflicted copy file for manual resolution.

## Consequences
- No collaboration infrastructure in v1.
- Revisit CRDTs only if true live cross-device sync or multi-user collaboration becomes an actual goal — treat that as a distinct, larger-scope feature.

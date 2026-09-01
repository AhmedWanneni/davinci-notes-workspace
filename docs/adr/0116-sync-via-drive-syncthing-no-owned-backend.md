# ADR-0116: Sync via Drive/Syncthing, no owned backend

## Status

Accepted

## Context

DaVinci Notes needs offline-first, single-user multi-device vault sync, but it
does not need a backend that the project must own, run, secure, and pay for.
The intended scope is synchronization of Markdown notes, canvas JSON, and
images across desktop and mobile, with the app fully usable offline and sync
performed opportunistically. The earlier server-canonical model in
[ADR-0008](0008-manifest-diff-sync-not-crdt.md) was never implemented beyond
scaffolding and is not the intended product boundary.

Drive and Syncthing are fundamentally different mechanisms. Drive is a
user-authorized remote API where the app can own manifest diffing, conflict
handling, and file transfer. Syncthing is an external folder-sync process; the
app should simply react to filesystem changes and must not pretend it is an API
transport. Forcing both behind one `SyncTransport` abstraction adds complexity
without a shared operational surface.

## Decision

Formally supersede ADR-0008 as the complete sync architecture record. Its
manifest-diff/non-CRDT rationale remains valid, but its server-canonical
conflict rule is replaced by the mode-specific boundary below. Support two
independent sync modes:

1. Drive mode: on-device OAuth and manifest-diff file synchronization against
   the user's Drive storage, with no project-operated relay or server.
2. Syncthing/folder mode: the user supplies an externally synchronized vault
   folder; the app owns no sync service and relies on its existing watcher and
   reconciliation behavior.

There is no owned sync backend, server deployment, database, WebSocket relay,
or required server-canonical conflict authority. The client-side sync package
may contain future Drive logic and shared file/manifest models, but it must not
reintroduce a server dependency or unify the two modes artificially.

The following are explicitly outside v1: real-time collaborative editing, a
managed or paid sync tier, automatic mode switching or migration for an
existing vault, and Git as a sync transport. Manual export/reimport is the
acceptable escape hatch for changing modes; local Git history remains a
separate feature.

## Consequences

- No backend infrastructure, hosting cost, server credentials, or deployment
  pipeline is required for sync.
- Drive mode is the polished built-in path; folder mode is the user-controlled
  path for Syncthing or another external folder tool, not a second API
  transport hidden behind a common abstraction.
- Mobile uses the client-side Drive mode or receives changes through its chosen
  folder/sync path; desktop continues to handle externally changed vault files
  through the watcher.
- Conflict policy and Drive OAuth details remain implementation-phase work in
  the sync plan. Syncthing conflicts remain files produced by Syncthing.
- The old `services/sync-server` placeholder has no role in this architecture:
  the baseline package was only an echo scaffold, not a functional service.
  Its removal is a repository-cleanup action tracked separately from this
  decision and must not be inferred from the ADR alone.

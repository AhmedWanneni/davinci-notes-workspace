# Davinci Notes — Sync Plan (v2: Drive / Syncthing, no backend)

Status: draft — supersedes the object-storage-backed version of this plan
Depends on: ADR — plain `.md` files as source of truth

## 1. Goals & non-goals

**Goals**
- Multi-device sync (desktop ↔ desktop, desktop ↔ mobile) of a vault of `.md`, canvas `.json`, and image files.
- Zero backend owned/run/paid-for by us. Every sync mode routes through infrastructure the user already has or a peer-to-peer tool.
- User picks one mode per vault at setup. No requirement to support switching mid-use in v1 (manual export/reimport is an acceptable escape hatch).
- Offline-first: app is fully usable with no network; sync is opportunistic reconciliation.

**Non-goals (v1)**
- Real-time collaborative editing.
- A managed/paid sync tier (may come later as a third option, out of scope here).
- Automatic mode-switching or migration between Drive and Syncthing for an existing vault.
- Git-based sync (evaluated and rejected for this purpose — see §7. Local history via git is a separate, unrelated feature/plan.)

## 2. Two modes, not one abstraction forced over both

Earlier drafts of this plan tried to fit every backend behind a single `SyncTransport` interface. That's correct for Drive-like backends but wrong for Syncthing, which isn't an API you call — it's an external process that syncs the folder for you. Trying to unify them adds abstraction for no real benefit. Build two independent things instead:

### Mode A — Cloud storage (Google Drive)

The app owns sync logic end-to-end: manifest diff, conflict resolution, blob transfer, all against the Drive API.

### Mode B — Folder sync (Syncthing, or any external tool)

The app owns none of the sync logic. It only needs to react well to files changing on disk for reasons outside its control — which is required anyway for any external editor touching the vault.

## 3. Mode A — Google Drive

### 3.1 Manifest & diff algorithm

Each device maintains a manifest derived from the filesystem (not a second source of truth — always regenerable):

```
ManifestEntry {
  path: string
  hash: string          // BLAKE3 of file contents
  size: number
  deviceClock: number    // Lamport counter, incremented per sync pass
  deleted: boolean       // tombstone
}
```

Sync pass:
1. Build local manifest (fast-path: skip re-hash if size+mtime unchanged since last known-good manifest).
2. Fetch remote manifest(s) — one JSON file per device, stored in an app-scoped Drive folder (`Apps/DavinciNotes/manifests/<deviceId>.json`).
3. Three-way diff: local vs last-synced-by-this-device vs current remote state → push / pull / conflict per path.
4. Transfer changed files, keyed by content hash to skip re-upload of identical content already present.
5. Apply pulled changes to disk, update local manifest and FTS5 index incrementally.

### 3.2 Conflict resolution

- Text files (`.md`, canvas `.json`): three-way merge (diff3-style) using the last-synced version as common ancestor. Unresolvable hunks get inline conflict markers written into the file, plus a UI flag ("this note had a sync conflict") — never silently drop content.
- Images/binaries: no merge attempt. Conflict produces a copy (`image (device-name copy).png`).
- Delete-vs-edit: edited version wins, delete is treated as a no-op, flagged for user review.

### 3.3 Auth & storage

- OAuth **Desktop app** client type + PKCE — no client secret embedded, no backend needed to hold one. Loopback redirect on a local port during login.
- Tokens stored via OS keychain (Tauri stronghold/keyring plugin), refreshed on-device.
- **Before committing to this**: confirm current Google OAuth verification requirements for the scopes needed (`drive.file` scope, app-created-files-only, is usually enough and has a lighter review bar than broader Drive scopes — avoid requesting more than that).

### 3.4 Rate limits & efficiency

- Don't poll per-file. Use Drive's **Changes API** (`changes.list` with a stored `startPageToken`) to get a single delta feed of what changed remotely since last sync, rather than re-listing/diffing the whole manifest folder each pass.
- Batch manifest/blob requests where the API allows it.
- Defer/opt-in large attachment sync (>5MB) on metered mobile connections.

## 4. Mode B — Syncthing (folder sync)

- No integration code beyond what the app needs regardless: a robust file-watcher that detects external changes and reacts (reindex FTS5, refresh open note if changed on disk, invalidate cached search results).
- Setup UX: point the user at their Syncthing folder config; the app doesn't configure Syncthing itself in v1 (no IPC with the Syncthing daemon) — just needs to know which folder is the vault root, same as always.
- Conflicts are handled by Syncthing itself (`.sync-conflict-<timestamp>.md` files dropped alongside the original). The app should recognize this filename pattern and surface conflicted files in the UI (e.g. a "conflicts" view) rather than leaving the user to discover stray files in Finder/Explorer — this is the one piece of Syncthing-aware logic worth adding.
- No auth, no rate limits, no quota — genuinely zero backend surface.

## 5. User-facing framing

Present as two clearly different experiences, not equal peers:

- **"Sync via Google Drive"** — built-in, handles conflicts automatically, requires signing in.
- **"Sync via folder tool (Syncthing, etc.)"** — bring your own tool, you manage conflicts, zero setup on our side beyond picking the folder.

Don't let Mode B become the de-facto default just because it's cheaper to build — Mode A should be the polished, recommended path; Mode B is for users who want full control or don't want to authenticate a cloud account.

## 6. What we deliberately did NOT build

- No object storage we provision (removed from earlier draft — user-owned storage/tooling only).
- No custom relay/server component.
- No unified transport abstraction spanning both modes (see §2).
- No mid-use mode migration tooling (manual export/reimport only, v1).

## 7. Why not git as the sync transport

Considered and rejected specifically for sync (separate from git-based local history, which is a different feature — see the companion history plan):

- Git compresses text well but not binaries; a vault with images grows the repo close to full image size per version, unbounded over time — directly against the lightness constraint.
- Binary conflicts don't merge in git any better than they do in Drive/Syncthing mode — no advantage gained for the hardest case.
- Would require Git LFS for images, which reintroduces either a paid remote (GitHub/GitLab quotas) or a self-hosted LFS server — exactly the backend ownership this plan avoids.
- Adds a third transport shape alongside Drive/Syncthing for marginal benefit over the two already covering the real use cases.

## 8. Open questions before implementation

- Final confirmation of Drive OAuth scope (`drive.file` assumed) and current verification requirements.
- Whether Syncthing mode should eventually add IPC with the Syncthing REST API (status/pairing UI inside the app) or stay purely "point at a folder" for v1.
- Retention policy for Drive-side manifest history (old device manifests for devices no longer in use).
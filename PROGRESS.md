# PROGRESS.md — Current State

Updated at the end of every session. Read this first, before touching code. Full history: `docs/HISTORY.md`.

---

## Current Focus

**Sync Feature Plan Completed (Phases 0–7 Closeout)**
The local-first synchronization architecture is fully built, tested, and verified across all 8 phases (Phases 0 through 7) outlined in `plans/sync/sync-plan-phases.md`. Recorded in final closeout [ADR-0125](docs/adr/0125-comprehensive-sync-architecture-closeout.md).

## Sync Phase 7 — Regression & Performance Verification Summary

- **Fast-Path Skip Verification**: Incremental manifest generation on a 350-file vault performs 0 re-hashes when `size` and `mtimeMs` match metadata, completing in < 1.5 ms (`syncRegressionAndPerformance.test.ts`).
- **Large-Vault Three-Way Diff**: 350-item three-way diff classification completes in < 2 ms.
- **Multi-Format Sync & Data Loss Prevention**: Verified text files (`.md`) use line-based `diff3` merge; `.canvas` files use atomic device-named copy resolution (preventing JSON syntax corruption); binary files (`.png`, `.jpg`, `.pdf`) use device-named copies with numeric collision chaining.
- **Editor Responsiveness**: Keystroke latency benchmark (`EditorBenchmark.test.ts`) maintained at < 1.0 ms average transaction time during background reconciliation.
- **Test Suite Results**: All 183 unit, adversarial, stress, and performance tests pass (32/32 in `@app/sync-client`, 151/151 in `@app/desktop`).

## Sync Phase 3 — Drive Manifest Storage, Diff & Transfer Complete

- Implemented per-device manifest storage targeting Drive's hidden `appDataFolder` using `spaces=appDataFolder` via `DriveManifestStore` and `DriveApi`.
- Implemented Changes API delta tracking (`listChanges`) using `startPageToken` and `spaces=appDataFolder`.
- Implemented three-way diff (`classifySyncDiff`) handling push, pull, conflict, and no-op states.
- Implemented content-hash-keyed deduplicated blob transfer (`uploadContent` / `uploadContentBatch`) and safe pulled change application (`applyPulledChanges`).
- All 19 tests in `@app/sync-client` pass.

## Sync Phase 0 — Formal Supersession & Scope Lock Complete

- Superseded [ADR-0008](docs/adr/0008-manifest-diff-sync-not-crdt.md), whose
  server-canonical conflict model no longer describes the intended architecture,
  with [ADR-0116](docs/adr/0116-sync-via-drive-syncthing-no-owned-backend.md).
- The accurate boundary is now two independent modes: client-side Drive
  manifest/file sync and user-owned folder synchronization such as Syncthing.
  There is no backend, relay, server database, hosting cost, or forced shared
  transport abstraction to own or operate.
- Confirmed `services/sync-server` was only an echo/scaffold package, with no
  implementation or CI runtime dependency. Its tracked source/package files
  and generated artifacts are now removed. The lightweight `@app/sync-client`
  package remains as the future client-side implementation and has no server
  dependency.
- No `.github` CI workflow references `services/sync-server`. Stale historical
  planning prose remains in `plans/desktop-app-build.md`,
  `plans/phase-12-performance-audit.md`, and `plans/phase-13-staging-release-1.md`
  and is flagged for a separate planning-doc cleanup; the updated
  `mobile-app-stack-architecture.md` and `git-workflow.md` no longer describe
  an owned sync server.

Sync Phase 1 is unblocked and may proceed against this locked scope.

## Sync Phase 1 — Manifest Infrastructure Complete

- Added shared `ManifestEntry` and offline `generateManifest` infrastructure
  to `@app/sync-client`, including `{ path, hash, size, deviceClock, deleted }`
  entries, metadata for the size+mtime fast path, deterministic ordering, and
  a current-entry filter that excludes tombstones.
- Bootstrap generation hashes every listed file. Incremental generation reuses
  unchanged non-deleted entries when size and mtime match, re-hashes when either
  changes, and preserves deleted entries as Lamport-clocked tombstones.
- Closed the package/persistence and hashing boundary in [ADR-0119](docs/adr/0119-manifest-infrastructure-boundaries.md), following [ADR-0025](docs/adr/0025-js-side-indexer-rust-io-only.md): Rust/platform adapters provide bounded filesystem walking, metadata, and streaming BLAKE3; shared JS owns manifest policy. No network, Tauri, Drive, or Syncthing integration was added.
- JSON snapshots persist through a small platform storage adapter. Missing files become retained Lamport-clocked tombstones; unchanged files use the size+mtime fast path. An explicit `forceRehash` option handles the rare mtime-preserving content edit edge case.
- Verification: 10 sync-client tests passed, including bootstrap, skip/re-hash, tombstones, full rehash, JSON persistence, and a 350-file fixture-scale benchmark. Package typecheck and focused lint passed; Cargo check passed with BLAKE3 1.8.7. Full native fixture execution remains deferred to the desktop runtime adapter.

## Sync Phase 2 — Drive Auth Complete and Verified

- Recorded [ADR-0120](docs/adr/0120-drive-oauth-authentication-and-verification.md),
  incorporating the current Google `drive.file` research: it is non-sensitive
  and per-file; testing supports 100 listed users with seven-day authorizations;
  production still requires policy, brand, domain, and rollout readiness.
- `@app/sync-client` now provides PKCE URL construction, token exchange
  contracts, silent refresh with refresh-token preservation, explicit
  re-authentication on provider invalid-grant errors, retryable transient
  failures, and sign-out through its storage boundary.
- Desktop now provides Google token HTTP exchange/refresh, Web Crypto PKCE,
  loopback callback/state validation, Tauri keyring-backed token storage, and
  a working disconnect command. The requested scope is only `drive.file`; no
  client secret is embedded or requested.
- Settings and the lazy Command Palette now expose Sign in to Drive,
  Refresh Drive Session, and Disconnect Drive actions with clear success/error
  feedback.
- Fixed the OAuth callback wait so the blocking loopback socket accept runs on
  Tauri's blocking task pool; waiting for the browser redirect no longer
  freezes the app UI.
- Replaced the Tauri-webview `window.open` call with a native default-browser
  launcher. Authorization URL validation and launch errors now return to the
  UI instead of failing silently; no additional runtime dependency was added.
- Corrected the Desktop OAuth loopback redirect to Google's required root form
  (`http://127.0.0.1:<port>`, without `/oauth/callback`) and added callback
  parser regression tests.
- Fixed the native endpoint response mapping: Tauri serializes `redirect_uri`
  in snake_case, so the desktop client now reads that field before building the
  authorization URL. This removes the Google `redirect_uri=undefined` failure.
- The OAuth client ID remains local ignored configuration; no client secret is
  stored in the repository.
- Eleven sync-client tests, focused lint/typecheck, Cargo check, and Rust tests
  pass. User-confirmed acceptance verifies interactive sign-in, token presence
  in the OS keychain, restart persistence through refresh, and sign-out
  deletion. No Drive file transfer was added. Desktop-wide typecheck remains
  blocked by the pre-existing `createNoteCrudActions.ts` scope errors.
- Phase 2 re-audit: current Google guidance was rechecked before work; the
  existing implementation still matches Desktop PKCE, external-browser,
  loopback, `drive.file`, and keyring requirements. No duplicate auth code was
  added; user-confirmed E2E acceptance closes the Phase 2 gate.

## Last Session

**Sync Phase 7 Regression & Performance Pass (Sync Plan Completed)**

### Completed
- Built `packages/sync-client/syncRegressionAndPerformance.test.ts` verifying fast-path skip (0 re-hashes on unchanged 350-file vault in < 1.5 ms), large-vault 3-way diff classification (< 2 ms), and multi-format asset handling (`.canvas`, `.png`, `.jpg`, `.pdf`, `.md`).
- Verified editor typing latency benchmark (`EditorBenchmark.test.ts`) is maintained at < 1.0 ms transaction latency during background sync reconciliation.
- Authored final closeout [ADR-0125](docs/adr/0125-comprehensive-sync-architecture-closeout.md) indexing all sync architectural decisions across Phases 0–7.
- Total test suite: 183 / 183 tests pass cleanly (32/32 in `@app/sync-client`, 151/151 in `@app/desktop`).

## Next Up (in order)

1. **Manual Re-Test of OAuth Sign-In**: Execute interactive OAuth sign-in flow and verify consent display shows both `drive.file` and `drive.appdata` permissions, token presence in OS keychain, refresh/restart persistence, and sign-out deletion.
2. **Stabilization pass Phase 1** (`plans/stablize.md`): dogfood all create/rename/delete/duplicate/move paths in a disposable vault.
3. **Dogfooding `v0.1.0-rc.1`** for daily note-taking + canvas workflows together.
4. **Unlinked Mentions Detection**
5. **Inline Property Editing**
6. **Outline Scroll Synchronization**
7. Add success/warning semantic color tokens
8. Chromatic / Playwright screenshot regression
9. Fix `CanvasBenchmark.test.ts` lint

## Blocked / Open Questions

- **Bundle identifier**: Provisional `com.davinci.notes` — confirm before public distribution.
- **Badge success/warning colors**: Placeholder raw hex — need token entries.
- **Visual regression**: Not yet configured.
- **Total JS/CSS size budgets**: lazy chunks counted toward totals — adjust if/when configured.

---

To close a session: update **Last Session** + **Next Up** here, append full details to `docs/HISTORY.md`, and log non-obvious decisions in `DECISIONS.md`.

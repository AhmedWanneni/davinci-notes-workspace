# ADR-0155: Generic Git remotes use HTTPS PATs in the OS keyring

## Status

Accepted

## Context

Phase 3 must establish one remote credential model for GitHub, GitLab,
Bitbucket, and self-hosted Git without creating provider OAuth applications.
ADR-0120 already establishes the project's native secure credential boundary:
Rust's `keyring` crate, backed by the OS credential service. Phase 3 has no
setup UI or push/pull operations.

## Decision

1. The primary model is an HTTPS remote URL plus a personal access token.
   A username is non-sensitive optional configuration for hosts that require
   one; it is not a provider-specific credential path. Phase 5 will supply the
   stored token to the system Git executable's standard HTTPS credential prompt
   mechanism for each network operation, without writing it to Git config.
2. Store PATs only through the existing Rust `keyring::Entry` pattern, under
   the separate `com.davinci.notes.git-remote` service. Its account is a Blake3
   hash of vault path and remote URL, so credentials cannot collide across
   vaults or remotes. There is no web-storage, SQLite, file, or Git-config
   secret fallback.
3. Store only `{ remoteUrl, username }` under the `git.remote.config` settings
   key in `vault-index.db`. Each write is within the existing `withDbLock` and
   `withDbTransaction` boundary; reads use the same queue. No last-synced hash
   exists until Phase 5 has an actual sync operation to record it.
4. SSH support is deferred. Generating a key locally does not complete setup:
   the user must register its public half with the selected provider. This
   multi-step flow belongs with Phase 4's setup UX rather than weakening the
   simple universal HTTPS/PAT path now.
5. Provider recognition is strictly cosmetic. The pure URL detector returns a
   host, help URL, and minimum-scope guidance. It has no import or branch in
   credential storage or Git-operation code; GitHub, GitLab, Bitbucket, and
   self-hosted URLs invoke the same keyring commands and future Git path.

## Verification

- Two distinct URLs (`github.com` and `gitlab.com`) return their respective
  cosmetic help metadata while the same `desktopGitPatStore` Tauri commands
  accept each URL. `rg` confirms `GitRemoteProvider` has no production consumer
  outside the detector itself; it cannot choose a functional Git route.
- The native keyring test confirms different remote URLs and vault paths derive
  different accounts, and rejects a non-HTTPS URL for PAT storage. It reuses
  the same `keyring::Entry` API as `oauth.rs` from ADR-0120. A real system-Git
  `credential fill` test verifies its standard HTTPS `GIT_ASKPASS` mechanism
  receives a PAT without a provider-specific route or network request.
- The remote-config test confirms the sensitive value is absent from the
  serialized SQLite config and the shared transaction queue is used. The
  existing concurrency regression now runs remote-config persistence alongside
  indexing, embeddings, settings, and a queued read, observing a maximum of
  one active database operation.
- No dependency was added. Phase 3 adds no UI or network operation, so it adds
  no initial web bundle path beyond small dormant modules for a later setup UI.

## Consequences

Phase 4 can offer a URL/token setup flow with provider-specific guidance but
without provider-specific authentication. Phase 5 owns actual `git fetch` and
`git push` execution and must use this credential boundary; it cannot add a
second secret store or place a PAT in command arguments or Git configuration.

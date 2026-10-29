# ADR-0239: Git Manager Remote Sync and Keychain Credentials

## Context

Phase 7 requires remote Git operations in the Git Manager panel:
1. Enumerating and updating remotes (`git_manager_get_remotes`, `git_manager_set_remote`).
2. Querying branch tracking ahead/behind counts (`git_manager_get_tracking_status`).
3. Executing network synchronization (`git_manager_fetch`, `git_manager_pull`, `git_manager_push`) with proper timeouts and error classification.
4. Preserving the single secure credential model: Personal Access Tokens stored strictly in the OS Keychain under `com.davinci.notes.git-remote` without logging or leaking tokens into command-line arguments.

## Decision

1. **Remote Configuration & Tracking (`git_manager_remote.rs`)**:
   - `git_manager_get_remotes` parses `git remote -v` outputs for fetch and push URLs.
   - `git_manager_set_remote` handles idempotent remote creation or URL modification (`remote add` vs `remote set-url`).
   - `git_manager_get_tracking_status` calculates upstream commit differentials using `git rev-list --left-right --count HEAD...@{upstream}`.
2. **Synchronous Network Operations with OS Keychain PATs (`git_manager_sync.rs`)**:
   - Reuses `git_auth::get_pat_for_remote` to load stored credentials by `(vault_root, remote_url)` hash.
   - Supplies the token via transient executable askpass scripts (`GIT_ASKPASS`) with `GIT_TERMINAL_PROMPT=0` to guarantee credentials never leak into process arguments, shell history, or stdout/stderr.
   - All network mutations acquire `with_git_lock` to serialize with background auto-versioning.
   - Categorizes failures with `git_remote::classify` into human-friendly diagnostics (`bad-token`, `repository-not-found`, `no-push-access`, etc.).
3. **Dedicated Remote Sync UI & Store (`GitSyncToolbar.tsx`, `useGitSyncStore.ts`)**:
   - Isolates remote synchronization state and actions in `useGitSyncStore` to enforce single responsibility and satisfy file size constraints (< 200 lines).
   - Renders upstream branch tracking badge, ahead/behind indicators (`↑ahead ↓behind`), and one-click Fetch/Pull/Push buttons.
   - Provides clear error dismissal and success confirmations.

## Consequences

- Full remote synchronization without adding external Git network libraries.
- Strict isolation of sensitive PATs within the OS Keychain.
- Zero bundle weight delta when Git Manager is disabled.

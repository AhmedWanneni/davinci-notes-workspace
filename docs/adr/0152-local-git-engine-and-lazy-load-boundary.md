# ADR-0152: Local Git uses the system executable behind an opt-in boundary

## Status

Accepted

## Context

Git Versioning Phase 0 must provide complete local history with no remote and
must impose zero Git-engine bundle or binary cost on users who never enable
Version History. This project targets macOS (arm64 and x64), Linux x64, and
Windows x64 through the desktop release matrix. Phase 0 has no UI or
auto-commit behavior and persists no version state in `vault-index.db`.

## Evaluation

`git2-rs` is viable in isolation but rejected for this feature boundary:

- **Maintenance:** `git2@0.21.0` was published on 2026-05-18. The upstream
  repository has recent June--August 2026 issues and pull requests, so it is
  maintained rather than abandoned. Its current open queue includes native
  portability/build reports, including a Windows long-UNC-path vendored-build
  failure (issue #1255).
- **Toolchain:** an actual release build in this Tauri crate on
  `aarch64-apple-darwin`, Rust 1.97.1, succeeds with `git2@0.21.0` and
  `vendored-libgit2`. The release matrix remains the cross-platform execution
  authority; it runs the same offline Git test on macOS arm64/x64, Linux x64,
  and Windows x64.
- **Measured cost:** the normal release executable was 15,686,544 bytes.
  Forcing a real `git2::Repository::open` call produced 16,331,936 bytes:
  **+645,392 bytes (630 KiB)**. This static native cost is paid by every user;
  a JavaScript dynamic import cannot remove Rust/libgit2 from a shipped binary.
  It violates the Phase 0 zero-cost requirement and `PERFORMANCE.md`'s
  lightweight-first rule.

The fallback is the platform's installed `git` executable invoked through
Rust's standard library. It has no new crate, no vendored native library, no
network capability, and uses Git's well-tested on-disk repository format. Its
tradeoff is that a system without Git receives a clear installation error when
the user enables Version History. No Git command or configuration knowledge is
required from users with Git installed.

## Decision

1. Use the system `git` executable for local operations. Do not add `git2-rs`
   or libgit2 to the shipped application.
2. Version History is opt-in through one clear toggle in Phase 2, defaulting
   off. Enabling it dynamically imports `loadGitVersioning()`, then invokes the
   native initializer. The runtime check is not a static import guarded by an
   `if`: `loadGitVersioning.ts` contains `import("./initializeLocalGitRepository")`.
   Phase 0 intentionally provides no UI caller, so a production build with no
   version-history action emits neither that module nor a Git engine asset.
3. The initializer runs `git init --quiet` for the active vault (or retains an
   existing repository), creates the default `.gitignore` if absent, and never
   configures a remote. It does not create a commit; auto-commit belongs only
   to Phase 1.
4. The generated ignore policy ignores everything except Markdown files,
   recursively. Thus generated `vault-index.db`, embedding data, local caches,
   attachments, and `.gitignore` itself are absent from the staged set; normal
   `git add --all` stages only `*.md` source-of-truth notes.
5. No SQLite database state is read or written in this phase. The
   `withDbLock`/transaction requirement therefore does not apply yet.

## Verification

- Host Tauri toolchain: focused Rust test passed. It creates a fresh vault,
  initializes `.git/HEAD`, confirms `git remote` is empty, and confirms a
  staged set contains only `note.md` (not `vault-index.db` or a settings cache).
- Fully offline: the test invokes only `git init`, `git remote`, `git add`, and
  `git diff --cached`; it has no remote and makes no network operation.
- No-action web build: `rg` finds no Version History adapter/command symbols
  in `apps/desktop/dist/assets`. The largest initial application entry is
  368,090 raw / 116,570 gzip bytes; Git-versioning contribution is **0 bytes**.
- No-action release binary: 15,686,544 bytes. The chosen system-Git engine is
  external, so it contributes **0 bytes** to the binary; only the small Rust
  command adapter remains.

## Consequences

Phase 1 can add debounced, non-blocking local commits through this adapter.
Phase 2 owns the toggle and dynamic import call site. Remote configuration,
credentials, and all network operations remain explicitly out of scope.

# ADR-0232: Git Manager Phase 0 Verification Audit & Architecture Baseline

## Status

Accepted

## Context

The Git Manager feature introduces an opt-in, VS Code / Cursor-style source control interface to Sophia. Before implementing application code, Phase 0 conducts a read-only audit of existing git versioning infrastructure (ADR-0152 through ADR-0155) and runs real-CLI adversarial verification in a scratch vault.

## Verification Audit Results

1. **System Git Performance**:
   - 5,000 notes fixture: `git status --porcelain=v2 -z` completed in **23.99 ms** (budget: < 150 ms).
   - 500 sequential commits: `git log -n 500` completed in **35.34 ms** (budget: < 100 ms).
2. **Adversarial Scenarios Tested**:
   - *Non-repo vault*: `git status` reports `fatal: not a git repository`. Detected via exit code without panic.
   - *Missing Git on PATH*: Caught with `io::ErrorKind::NotFound`, cleanly informing the user to install Git.
   - *External Add / Modify / Delete / Rename*: Porcelain v2 `-z` correctly reports `1 .M`, `1 .D`, and `?` records.
   - *Forced Merge Conflict*: Add/add conflict cleanly generates conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) and porcelain `u AA` records. `git merge --abort` cleanly restores the prior working tree without data loss.
   - *Ignore Policy (`vault-index.db` & attachments)*: Standard `.gitignore` policy (`*`, `!**/`, `!**/*.md`, `!.gitignore`) prevents `vault-index.db*` and a 5 MB binary attachment from being staged by `git add .`.
   - *Unicode, Spaces, Emoji in Paths*: `git status --porcelain=v2 -z` safely parses paths with spaces, emojis, and combining marks (e.g. `Notes/💡 Ideas & Projects/2026 Étude — François & Müller.md`) without octal escaping corruption.
   - *Fetch / Pull / Push Roundtrip*: Verified against a local bare Git repository. Upstream delta calculation correctly identified 1 commit behind; pull reconciled cleanly.

## Decision

1. **Retain System Git CLI**: System Git invoked via `std::process::Command` in `tauri::async_runtime::spawn_blocking` remains the chosen engine. Zero static binary bloat (vs +630 KiB for `git2-rs`).
2. **Porcelain v2 NUL-Delimited (`-z`) Parsing**: All status queries will use `--porcelain=v2 -z` to guarantee safe handling of UTF-8, emojis, and quote-free path characters.
3. **Execution Gate**: Phase 0 audit is complete with a **GO** status. Proceed to Phase 1.

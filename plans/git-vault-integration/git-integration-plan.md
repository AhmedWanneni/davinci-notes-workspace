# Git Versioning & Optional Remote Sync — Build Plan

Target: give every vault a real, local git history — automatic
versioning of the user's `.md` files, browsable and restorable, that
works entirely offline with **zero remote required**. Pushing that
history to a remote (GitHub, GitLab, Bitbucket, or any self-hosted git
server) is a thin, optional, provider-agnostic layer on top — not a
GitHub-specific integration. This app never builds or maintains a
separate OAuth app per provider; one generic credential model (HTTPS +
personal access token, plus optional SSH) works identically everywhere.

**The core feature ships without any remote at all.** A user who never
connects a remote still gets full local version history — undo-proof
note-taking, essentially. Remote sync is additive value for users who
want off-device backup or multi-device sync via their own git host,
consistent with this app's existing "no owned backend" posture (same
principle already applied to Drive/Syncthing).

**UX ease is a first-class requirement for the remote-connection flow
specifically** — the plan should treat "paste a URL and a token, done"
as the bar, not a multi-step OAuth dance repeated per provider.

Read `AGENTS.md`, `DECISIONS.md` (the ADR index) before every session —
open only the specific ADR the index points to as directly relevant, do
not read the full `docs/adr/` directory. Also read `PROGRESS.md` and
`PERFORMANCE.md`. Log new decisions as new ADRs, indexed in
`DECISIONS.md`.

**Standing SQLite requirement:** if any phase persists sync/version
state (last commit hash, remote config, credential metadata) in
`vault-index.db`, every operation must go through the single exported
`withDbLock` queue — never a second queue or connection, lock must
cover the full operation from `BEGIN IMMEDIATE` through
`COMMIT`/`ROLLBACK`, `busy_timeout` initialized before WAL PRAGMAs, and
a concurrency regression test run against indexing and another
concurrent operation before any phase touching this is declared
complete.

---

## Phase 0 — Git Engine & Local-Only Architecture

**Goal**: decide the git engine and confirm the entire feature can work
with zero remote configured — this is the foundation the rest of the
plan builds on.

- Evaluate `git2-rs` (libgit2 bindings): confirm current maintenance
  status, confirm it builds cleanly in this project's Tauri/Rust
  toolchain across target platforms, and log the actual binary size
  impact — weigh this explicitly against `PERFORMANCE.md`'s
  lightweight-first principle, same standard as the Vim package and
  `sqlite-vec` evaluations.
- If `git2-rs` doesn't integrate cleanly, name and evaluate a fallback
  (e.g. shelling out to the user's installed `git` binary) and state the
  tradeoffs explicitly.
- Design the lazy-load boundary for the entire subsystem: a user who
  never enables version history pays zero bundle/binary cost. Prove this
  with a real build-size check, not an assumption.
- Repo initialization: a vault becomes a git repo automatically (or via
  one clear setting toggle) — decide which, and state why. This should
  NOT require the user to know what git is or configure anything to get
  local history working.
- `.gitignore` handling: confirm `vault-index.db` and any other
  generated/non-source-of-truth files (embeddings, local settings cache)
  are excluded by default from what gets committed — the committed
  content must be exactly the plain `.md` files that are the actual
  source of truth.
- Confirm this works fully offline with no remote configured at all —
  this is the state most users will be in most of the time, and it must
  be a complete, first-class experience, not a degraded "remote not
  connected yet" state.

**Checkpoint**: git2-rs (or chosen fallback) confirmed working in the
real Tauri build; lazy-load boundary proven with real numbers; a fresh
vault becomes a working local git repo with no user git knowledge
required; fully offline operation confirmed with no remote configured.

---

## Phase 1 — Automatic Local Version History

**Goal**: notes get versioned automatically as the user works — this is
the core value, and it should require no action from the user beyond
normal editing.

- Decide the commit trigger: debounced auto-commit on save (reference
  the existing file-watcher/debounce discipline already used for
  indexing rather than inventing a new mechanism), a periodic snapshot,
  or both — state the choice and reasoning. Auto-commit is likely the
  right default given the "just works" goal of this phase.
  - Manual "save a version now" as well, giving the user an in the
    moment control point too
- Commit message generation: since users aren't writing git commit
  messages, generate sensible default messages (e.g. which note(s)
  changed, or "Auto-save" with a timestamp) — this is not user-facing
  friction, it's internal bookkeeping that surfaces later in Phase 2's
  history UI.
- Confirm auto-commit never blocks typing or editor responsiveness —
  construct the adversarial test already standard in this project: a
  large paste or rapid sequence of edits, measure actual input latency
  during commit creation, not a felt impression.
- Decide commit granularity: one commit per changed file, or a batched
  commit across multiple files changed close together in time (e.g.
  during a bulk edit session) — state the choice, since this affects how
  useful and readable Phase 2's history view will be.

**Checkpoint**: editing and saving notes produces real commits
automatically, verified directly against the actual git log, not
assumed; auto-commit confirmed non-blocking under the adversarial
large-edit test with real latency numbers; commit granularity decision
stated and justified.

---

## Phase 2 — History & Diff UI (Fully Usable With Zero Remote)

**Goal**: let the user see and act on their local version history —
this delivers real value on its own, independent of anything in later
phases, and should be built and shippable before remote sync exists at
all.

- Per-note history view: given the currently open note, show its commit
  history (auto-generated message, timestamp) — reuse existing
  design-system list/panel primitives.
- Diff view: a readable, line-level diff between two versions of a note
  (not a raw git diff dump) — check whether an existing diffing approach
  already used elsewhere in the app fits before adding a new dependency,
  weighed against `PERFORMANCE.md`.
- Restore a previous version: decide explicitly whether this creates a
  new commit (safe, preserves the fact a restore happened) versus a hard
  reset (destructive) — state the choice; the safe option is almost
  certainly correct here given how casually a user might browse history.
- Make this genuinely discoverable — a right-panel entry or similar,
  consistent with how backlinks/outline are already surfaced, not a
  hidden command-palette-only feature.

**Checkpoint**: history view shows real commits from the actual local
git log; diff view is readable and correct against real content;
restoring a version works correctly and is verified against actual file
content after restore; the feature is fully functional and useful with
zero remote configured.

---

## Phase 3 — Generic Remote Credential Model

**Goal**: design one credential mechanism that works identically across
GitHub, GitLab, Bitbucket, and any self-hosted git server — no
per-provider OAuth app, no per-provider special-casing beyond cosmetic
help text.

- **Primary path: HTTPS remote URL + personal access token (PAT).** This
  is the one model that works uniformly across every git host without
  building a distinct OAuth integration per provider — the user pastes a
  repository URL and a token, this app stores the token securely and
  uses it for HTTPS git operations. This is the mechanism to optimize
  the UX around, since it's the path every user will take regardless of
  provider.
- **Secondary/optional path: SSH key.** Decide whether to support this
  in v1 or defer it — SSH avoids ongoing token management for the user
  but adds real setup friction (generating a key, copying the public key
  to the provider's settings). If included, this app can generate the
  keypair itself and present the public key with a one-click copy, but
  the user still has to go add it to their provider account manually —
  state clearly that this is inherently a multi-step flow no matter how
  polished, unlike the token path.
- **Provider auto-detection is cosmetic only, not architectural.**
  Detect `github.com` / `gitlab.com` / `bitbucket.org` (or a self-hosted
  pattern) from the pasted URL purely to tailor help text and a direct
  link to that provider's "create a token" page — this app does not
  register as an OAuth application with any of them, and should not
  need updates when a provider changes their OAuth policies.
- Token storage: reuse the exact secure-storage pattern already built
  for Drive's OAuth tokens (OS keychain via Tauri's stronghold/keyring
  plugin) — do not build a second, less secure mechanism.
- Token scope guidance: the help text for each detected provider should
  point the user toward the minimum necessary scope (e.g. a fine-grained,
  repo-scoped token on GitHub rather than a classic all-repo token) —
  this app can't enforce scope choice the way an OAuth app with
  fine-grained permissions could, so guidance in the UI copy is the
  mitigation; state this tradeoff explicitly in the ADR.

**Checkpoint**: a single credential mechanism (HTTPS + PAT) is designed
and confirmed to work identically regardless of which provider's URL is
pasted; provider detection confirmed cosmetic-only (no code path
actually branches on provider beyond help text/links); token storage
reuses existing secure infrastructure.

---

## Phase 4 — Easy Remote Setup UX

**Goal**: this is where "too easy" gets built — the actual connection
flow, held to a genuinely low-friction bar regardless of provider.

- The full flow, target-state: user pastes a repo URL → app detects the
  provider from the URL and shows a direct link + one-line instruction
  for creating a token there → user pastes the token → app validates it
  immediately with a real lightweight request (not just accepting it
  blindly) → connected.
- Validate the token/URL combination at entry time with a real check
  (e.g. attempt a lightweight remote operation like a ref listing)
  rather than only discovering it's wrong on first push — surface a
  clear, specific error immediately if it fails (bad token, wrong URL,
  repo doesn't exist, no push access).
- If Phase 3 included SSH support, the setup flow for that path should
  be equally considered: generate the key, show it with a copy button
  and the provider-specific "add an SSH key" link, and clearly indicate
  the flow isn't complete until the user confirms the key was added
  (e.g. a "test connection" button rather than assuming success).
- First-push consideration: if the target repo is empty, the first sync
  should push the vault's existing local history cleanly; if the repo
  already has content, decide how that's handled (merge, or require an
  empty repo for the initial connection) — state the choice, since a
  non-empty remote on first connect is a real edge case worth deciding
  deliberately rather than discovering as a bug later.

**Checkpoint**: the connection flow, timed and walked through as a real
first-time user would, takes only pasting a URL and a token to reach a
working connection — verify this literally, don't assume the design
achieves it; token/URL validation confirmed to fail clearly and early on
bad input, not silently or only at first push.

---

## Phase 5 — Push & Pull Mechanics

**Goal**: wire the generic remote from Phases 3-4 to real push/pull
operations, on top of the local commit history from Phase 1.

- Push: send local commits to the configured remote using the stored
  credential; handle push rejection (remote has commits the local repo
  doesn't) by triggering a pull/merge path rather than surfacing a raw
  git error.
- Pull: fetch and merge remote changes into the local vault; confirm the
  existing file watcher correctly picks up files changed by the pull, so
  the editor/UI reflects pulled changes without requiring a manual vault
  reload.
- Authentication/network failure handling: expired or revoked tokens,
  and plain network failures, must each surface a clear, specific error
  — not a generic git error — consistent with the AI features plan's
  key-failure handling standard.

**Checkpoint**: a real push-pull round trip works between two separate
local vault instances connected to the same remote, verified directly —
edit a note in instance A, push, pull in instance B, confirm correctness
and that the editor reflects the change without a manual reload.

---

## Phase 6 — Conflict Resolution

**Goal**: handle the same note being changed on two sides before
syncing. **This phase stays in one session, no plan/execute split** —
same treatment as the original sync plan's conflict-resolution phase and
canvas's security phase.

- Decide the conflict policy explicitly: reuse the existing Drive/
  Syncthing policy if it transfers cleanly to git's merge model, or
  build a distinct one and state why.
- Raw git conflict markers left inside a `.md` file are not an acceptable
  end state for this app's users — decide whether conflicts get a
  dedicated resolution UI (both versions shown side by side) or are
  resolved automatically with the losing version preserved as a backup,
  and state why.
- Construct the actual adversarial test: edit the same note differently
  on two vault instances, sync both, report the actual resulting state
  precisely — which content won, where the other version is preserved,
  confirm no silent data loss.

**Checkpoint**: the conflict scenario is verified with a real constructed
test; no silent data loss under any tested scenario; the resolution path
is something a non-technical user could act on, not raw conflict
markers.

---

## Phase 7 — Push/Pull UI & Sync Status

**Goal**: the everyday-use surface for remote sync, once connected.

- Manual "Push" and "Pull" actions, reachable from wherever this app's
  established UI conventions put similar actions (status bar, icon
  rail).
- Decide manual-only vs. auto-push-on-commit for remote sync specifically
  (distinct from Phase 1's local auto-commit decision) — state the
  choice, since auto-pushing to a remote is a different risk profile
  than auto-committing locally (e.g. network usage, exposing
  half-finished edits sooner).
- **Persistent sync status indicator** with at least three distinct
  states: fully synced with remote / local commits pending push /
  conflict needs attention — plus an active-transmission state during a
  real push/pull. One generic "connected" icon is not sufficient, same
  standard as the AI features plan's cloud-active indicator.
- Failed sync (auth expired, network down) stays visibly flagged until
  resolved, not just a toast that disappears.

**Checkpoint**: manual push/pull work correctly from the UI; all status
states verified by constructing each directly; a failed sync remains
visibly flagged rather than silently disappearing.

---

## Phase 8 — Settings & Remote Management UI

**Goal**: the settings surface for connecting, reconfiguring, and
disconnecting a remote.

- Connect/reconfigure a remote using Phase 4's flow, reachable from
  settings at any time (not just a one-time first-run prompt).
- Disconnect: clearly separate "stop syncing to remote" (remove the
  remote/credential, keep local git history and files intact) from
  anything more destructive — confirm disconnecting never touches local
  history or vault content.
- Show current connection state clearly: which remote, when last synced,
  and a way to re-enter credentials if a token has expired or been
  revoked externally.
- Follow `AGENTS.md`'s component rules: colocated styles, Storybook
  story per state (including invalid-token and disconnected/needs-
  reauth states), test coverage in the same PR.

**Checkpoint**: connect/reconfigure/disconnect all verified against real
state changes, not assumed; disconnect confirmed to never affect local
history or files; re-authentication verified against a real expired/
revoked token scenario.

---

## Phase 9 — Performance & Regression Pass

**Goal**: confirm the whole subsystem (local versioning + optional
remote) respects the lightweight-first principle and doesn't degrade
anything already built.

- Confirm the entire subsystem is lazy-loaded appropriately: local
  version history is presumably always-on (it's the core feature), but
  remote-sync-specific code (credential UI, push/pull, provider-detection
  help text) should still be lazy-loaded until a remote is actually
  configured — state this boundary precisely, since it's more nuanced
  than the AI features' fully-optional lazy-load case.
- Confirm auto-commit (Phase 1) and push/pull (Phase 5) never block the
  editor under realistic load — construct the adversarial case: heavy
  editing while a push/pull is in progress, measure actual input
  latency.
- Re-run Phase 6's conflict adversarial test end-to-end as a real user
  would encounter it.
- Confirm no regression to, and no interference with, the existing
  Drive/Syncthing sync path — this app can now have two independent sync
  mechanisms active on the same vault; state explicitly how collisions
  (both mechanisms reconciling the same file around the same time) are
  prevented or handled.
- Update `PROGRESS.md` with a closing summary; confirm every decision
  across Phases 0-9 is logged as its own ADR in `DECISIONS.md` — audit
  for completeness, don't write one combined mega-ADR.

**Checkpoint**: full regression sweep passes; lazy-load boundary for
remote-specific code confirmed with real numbers; conflict handling
verified end-to-end; Drive/Syncthing and git-remote sync confirmed not
to collide if both are active.

---

## What's Deliberately Out of Scope

- **Per-provider OAuth apps (GitHub App, GitLab App, Bitbucket App)** —
  explicitly rejected in favor of one generic HTTPS+PAT credential model;
  revisit only if a specific provider's fine-grained permission model
  becomes a strong enough user-facing win to justify maintaining a
  dedicated integration.
- **Branch management** (switching branches, working on non-default
  branches) — v1 syncs against a single branch; multi-branch workflows
  are a real feature but not needed for core versioning + sync.
- **Real-time collaborative editing** — git sync is inherently
  asynchronous; that would be a fundamentally different feature.
- **Submodules, LFS, or binary-attachment-specific git handling** — if
  the separately-planned attachments feature needs special handling for
  large binary files in git, that's a follow-on consideration.
- **Self-hosted git server-specific features** (e.g. GitLab CI
  integration, Bitbucket pipelines) — this plan covers plain git
  push/pull only, not platform-specific tooling.

---

## Sequencing Notes

- **Phases 0-2 (engine, auto-commit, history UI) deliver the core
  feature with zero remote involved** — this should be treated as a
  complete, shippable unit on its own. Don't let remote-sync work in
  Phases 3+ block or delay shipping local version history, since it's
  independently valuable and lower-risk.
- **Phase 3's "cosmetic-only" provider detection is the key architectural
  discipline of this plan** — if a session starts building
  provider-specific code branches beyond help text and links, that's
  scope creep back toward the per-provider integration model this plan
  explicitly avoids. Flag it if it happens.
- **Phase 4 is where "too easy" either gets earned or doesn't** — hold
  this phase to a literal, walked-through first-time-user test, not a
  design description of ease.
- **Phase 6 (conflict resolution) deserves the same single-session,
  no-split treatment** as the original sync plan's conflict-resolution
  phase — real-stakes correctness, not mechanical execution.
- **Phase 9 explicitly checks for interference with the existing Drive/
  Syncthing sync path** — this plan introduces a second independent sync
  mechanism into an app that already has one; don't assume they're
  naturally independent without checking.
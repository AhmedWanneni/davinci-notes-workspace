# ADR-0178: Closed-app clip queue and drain-on-launch with dedupe

## Status

Proposed (needs owner input, see "Open decisions"). Draft only; no code.

## Context

"One click saves the page" must not require the desktop app to be running. Per
the product goal, clips captured while the app is closed should be delivered on
the next launch. Because the extension is the only party that exists while the
app is closed, the queue lives in the extension
(`chrome.storage.local`), and the desktop keeps only what it needs to stay
idempotent.

Constraints:
- PERFORMANCE.md rule 9: no continuous polling, ever. A retry timer is not
  allowed.
- A clip must never be silently lost, and must never be written twice.
- Extension storage is not unlimited; the queue must be bounded with a visible
  count.
- The reference clipper's delivery relies on the app being able to receive
  (Obsidian docs: the app must be running/openable); it does not document an
  in-extension queue — so this is our own design, and owner input is requested.

## Options

### Retry trigger

1. **Event-driven drain** (recommended): attempt delivery when (a) the browser
   starts, (b) the popup opens, (c) the user clicks "Sync queued clips", and
   (d) a wake handshake succeeds. No timers.
2. Background timer: rejected — violates rule 9 and burns battery.

### Dedupe key

1. `clipId` only — simplest, but a retried-at-different-time re-clip would be a
   distinct id.
2. `clipId` + `contentHash` (recommended) — catches both exact replays (same id)
   and accidental double-clips of identical content target.
3. Content hash only — rejected: two intentionally identical notes (e.g. two
   quotes) would be wrongly suppressed.

## Decision (recommended)

- **Queue location:** extension `chrome.storage.local`, one record per clip
  (`ClipPayload` + `attempts` + `queuedAt`). The desktop keeps a persisted
  ring buffer of recently-written `clipId`s (bounded, e.g. last 500) at
  `app_config_dir` for the idempotency check — it is a dedupe ledger, not a
  second note store.
- **Bounds:** 200 clips / 5 MB total / 30 days, oldest-first eviction, with the
  pending count and a clear-all action shown in the popup. Eviction must be
  visible, not silent.
- **Drain:** event-driven only (browser start, popup open, explicit user action,
  successful wake). Attempt order oldest-first; a bounded number of attempts per
  event with exponential backoff **between events**, never a timer.
- **Delivery protocol:** the extension `POST`s the clip; the desktop returns
  `written` / `duplicate` / `rejected`. The extension removes the record only on
  `written` or `duplicate`. On `rejected`, the record is kept and the reason is
  surfaced to the user (e.g. `vault-not-open`).
- **Idempotency:** the desktop checks `clipId` against its ledger and the
  `contentHash` + resolved target path before writing; a match returns
  `duplicate` with the existing path and writes nothing.
- **Wake:** when the app is closed, the extension fires `davinci://clip/wake`
  (ADR-0173) to launch it, then retries; if the user has the app closed by choice
  and no launch happens, records stay queued.

**DB concurrency requirement (verbatim, applies to the drain because drained
clips are written and indexed):**

> Any step that touches vault-index.db must follow the standing withDbLock/WAL concurrency rules.

## Consequences

- Clips survive a closed app without a timer and without a background daemon.
- Duplicate suppression is a real ledger with a bound; the ledger write is in the
  app config dir, not the vault (so it is not synced and not indexed).
- `vault-not-open` becomes a first-class, user-visible state rather than a silent
  wrong-vault write (ties to open decision O4).
- The queue adds storage pressure to the browser profile; the cap must be enforced
  and tested, not assumed.

## Performance cost

- Idle: zero (no timers, no polling). The service worker is event-woken only.
- Drain: bounded by the caps; each delivered clip is one request + one write.
- Storage: ≤ 5 MB in the browser profile by policy.

## Open decisions

- O6: confirm the caps (200 / 5 MB / 30 days) and oldest-first eviction.
- O4: confirm the v1 multi-vault rule ("clip into the currently open vault;
  otherwise `vault-not-open` and keep queued").

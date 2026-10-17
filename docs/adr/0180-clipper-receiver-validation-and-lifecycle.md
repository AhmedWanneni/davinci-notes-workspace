# ADR-0180: Clipper receiver core — reject rather than re-sanitise, and the listener's shape

## Status

Proposed (owner input not required for the mechanics below; the open decisions in
ADR-0173/0177/0178 still apply). Implemented in Phase 3, part 1.

## Context

Phase 3 of `web-clipper-feature-plan.md` is the desktop receiver: an authenticated
loopback route that validates a hostile `ClipPayload` and hands it to the webview
to write (ADR-0177). The plan labels the phase HIGH-RISK/ATOMIC, but the load
bearing security work — validation, authentication, request parsing — is
independent of the write path, the Settings UI and the extension transport, and is
where almost all of the attack surface is. This session therefore built the Rust
core and left the listener **inert** (nothing in the product starts it yet).

Building it surfaced several decisions that are not obvious from the plan. They
are recorded here rather than scattered through the code.

## Decision

### 1. The desktop re-validates and **rejects**; it never re-sanitises

`packages/clipper-core/safeName.ts` turns untrusted text into a safe path segment;
the extension applies it, so a `ClipPayload`'s `target.folder` and
`target.noteName` arrive already normalised. The desktop runs the *same* rules in
Rust (`clipper_name_rules.rs`) and compares the result to the input:

- equal → accept;
- not equal → reject with `invalid-path`.

The plan's adversarial check 1 expects exactly this (`noteName = "../../etc/x"` →
`invalid-path`, nothing written), and it is the better behaviour: re-sanitising
would silently write a *different* name than the user saw, and a clip whose names
are not already normalised is either a bug or an attack. Both sides therefore agree
by construction — the extension's own output is the fixed point of the
normalisation, so it always passes (`clipper_validate_tests` pins the vectors in
both directions: legitimate output accepted, hostile input rejected).

The Rust port is deliberately literal, including the parts that look odd:
`stripControlCharacters` removes a TAB (0x09 ≤ 0x1f) rather than collapsing it, so
`"a\tb"` becomes `"ab"`; truncation counts UTF-16 units, as JS `slice` does.

The one deliberate divergence: `safeName` also applies Unicode NFC, and Rust's std
cannot. A normalisation crate is a new dependency for no security gain (composition
cannot introduce a separator), so the Rust side is NFC-agnostic. Consequence: a
non-NFC name that is otherwise safe is *accepted* by the desktop; it cannot escape
the vault.

### 2. Error codes separate "too big" from "wrong shape"

- **413 / `too-large`** — a size or count bound: request body, header block,
  property count, tag count, highlight/attachment count, field length.
- **422 / `invalid-path`** — `folder`/`noteName` is not an already-normalised,
  vault-confined path.
- **422 / `invalid-payload`** — anything else malformed or hostile: version, mode,
  behaviour, empty ids, reserved property names, control characters.
- **403** for a bad `Host`/`Origin`, **401** for a bad token, **404**/**405** for
  the wrong route/method, **400** for unparseable JSON, **409** for
  `vault-not-open`, **503** for `app-busy`.

This is a small deviation from the plan, which lists `400`/`413` for an oversized
properties map; 413 is used for every size/count breach so one code covers them.

### 3. Host and Origin are hardening; the token is the boundary

`Host` must be **exactly** `127.0.0.1:<port>` — `localhost` and `127.0.0.1.evil`
are refused, which is the DNS-rebinding defence. An `Origin` header, when present,
must be an extension origin (`chrome-extension://`, `moz-extension://`); a foreign
origin is refused. An absent `Origin` is allowed and falls through to the token
check, because a browser fetch may omit it while `curl` never sends it — and a
non-browser client can forge `Origin` anyway, so it can only ever be defence in
depth. No CORS headers are emitted: the extension is expected to hold a narrow
`http://127.0.0.1/*` host permission (an extension-side change, ADR-0173).

### 4. The listener is inert until enabled, and stops without polling

Nothing binds until `clipper_enable` runs, so the disabled cost is zero — no
socket, no thread (PERFORMANCE.md rule 9). Port `47912` is preferred (below the
ephemeral range, so it is not recycled) with a fallback to an ephemeral port, and
the bound port is reported back for pairing. `accept()` blocks; stopping sets a
flag and wakes the thread with **one throwaway connection** rather than polling a
timeout. Rotation swaps the token the listener compares against in memory, so a
revoked token stops working immediately with no keychain read per request
(adversarial check 9).

### 5. Rust never writes; it asks the webview and waits

Per ADR-0177 the write path stays canonical. The listener emits
`clipper:clip-received` to the main window and blocks on a channel keyed by
`clipId`, which the webview completes through `clipper_submit_result`, so the HTTP
response carries the *real* outcome. The wait is bounded (20 s); on timeout the
response is `app-busy` and the clip stays in the extension queue (ADR-0178), so a
timeout is never data loss. The handshake is behind a `ClipDispatcher` trait, which
is what lets the attack matrix run against a recording dispatcher instead of a
webview.

### 6. Two already-vendored crates, no new dependency class

`constant_time_eq` (0.4.2, already compiled via `blake3`) replaces a hand-rolled
comparison that a compiler is free to optimise into an early exit; `getrandom`
(0.2.17, already in the lockfile) provides the token's 256 bits of OS randomness.
Both resolve to versions already built, so the binary delta is zero. No HTTP
framework, no URL parser: the request reader is ~90 lines and enforces the caps
the existing `oauth.rs` reader does not.

### 7. `clipper_*` is nine focused modules, not the plan's three

The plan named `clipper_server.rs`, `clipper_auth.rs`, `clipper_validate.rs`. The
250-line hard cap and one-responsibility-per-file split them further:
`clipper_payload.rs` (wire types), `clipper_name_rules.rs` (the `safeName` port),
`clipper_validate.rs` (bounds/shape), `clipper_http.rs` (capped read/write),
`clipper_routes.rs` (the route and its checks), `clipper_dispatch.rs` (the
webview handshake), `clipper_server.rs` (lifecycle/state), `clipper_auth.rs`
(token trait + keychain), `clipper_commands.rs` (the Tauri commands). Largest file
243 lines. Tests live in four `*_tests.rs` files plus a shared
`clipper_test_harness.rs`.

## Consequences

- The receiver is a complete, tested, **inert** unit: `clipper_enable` is the only
  way to start it, and no UI calls it yet, so the shipped risk is unchanged.
- The attack matrix (plan §5 checks 1–4 and 9) runs over real loopback sockets
  against the real route handler: 32 Rust tests, `cargo test` clean apart from one
  pre-existing `git_auth` failure that shells out to system `git`.
- Not covered by tests, and named as such in the code: the emit-and-await
  handshake's happy path needs a live webview; the idle RSS/CPU delta and
  "unreachable from the LAN" need a running GUI and a second host — both
  owner-local.
- An oversized request may be answered with a connection reset rather than the 413
  body, because the server refuses to drain hostile input rather than buffering it.
  The extension treats a reset as a failed attempt and keeps the clip queued.
- `duplicate` and `vault-not-open` exist in the wire types but no Rust code
  produces them yet; dedupe is ADR-0178's (Phase 7).

## Open decisions

- Whether `clipper_status`/`ack` shapes are the final Settings API (O5 pairing UX).
- Whether the exact-`Host` rule should also accept `localhost:<port>` (rejected
  today, matching the plan).
- The 2 MiB body cap and the per-field caps in `clipper_validate.rs` are chosen,
  not owner-approved; the plan leaves the page-size cap to the owner.

# ADR-0173: Web Clipper transport — extension → desktop app

## Status

Accepted.
Both halves are implemented: the loopback listener in Rust and the extension client. The deep-link leg remains deferred in favor of loopback + manual pairing with offline queue (ADR-0178).

## Context

The browser extension must hand a clip to the desktop app. The transport has to
work when the app is open, degrade to a queue when it is closed, target the right
vault, run on macOS/Windows/Linux, and never become a local write primitive for
anything unauthenticated.

Documented reference behavior (Obsidian docs, "Troubleshoot Web Clipper"): the
reference clipper delivers over the `obsidian://` URI scheme and, by default,
passes the bulk of the content through the **clipboard**; its "Legacy mode"
"bypass[es] the clipboard and save[s] content directly via URI. Note that this
will limit the number of characters that can be clipped." That documents a hard
URL-length ceiling for the deep-link-only path and confirms the reference uses a
handshake-plus-out-of-band-payload shape.

Constraints in this repo:
- The desktop app already runs a loopback `TcpListener` for the OAuth PKCE flow
  (`apps/desktop/src-tauri/src/oauth.rs`), so a loopback listener is an
  established, in-tree pattern with no new dependency class.
- `tauri-plugin-deep-link` exists for Tauri v2. The docs state it "requires a
  Rust version of at least 1.90"; `apps/desktop/src-tauri/Cargo.toml` pins
  `rust-version = "1.77.2"`. macOS cannot register schemes at runtime, and
  desktop deep links only fire for an installed/bundled app.
- PERFORMANCE.md: the app must add **zero idle cost** when the feature is off.

## Options

### Option 1 — Deep link only (`davinci://clip?...`)

- Pros: no server, no port, no auth store; the OS launches the app when it is
  closed (a real advantage for the closed-app case); smallest surface.
- Cons: OS/URL length ceilings make it unusable for full articles (this is exactly
  the documented limitation of the reference's legacy mode); any web page can
  navigate to `davinci://…`, so a payload carried in the URL is attacker-supplied
  input that could request a write; on Linux/Windows it arrives as argv to a new
  process (needs single-instance); macOS schemes are install-time only.
- Verdict: acceptable only as a wake/handshake, never as the payload carrier.

### Option 2 — Loopback-only HTTP server (127.0.0.1, fixed or random port, token)

- Pros: payload size is bounded by our own cap, not by URL limits; a bearer token
  gives real authentication; strict Origin/Host checks are enforceable; content
  never appears in a URL (no history/argv/log leakage); the write path is a single
  authenticated request.
- Cons: holds a bound port and a listener thread; the extension must discover the
  port and obtain the token (needs pairing); when the app is closed there is
  nothing to talk to, so it cannot launch the app by itself.
- Verdict: correct payload carrier; needs a wake path for the closed-app case.

### Option 3 — Browser Native Messaging host

- Pros: strongest browser-level permission model; no port; the host is spawned by
  the browser with a stable stdio protocol.
- Cons: requires installing a native host manifest in per-OS, per-browser,
  per-channel paths (macOS `~/Library/Application Support/<browser>/NativeMessagingHosts/`,
  Windows registry keys under `HKCU\Software\…\NativeMessagingHosts`, Linux
  `~/.config/<browser>/NativeMessagingHosts/`), with a new binary and an installer
  step; IDs must be allowlisted per browser; a browser extension cannot install
  it alone; Chrome uses strict 4-byte length-prefixed framing. This is a second
  distribution and update mechanism.
- Verdict: defer. Revisit only if loopback proves unreliable on a target OS.

### Option 4 — Hybrid: deep link as wake/handshake, payload over loopback

- Pros: combines the strengths — the deep link launches/wakes the app (closed-app
  case) but carries **no content** (so the URL ceiling and the arbitrary-page
  attack do not apply); the payload travels once over loopback with a token;
  idle cost is zero when the feature is off and one blocked `accept()` when on;
  no new native binary or registry keys.
- Cons: two mechanisms to keep correct; pairing still needs a user-visible step or
  a short pairing window; macOS scheme registration/testing caveats.
- Verdict: recommended.

## Decision (recommended)

**Option 4**, with the deep-link leg **optional and deferred** as of Phase 3
(part 1). What is built today is the loopback carrier, which every variant needs:
`POST /clipper/clip` on a `127.0.0.1` loopback listener, per-install token in the
OS keychain, constant-time compare, exact `Host` check, `Origin` check, 2 MiB cap.
Deep link `davinci://clip/wake?nonce=<random>` — if taken later — is a *wake and
pairing handshake only*; it never carries clip content. The clip payload is
`POST`ed to a loopback-only listener.

- Listener binds `127.0.0.1` on a fixed, per-install port; started **only** when
  the user enables the Web Clipper (zero cost otherwise).
- Auth: a per-install random token, stored in the OS keychain using the ADR-0120
  `keyring::Entry` pattern, compared in constant time. Every route except the
  short-lived pairing window requires `Authorization: Bearer <token>`.
- Pairing: either (a) the user copies the token from Settings into the extension,
  or (b) the extension opens `davinci://clip/wake?nonce=…`, the app opens a 60 s
  pairing window, and the extension `POST`s the nonce to `/clipper/pair` to
  receive the token. Both are offered; owner picks the default (O5). Only (a)
  exists until the deep link is added.
- The extension posts to loopback. If the app cannot be reached, it queues
  (ADR-0178) — so the missing deep link costs the "one click launches the app"
  convenience and nothing else.

## Phase 0 verification outcome

The check `PROGRESS.md` required before Phase 3 was run, and it produced a
concrete answer.

| Fact | Result |
|---|---|
| Declared MSRV | `apps/desktop/src-tauri/Cargo.toml`: `rust-version = "1.77.2"` |
| Installed toolchain | `rustc 1.97.1` (aarch64-apple-darwin) — the pin is declarative, not enforced locally |
| `tauri-plugin-deep-link` v2 latest | **2.6.2, `rust-version = "1.90"`** |
| Last deep-link release fitting `1.77.2` | **2.4.10** |
| `tauri-plugin-single-instance` v2 latest | 2.5.4, `rust-version = "1.90"` (2.5.0–2.5.4 all need 1.90) |
| Newest deep-link overall | `3.0.0-alpha.3`, `rust-version = "1.95"` (Tauri 3 line) |
| `keyring = "3.6.2"` | already in the tree (OAuth precedent) |
| Loopback precedent | `apps/desktop/src-tauri/src/oauth.rs` (`TcpListener`, `keyring::Entry`) |

Two further constraints were confirmed from the plugin documentation rather than
tested: macOS cannot register a URL scheme at runtime (it must be in
`tauri.conf.json`, so the scheme is install-time only), and desktop deep links
only fire for an installed/bundled app.

**Conclusion.** Taking the deep link costs either a declared MSRV bump
(1.77.2 → 1.90 across the workspace) or a pin to the older 2.4.10 line, plus a
macOS bundled-app caveat — in exchange for a launch convenience that ADR-0178's
queue already makes non-critical (a clip taken while the app is closed is queued
and drained on next open; no clip is lost either way). The loopback carrier is
required under *every* option, so building it first wastes nothing and the deep
link remains addable later behind the same route.

**Chosen:** loopback-only + manual pairing. `tauri-plugin-deep-link` and
`tauri-plugin-single-instance` are **not** added; the declared MSRV stays
`1.77.2`; O1's deep-link leg stays open for a later session.

## Implementation outcome (Phase 3 part 3 — the extension half)

The browser side of the same protocol, built in `apps/web-clipper`. What landed:

| Piece | Where | Behaviour |
|---|---|---|
| Request | `src/transport/postClipToDesktop.ts` | `POST http://127.0.0.1:<port>/clipper/clip`, `Content-Type: application/json`, `Authorization: Bearer <token>`, body = the `ClipPayload` JSON |
| Result | same | A failure is a **value**, never a throw: `{delivered:true,path?}` or `{delivered:false,reason}`. `reason` is the app's own `ClipError` vocabulary plus `not-paired` / `unreachable` / `timeout` / `queued` |
| Status → reason | same | Binds the ack body first (it is a `ClipAck`, error included), then falls back to the status: 400 `invalid-payload`, 401/403 `unauthorized`, 409 `vault-not-open`, 413 `too-large`, 422 `invalid-path`, 503 `app-busy`, anything else (404/405/5xx) `unreachable` |
| Correlation | same | The ack is trusted only when it names the sent `clipId` **or names none**: Rust deliberately sends `clipId: ""` for refusals that happen before the body parses, and those still carry the error code |
| Ceiling | same | 15 s abort (`CLIPPER_REQUEST_TIMEOUT_MS`), plus a client-side 2 MiB pre-check mirroring `clipper_validate::MAX_BODY_BYTES`, so an oversized clip is not built and sent to be refused |
| Pairing | `src/pairing/pairingStore.ts` | `clipper.pairing` = `{port, token}` in `browser.storage.local`. The port must be an integer 1–65535 and the token non-empty, else the entry reads as **unpaired**; nothing is repaired or guessed |
| Pairing UI | `entrypoints/options/` + `src/components/PairingPanel/` | The extension's options page: port + token fields, save, forget. The app's Settings section shows the same two values |
| Popup | `src/popup/clipSessionDeps.ts`, `useClipSession.ts`, `components/ClipPopup/` | "Add to DaVinci Notes" is enabled only while paired; success reports the path the app wrote, failure shows `describeDeliveryFailure(reason)` and keeps the clip, the form and the `.md` download |

Three consequences worth recording:

1. **No queue yet (ADR-0178 is Phase 7).** A clip that cannot be delivered is
   reported and kept on screen, never silently dropped into a buffer that does
   not exist. A `queued` ack — which Rust cannot send today — is surfaced as
   "not sent" rather than as success.
2. **CORS is not handled on either side**, as decided. The extension holds
   `host_permissions: ["http://127.0.0.1/*"]`, so Chromium exempts the request
   from CORS and does not preflight it; the desktop's `Origin` check accepts
   `chrome-extension://` and skips the check entirely when no `Origin` is present.
   Which of those two the browser actually sends is **owner-local verification**:
   jsdom cannot produce it, and the host permission is `http://127.0.0.1/*` in the
   manifest, so no other host is reachable. Because the request URL — not a
   header we set — determines `Host`, the browser always sends exactly
   `127.0.0.1:<port>`, which is what the desktop's exact-match rule expects.
3. **Manual pairing is what exists.** There is no discovery, no handshake, no
   nonce window: the user reads the port and token off the app's Settings panel
   and types them once. O5 is still open on whether that stays the default.

## Consequences

- One cross-boundary protocol, authenticated, with the payload out of any URL.
- Fallback if `tauri-plugin-deep-link` cannot be used with the pinned Rust
  toolchain: loopback-only + manual pairing (the app cannot auto-launch). The
  architecture survives; only the "app closed → one click launches it"
  convenience is lost. **This is the path taken** (see "Phase 0 verification
  outcome").
- Rejected Native Messaging keeps distribution to two channels (desktop app +
  extension store), not three.
- The deep link, if ever added, brings `tauri-plugin-deep-link` and
  `tauri-plugin-single-instance` as Rust dependencies; their binary delta must be
  measured (ADR-0152 precedent), not assumed. Nothing is added today.
- The extension needs a narrow `http://127.0.0.1/*` host permission to `fetch`
  the loopback route without CORS. **Added in Phase 3 part 3**: it is the
  extension's only host permission, covering the app's loopback port and nothing
  else, and it is what keeps the app free of CORS handling.

## Performance cost

- Clipper disabled: zero — no listener, no thread, no port.
- Clipper enabled, idle: one listening socket and one blocked `accept()`; expected
  near-zero CPU. Ruling 9 (no polling) is honoured: stopping is event-driven — the
  accept thread is woken by one throwaway connection — so there is no timeout poll.
  The RSS/CPU measurement itself needs a running GUI build, so it is **owner-local
  and still outstanding**; nothing here has been measured at runtime.
- Binding uses a preferred port (`47912`, below the ephemeral range so it is not
  recycled) and falls back to an ephemeral port if that one is taken; the actual
  bound port is reported to the UI for pairing.
- Clip in flight: one bounded request (≤ 2 MiB cap) and one file write.
- Extension side (Phase 3 part 3), measured with `wxt build` and `gzip -9` on
  `.output/chrome-mv3`: total output 595.5 kB → **610.1 kB** raw and 173.8 kB →
  **179.6 kB** gzip, of which the new options page is 4.9 kB raw / 1.8 kB gzip.
  No dependency was added. (Adding a second HTML entrypoint makes the bundler
  split a shared chunk out of the popup bundle, so the popup's own file shrinks
  by roughly what the shared chunk grows.)

## Open decisions

- O1: confirm hybrid over the other three. **Partly answered by Phase 0**: the
  loopback carrier is built (it is needed under every option); the deep-link leg
  is deferred pending an owner call on the MSRV bump vs the 2.4.10 pin. See
  "Phase 0 verification outcome".
- O5: default pairing UX (copy-token vs nonce window). **Copy-token is built**
  (options page + `clipper.pairing`); the nonce window is not reachable until the
  deep link is added. The open part is whether copy-token stays the default.
- O7: keychain vs config file for the token. Until answered, the token store is an
  internal trait (`clipper_auth::ClipTokenStore`) with a keychain implementation,
  so the answer is a swap rather than a rewrite.
- New (extension side): once ADR-0178's queue exists (Phase 7), should a `queued`
  ack count as a successful hand-off — and does the popup keep the `.md` download
  as a first-class action or demote it below the send?

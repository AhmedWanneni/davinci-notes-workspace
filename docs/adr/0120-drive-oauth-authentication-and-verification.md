# ADR-0120: Drive OAuth authentication and verification posture

## Status

Accepted

## Context

Phase 2 needs Drive sign-in and durable sessions before Phase 3 can transfer
files. The app is a public-capable desktop client with no owned backend, so it
cannot safely embed a client secret or send refresh tokens to project
infrastructure. The project already uses Rust for native I/O and the Tauri
`keyring` crate for OS credential storage.

Google currently classifies `https://www.googleapis.com/auth/drive.file` as a
non-sensitive, per-file scope: it covers files the app creates or files the
user explicitly opens/shares with it. Broad `drive` and similar scopes are
restricted. Google’s current guidance says development/testing projects can
use up to 100 listed test users, whose test authorizations expire after seven
days; personal-use apps under 100 users may also continue without verification.
Public production use of only `drive.file` avoids sensitive/restricted-scope
verification, but still requires compliance with Google’s API Services User
Data Policy and production project/brand readiness. If verification is needed,
Google requires production publishing, consent-screen and scope details,
justification where applicable, a demo video, and verified domains. Google
does not publish a guaranteed turnaround for this path.

## Decision

Use a desktop OAuth client with PKCE and the `drive.file` scope only. Generate
the verifier/challenge with browser Web Crypto, use an ephemeral
`127.0.0.1` loopback listener, and validate the returned state before code
exchange. Binding port `0` lets the OS select a free port, avoiding a fixed
port collision; malformed paths, encoding, OAuth errors, and state mismatch
fail clearly.

Exchange and refresh tokens directly from the desktop through Google’s token
endpoint. Never ship or request a client secret. Store the serialized token
only through the Tauri Rust `keyring` adapter, which delegates to the host OS
credential service (macOS Keychain, Windows Credential Manager, or Linux
Secret Service/backend). Do not use localStorage, a settings file, or the
SQLite preferences table.

Refresh access tokens silently when they are within 60 seconds of expiry. A
provider-declared invalid grant clears the keychain and returns an explicit
re-authentication result; transient network/HTTP failures preserve the token
and return a retryable refresh failure. Sign-out invokes the same keychain
adapter’s delete operation and treats an already-empty entry as success.

Use a separate testing Cloud project for dogfooding. Production rollout must
account for the 100-user testing cap and seven-day test-session expiry even
though `drive.file` itself does not require sensitive/restricted verification.

## Consequences

- No client secret, sync backend, token relay, or plaintext credential store is
  introduced.
- Auth logic is testable in the shared package through transport/store
  adapters; native keychain and loopback behavior are narrow Tauri boundaries.
- A real Google consent session and direct OS-keychain inspection require a
  configured client ID and interactive account, so those checks remain an
  environment-dependent acceptance step.
- This ADR deliberately does not implement manifest sync, Drive file
  transfer, or Syncthing integration; those remain Phase 3/folder-mode work.

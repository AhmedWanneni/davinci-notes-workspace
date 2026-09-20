# ADR-0160: Editor Font Settings and Self-Hosted Fontsource Assets

## Status

Accepted

## Decision

Editor font settings remain vault-scoped because the established settings store
is the vault's `vault-index.db`. Reads and writes use the existing
`withDbLock` queue. The setting stores a validated font registry ID and an
integer size from 12 through 28, never a CSS family supplied by a user.

The default is the system UI font at 16px. Montserrat and Raleway are provided
as self-hosted `@fontsource-variable` packages, pinned at 5.2.8. Only the
Latin normal and italic WOFF2 assets are referenced. The families are loaded
through dynamic CSS imports only after selection; no Google Fonts CDN, link,
or remote CSP exception is used. Tauri's CSP stays `null`.

## Consequences

- Unknown or removed stored IDs fall back to System default.
- Variable normal and italic faces cover the editor's regular, bold, and italic
  usage without static-weight duplication.
- The local font CSS chunks and WOFF2 assets are deferred from the main entry.
- The repository has no third-party-notices surface yet; add the OFL-1.1
  notices for both families when one is introduced.

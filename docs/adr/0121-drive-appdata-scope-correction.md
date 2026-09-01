# ADR-0121: Add Drive app-data scope for hidden manifest storage

## Status

Accepted

## Context

ADR-0120 selected `drive.file` as the only Drive OAuth scope for Phase 2.
That scope remains appropriate for app-created or explicitly shared Drive
files, but it is insufficient for the hidden application-data folder required
by Phase 3. Google's current Drive documentation requires
`https://www.googleapis.com/auth/drive.appdata` to access `appDataFolder`.

Phase 3 manifests are internal synchronization bookkeeping. They should not
be visible in the user's normal Drive file list or editable by hand, because
an accidental edit or deletion could corrupt sync state.

## Decision

Amend ADR-0120 by adding `drive.appdata` alongside, not instead of,
`drive.file`. Existing `drive.file` behavior remains unchanged. The OAuth
request now asks for both non-sensitive recommended scopes:

- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/drive.appdata`

Manifest metadata is stored in Drive's hidden `appDataFolder` using
`spaces=appDataFolder`. Files are created with `appDataFolder` as their parent;
the conceptual `manifests/<deviceId>.json` organization remains app-private.

Both scopes are documented by Google as recommended/non-sensitive Drive
scopes, so this additive correction does not move the app into the
sensitive/restricted verification tier. The expanded consent must still be
manually re-tested because users will see an additional permission.

## Consequences

- The app can correctly use hidden, app-scoped Drive storage for manifests.
- Existing per-file `drive.file` access remains available for future content
  transfer and is not replaced or broadened to full Drive access.
- Existing users must authorize the added scope again; Phase 2 sign-in,
  keychain, restart/refresh, and sign-out acceptance must be repeated against
  the expanded consent flow.
- This is an explicit amendment to ADR-0120 and ADR-0118; the original scope
  choices remain the historical record of the pre-Phase-3 decision.

## Sources

- [Choose Drive API scopes](https://developers.google.com/workspace/drive/api/guides/about-auth)
- [ADR-0118: Drive drive.file OAuth verification](0118-drive-file-oauth-verification.md)
- [ADR-0120: Drive OAuth authentication and verification posture](0120-drive-oauth-authentication-and-verification.md)



# ADR-0199: Google Calendar read-only OAuth architecture, scope isolation, and OS keychain separation

## Status

Accepted (extends ADR-0118, ADR-0120)

## Context

DaVinci Notes is introducing a Google Calendar and Google Meet integration allowing users to view upcoming meetings, join Google Meet calls directly, and generate structured meeting notes in their vault.

The desktop app already features a Google Drive OAuth 2.0 loopback flow with PKCE for vault sync (ADR-0120). However, Google Drive sync and Google Calendar have fundamentally different responsibilities, security postures, and user expectations:

1. **Consent Isolation**:
   - Drive sync asks for `drive.file` and `drive.appdata` to upload vault files.
   - A user who wants note-taking with calendar agenda visibility may not want their vault notes synchronized to Google Drive.
   - Forcing combined consent would require requesting broad Drive and Calendar scopes together, causing unnecessary privacy concerns and violating the principle of least privilege.
   - Disconnecting Calendar must never disconnect or invalidate Drive sync, and disconnecting Drive must not disable Calendar.

2. **OAuth Scope Sensitivity and Verification**:
   - Google classifies `https://www.googleapis.com/auth/calendar.events.readonly` and `https://www.googleapis.com/auth/calendar.calendarlist.readonly` as **Sensitive** scopes (not Restricted scopes).
   - Sensitive scopes do not require expensive third-party CASA Tier 2/3 security audits (unlike restricted scopes such as Gmail or full Drive).
   - In development/testing mode, apps can serve up to 100 test users without public verification; for public production distribution, standard Google OAuth verification (privacy policy, demo video) is required.
   - `calendar.events.readonly` provides least-privilege read access to event details, while `calendar.calendarlist.readonly` allows users to select which subscribed calendars to display.

3. **Keychain Security**:
   - OAuth tokens must never be written to the vault, committed to Git, stored in SQLite tables, or synced via Drive/Syncthing.
   - Rust's `keyring` crate provides hardware-backed OS credential storage (macOS Keychain, Windows Credential Manager, Linux Secret Service).
   - Drive tokens reside in `com.davinci.notes.drive-oauth`. Calendar tokens must be stored in a dedicated, isolated service entry.

## Decision

1. **Independent OAuth Flow and Isolated Consent**:
   - Calendar authorization uses a dedicated, independent OAuth 2.0 PKCE flow.
   - The desktop loopback listener (`start_oauth_listener`, `wait_for_oauth_callback`, and `open_external_url` in `src-tauri/src/oauth.rs`) is reused as a generic loopback mechanism on `127.0.0.1:0`.
   - Environment variable `VITE_GOOGLE_CLIENT_ID` is used for the OAuth Client ID (falling back to `VITE_GOOGLE_DRIVE_CLIENT_ID` if unconfigured).

2. **Least-Privilege Sensitive Scopes**:
   - Request strictly:
     - `https://www.googleapis.com/auth/calendar.events.readonly`
     - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
   - No write, modify, or delete scopes are requested.

3. **Dedicated OS Keychain Service**:
   - Calendar tokens are stored under `com.davinci.notes.calendar-oauth` via new Tauri commands (`save_calendar_token`, `load_calendar_token`, `clear_calendar_token`), completely isolated from `com.davinci.notes.drive-oauth`.
   - Disconnection calls Google's token revocation endpoint (`https://oauth2.googleapis.com/revoke`), deletes the keychain entry, and purges all cached calendar events from local SQLite storage.

4. **Zero-SDK REST Architecture**:
   - Avoid `googleapis` or heavy client libraries. Implement a lightweight REST client using native Web `fetch` in `@app/google-calendar-api`.

## Consequences

- Calendar authorization is completely decoupled from Drive sync; users can use either or both independently.
- Tokens are secured in OS hardware/keychain storage with zero disk or vault exposure.
- Zero bundle weight penalty on application startup (all calendar code and auth modules are dynamically imported on demand).
- Compliance with Google API Services User Data Policy and sensitive-scope verification requirements.

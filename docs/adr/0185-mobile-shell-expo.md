# ADR-0185: Mobile shell: Expo

## Status

Accepted (supersedes the mobile shell decision in ADR-0001; desktop remains Tauri v2)

## Context

DaVinci Notes requires a dedicated mobile client (iOS and Android) that adheres to the lightweight, local-first performance principles of the application (`PERFORMANCE.md`). 

The mobile application requires:
1. Fast cold start (< 400 ms to interactive).
2. Native navigation stacks and fluid gesture transitions.
3. Mobile OS integration: deep linking for Google Drive PKCE OAuth callbacks, native virtual keyboard accessory toolbars, background lifecycle management, and biometric/keychain credential storage.
4. Offline-first note reading, editing, and manifest-diff synchronization.

In ADR-0001, Tauri v2 was provisionally selected for both desktop and mobile. A comprehensive codebase audit (`docs/mobile/package-audit.md`) and a dedicated editor spike (`docs/mobile/editor-spike-report.md`) were conducted to evaluate mobile viability.

### Spike Results
The editor spike in `apps/mobile-spike/` evaluated running CodeMirror 6 with live-preview markdown decorations inside an Expo DOM component (`"use dom"`):
- Verdict: **`GO-WITH-FIXES`**.
- Typing latency on a 10,000-line note averaged **1.84 ms / keystroke**, well within the 16.6 ms (60 fps) budget due to CodeMirror 6 viewport culling.
- Text stays inside the webview; debounced change notifications (doc length, revision count, excerpt) keep bridge traffic at **122 bytes** per batch (a **99.95% reduction** compared to sending the 260 KB document).
- Virtual keyboard avoidance was verified via `window.visualViewport` resize tracking and CodeMirror `scrollIntoView`.
- Required fixes were identified: background save flush on `visibilitychange`/`pagehide`, iOS WKWebView focus workaround, and breaking an internal circular import in `@app/editor`.

### Alternatives Considered
1. **Tauri v2 Mobile (Webview + Rust)**:
   - Rejected for mobile shell. While Tauri v2 desktop is accepted and successful, Tauri v2 mobile has a less mature ecosystem for mobile-specific application concerns: native navigation gesture stacks, keyboard accessory views (`InputAccessoryView`), system file pickers, and OS-managed background synchronization. Maintaining custom iOS/Android plugins in Rust added disproportionate maintenance overhead.
2. **Native Swift (iOS) + Kotlin (Android)**:
   - Rejected. Requires maintaining three separate client codebases and duplicating parser and sync policy.
3. **Pure React Native Native-Text Editor**:
   - Evaluated as a potential fallback. Rejected because it would require duplicating all Lezer grammar extensions, wikilink parsing, task widgets, and live-preview decorations, violating the single rendering pipeline principle (ADR-0003, ADR-0027).

## Decision

1. Use **Expo** (React Native + Expo Router) as the mobile application shell in `apps/mobile`.
2. The note editor runs CodeMirror 6 inside an Expo DOM component (`"use dom"`), reusing the live-preview markdown extensions and themes from `@app/editor`.
3. The mobile shell uses Expo Router for file-based native navigation stacks and native tab/drawer navigation.
4. Supersede the mobile shell decision in ADR-0001. Desktop remains Tauri v2 (Rust + native webview).
5. **Fallback Editor Decision**: Because the spike resulted in `GO-WITH-FIXES` (not `NO-GO`), a fallback native editor is deferred. If physical device testing across long-term beta reveals an unresolvable defect with the DOM component, the fallback architecture will be a headless CodeMirror state engine communicating with a lightweight native text view, rather than a bespoke parser.

## Consequences

- Desktop (`apps/desktop`) and Mobile (`apps/mobile`) live as sibling application shells in the pnpm workspace.
- Mobile gains access to the mature Expo/React Native ecosystem for native navigation, deep links, and device hardware.
- Core business logic remains shared via workspace packages: `@app/core-types`, `@app/indexer`, `@app/sync-client`, `@app/attachments`.
- Metro is configured with workspace package resolution and package boundaries prevent web-only components from leaking into mobile.

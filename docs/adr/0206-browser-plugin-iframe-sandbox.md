# 0206 — Browser Plugin Sandboxing via Null-Origin Iframe and MessageChannel RPC

- **Status:** Accepted (extends ADR-0166, ADR-0167)
- **Date:** 2026-10-22

## Context

On desktop, ADR-0166 isolates community plugins in a separate Tauri webview window and mediates network and shell capabilities over Rust IPC. In a browser tab (`apps/web`), Tauri multi-webview windows and native OS process spawning are unavailable, and untrusted plugin scripts must never access the host page's `localStorage`, IndexedDB, OPFS, or DOM.

## Decision

1. **Opaque Null-Origin `<iframe sandbox="allow-scripts">`**:
   - `IframePluginHost` in `@app/plugin-runtime` executes browser plugins inside a hidden `<iframe sandbox="allow-scripts">` (strictly omitting `allow-same-origin`).
   - The iframe runs with an opaque `null` origin, preventing access to `window.parent.document`, `localStorage`, `indexedDB`, or `navigator.storage.getDirectory()`.
2. **MessageChannel RPC & Capability Gating**:
   - Host and plugin communicate exclusively through structured-clone JSON-RPC over `postMessage` (`ADR-0167`).
   - `shell.execute` / `shell.*` methods are unconditionally rejected in the browser host (`Shell execution is not supported in the browser plugin host`).
   - `network.fetch` is gated by the plugin manifest's `network` permission and restricted to `https:` and `http:` URLs.

## Consequences

- Preserves the exact ADR-0167 plugin RPC contract and declarative UI model across desktop and web while guaranteeing strong browser origin isolation.

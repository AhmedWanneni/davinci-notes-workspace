# ADR-0054: Canvas Webpage Embed Cards & Sandboxing Security

## Status
Accepted

## Context
Phase 10 of the Canvas Feature Plan introduces webpage embed cards (`type: "link"` per JSON Canvas 1.0 specification). The user can embed arbitrary external websites (or responsive YouTube players) by pasting or dropping a URL onto the infinite canvas.

Because DaVinci Notes executes in a privileged Tauri v2 desktop webview environment with filesystem access (`@tauri-apps/plugin-fs`), local SQLite database querying (`@tauri-apps/plugin-sql`), native dialogs, and backend Rust IPC, embedding untrusted third-party web content creates an attack surface that must be isolated.

## Threat Model & Security Decisions

### 1. Threat Boundaries
- **No IPC / Native Capability Access**: Embedded third-party scripts must never access `window.__TAURI__`, invoke Tauri commands, or communicate with backend Rust plugins.
- **No Parent Window / DOM Access**: Untrusted scripts must not traverse `window.parent` / `window.top` or access host DOM, localStorage, cookies, or notes.
- **No Top-Level Window Navigation**: Untrusted webpages must never redirect or hijack the host application window.
- **No Local URI / File Access**: Local schemes (`file://`, `tauri://`, `data:`, `blob:`, `about:`, `javascript:`, `vbscript:`) must never be loaded into embed iframes.
- **No Modal UI Hijacking**: Untrusted webpages must not lock up the app with `alert()`, `confirm()`, or `prompt()` modal dialog loops.

### 2. Sandboxing Strategy
1. **URL Protocol Restriction**:
   - Only validated `http:` and `https:` schemes are accepted.
   - Any other scheme is rejected during URL paste, drop, creation, or editing.
2. **Iframe `sandbox` Whitelist**:
   - `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`
   - `allow-scripts`: Required for dynamic websites and video players to function within their frame.
   - `allow-same-origin`: Required for external websites/CDNs to manage their origin-scoped cookies/storage within their domain. Because the origin is `https://<external-domain>`, browser same-origin policy completely isolates it from the host's `tauri://localhost` origin.
   - `allow-forms`: Enables form interaction (e.g. search bars on the embedded page).
   - `allow-presentation`: Enables responsive video playback and presentation features.
3. **Explicitly Forbidden Tokens**:
   - `allow-top-navigation`, `allow-top-navigation-by-user-activation`, `allow-top-navigation-to-custom-protocols`, `allow-modals`, and `allow-pointer-lock` are strictly prohibited.
4. **Referrer Policy**:
   - `referrerPolicy="strict-origin-when-cross-origin"` prevents leaking local note filenames or private path data in HTTP Referer headers.
5. **YouTube Embed Special-Casing**:
   - YouTube URLs (`youtube.com/watch`, `youtu.be`, `shorts`, `embed`) are parsed and transformed to privacy-enhanced `https://www.youtube-nocookie.com/embed/{id}?start={timestamp}` player embeds.

## Consequences
- Strict compliance with JSON Canvas 1.0 `link` node schema (`type: "link"`, `url: string`).
- Zero bundle weight overhead added to entry chunk; uses native browser `<iframe>` with hardware-accelerated rendering.
- Automated security regression tests (`LinkCardSecurity.test.tsx`) enforce sandboxing tokens, protocol sanitization, and parent isolation boundaries on every commit.

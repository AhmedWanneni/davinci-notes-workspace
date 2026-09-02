# ADR-0131: Plugin Execution Model: Capability-Scoped Permissions per Plugin

## Status
Accepted

## Context
DaVinci Notes is establishing a native plugin ecosystem (manifest, entry point, lifecycle hooks, registry) modeled on the ergonomics of Obsidian but architected for our Tauri v2 platform.

Obsidian runs in Electron and grants community plugins unconstrained Node.js privileges (`require('fs')`, `require('child_process')`, `require('electron')`) with zero runtime permission prompts, relying entirely on manual registry submission reviews. Adopting Obsidian's trust model verbatim would discard the core reason Tauri v2 was selected over Electron: a security-conscious, capability-driven architecture with minimal runtime footprint.

Per `PERFORMANCE.md`, DaVinci Notes must stay lightweight and fast (target <500ms startup, low idle memory, 60fps typing in CodeMirror 6). This ADR evaluates three execution models for plugins and defines the security and runtime architecture for Phase 0.

---

## Evaluation of Options

### Option 1: Fully Trusted JavaScript (Obsidian-Style)
Plugin scripts execute directly in the main webview thread with unrestricted access to the application's runtime context.

- **Capabilities & Limits**: Direct synchronous access to CodeMirror 6, React tree, Zustand stores, and DOM. Plugins can build any UI or editor extension natively.
- **Threat Model**:
  - *Arbitrary IPC Access*: Any plugin can access `window.__TAURI_INTERNALS__` and invoke any Rust command enabled for the `main` window (reading/deleting arbitrary notes, accessing Google Drive OAuth refresh tokens via `load_drive_token`, opening external URLs, running arbitrary SQLite queries).
  - *Data Exfiltration*: Plugins have unrestricted access to global `window.fetch` and `WebSocket`, allowing silent transmission of note contents, AST metadata, or credentials to remote servers without user awareness.
  - *Keystroke Logging & Tampering*: Plugins can install global keyboard listeners or monkey-patch `Object.prototype`, `Promise`, or `fetch` to capture user input or alter saved notes.
  - *Main Thread Denial of Service*: An unhandled exception or synchronous blocking loop freezes the entire UI.
- **Build & Maintenance Complexity**: Lowest. Simple dynamic evaluation via `import()` or blob URLs.
- **Developer Experience**: Highest. Familiar Obsidian-like authoring with zero IPC friction.
- **Vault Root Boundary**: While DaVinci's API enforces canonical paths, plugins can invoke raw Tauri commands directly to attempt vault escapes or bulk deletions.
- **Performance Cost**: Zero serialization overhead; shared heap. However, rogue plugins executing heavy synchronous work on the main thread violate `PERFORMANCE.md` Rule 2.
- **Room for Tightening**: None. Once plugins are authored against unrestricted globals and synchronous DOM, retrofitting boundaries causes breaking ecosystem churn.

---

### Option 2: Capability-Scoped Permissions per Plugin (Recommended)
Plugins declare required capabilities in their manifest (`manifest.json`), users approve them at install/update time via a permissions modal, and access is enforced at the DaVinci API boundary with internal IPC shielding.

- **Capabilities & Limits**:
  - Declared capabilities govern access to resources: `vault:read`, `vault:write`, `network`, `shell`, `editor:read`, `editor:write`, `commands`, `ui:view`.
  - Plugins without `network` cannot initiate HTTP requests. Plugins without `vault:write` cannot alter notes.
  - Plugins retain direct, synchronous access to CodeMirror 6 extensions and React UI mount points granted through host API facades.
- **Threat Model**:
  - *Mitigated Risks*: Eliminates silent exfiltration by offline plugins (e.g. formatters, linters). Prevents unauthorized note tampering and accidental bulk deletions. Install-time prompts highlight permission creep during updates.
  - *Residual Risk in Shared Webview*: In JavaScript, code sharing a webview can theoretically inspect prototypes or global objects unless defended. To prevent bypassing the API facade, the host application must shield `window.__TAURI_INTERNALS__` (freezing, scoping, or stripping raw invoke handles before loading third-party scripts) and route sensitive operations (e.g. OAuth tokens) through privileged, non-exported channels.
- **Build & Maintenance Complexity**: Moderate. Requires manifest capability schema validation, an install-time consent prompt, and a scoped `PluginContext` facade factory.
- **Developer Experience**: Excellent. Standard TypeScript authoring with clear, modern APIs. Capabilities are explicit and self-documenting.
- **Vault Root Boundary**: Strictly guaranteed. All file operations through `context.vault` must route through the canonical `resolve_in_vault` path (ADR-0025, `fs.rs`), preventing path traversal escapes outside the active vault.
- **Performance Cost**: Negligible. Capability checks are fast in-memory Set/bitmask lookups (`plugin.hasCapability('vault:write')`). Memory footprint is minimal because all plugins share the existing webview V8/WebKit heap without extra thread allocations.
- **Room for Tightening**: High. Because plugins interface with abstract capability objects (`context.net`, `context.vault`, `context.shell`), high-risk operations (such as `network` or future `shell` execution) can later be delegated to background Web Workers or Rust-side sandboxes without changing the plugin author's API surface.

---

### Option 3: Sandboxed Execution (Web Workers or Isolated Iframes)
Plugins execute in separate Web Workers or strict sandboxed iframes (`sandbox="allow-scripts"` without `allow-same-origin`), communicating with the host exclusively via asynchronous message passing (`postMessage` / JSON-RPC).

- **Capabilities & Limits**:
  - *Cannot Do*: Cannot synchronously participate in CodeMirror 6's 60fps transaction/view plugin pipeline (StateFields, decorations, gutter markers). Cannot mount native React components directly into host UI panels without iframe wrappers or complex declarative UI schemas.
  - *Can Do*: Asynchronous background processing, document transformations, custom export pipelines, and network requests via mediated RPC.
- **Threat Model**:
  - Strong process/isolate boundary prevents access to host DOM, React state, and Tauri IPC globals.
  - *Residual Risks*: An RPC bridge still requires capability checks (a worker granted `rpc.writeNote()` can still corrupt notes if malicious). Workers with network access can exfiltrate any data sent to them over RPC. Worker threads can also consume 100% of a CPU core in infinite loops.
- **Build & Maintenance Complexity**: Extreme. Requires designing, testing, and maintaining a complete bidirectional RPC bridge, serialization pipeline, and custom declarative UI or iframe layout manager.
- **Developer Experience**: Poor. Eliminates rich, synchronous editor extensions and native UI plugins (e.g., Dataview, Kanban, Excalidraw, Vim extensions), drastically suppressing community adoption.
- **Vault Root Boundary**: Compatible via host-side RPC validation.
- **Performance Cost**: Severe, violating `PERFORMANCE.md`:
  - *Memory Bloat*: Each Web Worker or iframe allocates a distinct WebKit/V8 JS isolate (10–30 MB baseline per instance). A user with 25 plugins would consume 250–750 MB of additional RAM, negating Tauri's lightweight advantage over Electron.
  - *Serialization Overhead*: Passing large Markdown documents or AST structures across `postMessage` creates garbage collection pressure and latency on keystroke events.
- **Room for Tightening**: Starting with full sandboxing locks the ecosystem into an asynchronous RPC model and permanently precludes synchronous editor extensions.

---

## Tauri v2 Capability Architecture Flag
**Technical Reality & Scope Boundary**:
In Tauri v2, native permissions and capabilities (`src-tauri/capabilities/*.json`) are statically bound to **Webview Windows** (e.g. `windows: ["main"]`), not to individual JavaScript closures or scripts within a shared window context. Tauri v2's Rust core cannot natively determine which specific third-party JS function triggered an IPC invoke inside the main webview.

Consequently:
1. Per-plugin capability scoping cannot be delegated exclusively to Tauri's compile-time capability files.
2. DaVinci Notes must enforce capability boundaries at the TypeScript/JavaScript application layer.
3. The desktop shell must shield the raw Tauri IPC entry point (`window.__TAURI_INTERNALS__` / `invoke`) so plugin scripts cannot bypass the scoped `PluginContext` facade.

---

## Decision
Adopt **Option 2: Capability-Scoped Permissions per Plugin**.

1. **Manifest Permissions**: Plugins must declare requested capabilities (`vault:read`, `vault:write`, `network`, `shell`, `editor:read`, `editor:write`, `commands`, `ui:view`) in their manifest.
2. **Install-Time Consent**: Users are presented with a clear permission prompt before installation or activation, and whenever updated versions request new permissions.
3. **Application Call-Boundary Enforcement**: All interactions with app state and native features occur through an instantiated `PluginContext` that validates granted capabilities on every call.
4. **IPC Shielding**: Raw Tauri IPC handles are shielded from the global scope prior to loading untrusted plugin scripts. Sensitive operations (such as OAuth keychain tokens) remain strictly inaccessible to plugin code.
5. **Strict Vault Boundary**: All filesystem access within `vault:*` capabilities is constrained strictly to the vault root via canonical `resolve_in_vault` path verification.
6. **Extensibility Path**: The capability-scoped abstraction layer preserves the architectural option to delegate high-risk capabilities (like `network` or `shell`) to isolated worker or Rust-side proxies in future phases without breaking the plugin API contract.

---

## Consequences
- **Security**: Granular user consent, privilege minimization, and zero unauthorized network exfiltration, fulfilling Tauri's security model.
- **Performance**: Zero worker isolate memory overhead, zero IPC message serialization delay, full compliance with `PERFORMANCE.md` (<500ms startup budget, minimal idle RAM).
- **Developer Experience**: Retains the beloved ergonomics of Obsidian plugins (synchronous CodeMirror 6 extensions, native React UI integration) with modern TypeScript contracts.
- **Ecosystem Growth**: High author adoption enabled by low friction and expressive APIs, without inheriting Electron's security vulnerabilities.

# ADR-0166: Plugin Isolation and Plugin-Webview Capability Boundary

## Status

Accepted — supersedes ADR-0131's shared-main-webview execution decision. The
manifest vocabulary and host API direction from ADR-0131 remain, but their
permissions must become enforceable.

## Context

The implementation audit recorded in `docs/plugin-ecosystem.md` found that
plugins currently execute with `new Function()` in the privileged `main`
webview. They can therefore use ambient JavaScript and its unrestricted
network primitives regardless of their manifest. The same webview has Tauri
filesystem and raw-SQL permissions and can invoke application commands that
include OAuth/keychain and AI-key operations.

The immediate objective is not to claim that arbitrary JavaScript can be made
safe in the abstract. It is to make `network` and `shell` permissions true at
their enforcement point and to ensure a compromised plugin cannot invoke the
host's credential, AI-key, or raw-SQL facilities. Tauri v2 offers a useful
per-webview native capability boundary; it cannot distinguish JavaScript
closures inside one webview.

The existing view API gives `PluginView.render()` a live host `HTMLElement`
and DOM factory (`packages/plugin-api/pluginWorkspaceTypes.ts`). Any model
that places code outside `main` cannot retain that direct reference.

Tauri constraint: a capability file scopes Tauri core/plugin permissions by
webview, but app commands registered with `tauri::Builder::invoke_handler`
are allowed to all webviews by default. A plugin webview therefore needs both
its own restrictive capability and explicit authorization on sensitive custom
commands; the capability file alone is insufficient.

## Options evaluated

### 1. Web Worker per plugin

**What it protects.** A Worker does not receive the main document, React tree,
or host DOM, so a plugin cannot directly attach key listeners to the host DOM,
mount into it, or call host lexical imports. A synchronous infinite loop does
not freeze the main JavaScript event loop.

**What it does not protect.** The Worker still has its own global APIs,
including `fetch`, WebSocket, and CPU use. Without a separate CSP/origin it
can exfiltrate any vault/editor data delivered by RPC. It is not a Tauri
webview boundary: it does not give the Worker a separate Tauri capability
identity. Any ambient or bridged IPC handle accidentally exposed to the
Worker, and any permissive message handler in `main`, becomes the escape
route. Worker CPU exhaustion remains possible.

**`context.net` / `context.shell`.** The host would expose these only as
message RPC methods. For `network` to be complete rather than best-effort, the
Worker must have no direct egress (`fetch`, WebSocket, EventSource, image or
navigation egress) under a restrictive CSP/origin; the host/Rust RPC handler
must be the only route and check the immutable approved permission for every
request. A JavaScript wrapper around `fetch` is not sufficient because plugin
code can retain or rediscover ambient APIs. `shell` similarly requires a
host/Rust RPC handler, no worker-accessible shell IPC, and a validated,
manifest-approved executable/argument policy; an unrestricted command string
is not a meaningful permission boundary.

**Tauri IPC.** A Worker cannot safely be treated as unable to invoke sensitive
commands merely because it lacks an imported SDK. The privileged `main`
webview remains its execution container and any main-side bridge can invoke
on its behalf. This option has no native mechanism that makes a request arrive
as a distinct, unprivileged Tauri webview.

**Cost/API.** Startup remains low if workers are created only for enabled
plugins, but each enabled plugin adds an isolate and message serialization.
Implementation requires a bidirectional RPC protocol, cancellation, payload
limits, lifecycle handling, and error transport. The current synchronous
editor API and live `HTMLElement` views cannot remain; views need a
declarative protocol or a separate rendering surface.

### 2. SES/locked-down Realm in the main webview

**What it protects.** A correctly locked-down Realm can omit `fetch`, DOM,
Tauri globals, `Function`, and host object references from the plugin's
endowments. It can stop straightforward use of those globals and reduce
prototype-pollution effects on host code if lockdown happens before any plugin
executes.

**What it does not protect.** It remains the same Tauri webview and native
capability identity. A missed endowment, host object leakage, incorrectly
locked intrinsic, Realm escape, or plugin API returning a live host object can
restore access to privileged globals. It cannot use Tauri capabilities to
make native IPC reject a plugin-originated request. It also does not inherently
prevent main-thread CPU denial of service.

**`context.net` / `context.shell`.** They would be Realm endowments that call
a host RPC facade. Enforcement is complete only if the Realm has no ambient
network/shell primitive and every host object crossing the boundary is
membrane-wrapped; otherwise `fetch` or an invoke handle can escape the facade.
The capability check belongs in the host/Rust RPC handler, not just in the
endowment constructor.

**Tauri IPC.** Direct invocation can be hidden from Realm globals, but it is
not mechanically denied by Tauri because the request still originates from
`main`. The security claim consequently depends on the correctness of the
JavaScript confinement implementation, rather than a native deny decision.

**Cost/API.** There is no separate webview memory cost and no cross-thread
serialization, but SES introduces a substantial security-critical runtime and
compatibility burden. Live DOM references must be membrane-wrapped or removed;
the existing `PluginViewContext.container: HTMLElement` is not compatible with
a robust Realm boundary.

### 3. Shared dedicated plugin-only webview

**What it protects.** Plugin code runs outside `main`, so it cannot directly
read its DOM/React/Zustand heap, register host-document key listeners,
monkey-patch main globals, or invoke Tauri core/plugin APIs omitted from the
plugin webview capability. A restrictive plugin capability excludes filesystem,
raw SQL, dialog, shell, and credential-related plugin permissions. The host's
OAuth/keychain/AI-key JavaScript and objects are not in the plugin webview.

**What it does not protect.** Plugins sharing this webview can interfere with
one another and can still consume that webview's CPU. A plugin granted
`vault:read` and `network` may intentionally exfiltrate what the host supplies.
This does not make plugin JavaScript trustworthy. A capability file alone also
does not protect current custom `invoke_handler` commands; without their own
calling-webview authorization, a plugin could invoke them from the separate
webview.

**`context.net` / `context.shell`.** The plugin bootstrap page has a
host-defined CSP that denies all direct outbound routes: `connect-src 'none'`,
no external scripts/images/media/frames/fonts, and no external navigation or
form submission. `context.net` becomes a message RPC to a host-owned native
bridge. That bridge checks the plugin's immutable approved `network`
permission on every call and performs the request; no response or credential
is supplied outside that contract. This is complete only while the CSP remains
host-controlled, no direct egress-capable Tauri permission is granted, and no
other host bridge accepts arbitrary messages as network work.

`context.shell` is also an RPC to the native bridge. The plugin webview has no
shell permission. Every call checks `shell` plus a host-approved executable,
argument, and working-directory allowlist; generic arbitrary command execution
is outside this capability's initial contract. Completeness requires that no
other custom command can launch a process or open an externally controlled URL
without the same caller and permission checks.

**Tauri IPC.** The plugin webview receives a distinct label and only a
minimal plugin capability. Sensitive custom commands must additionally accept
the invoking `WebviewWindow`/request and reject every label except `main`.
Alternatively, they must move behind an ACL-controlled Tauri plugin command.
The only custom command accepted from the plugin label is a narrowly typed
plugin RPC dispatcher, which derives the plugin identity from the registered
host session rather than plugin-supplied input. With both controls, a direct
`invoke()` from plugin code reaches Tauri's runtime authority but is denied
for omitted core/plugin permissions and rejected by sensitive custom-command
caller checks before credential, AI-key, or SQL work occurs.

**Cost/API.** One shared webview is created only when the first enabled plugin
needs it, so users with no plugins pay no startup or idle-webview cost. It has
one additional WebKit/WebView isolate rather than one per plugin, but still
adds a second renderer and RPC serialization. The current live DOM API cannot
cross this boundary: `PluginView.render({ container: HTMLElement, ... })` is
removed/replaced by a declarative view protocol or a plugin-owned plugin-window
surface. Synchronous CodeMirror extension access likewise cannot remain;
editor/vault operations are asynchronous RPC.

## Decision

Adopt **one lazily created, shared plugin-only webview** as the plugin
execution boundary. Do not execute third-party plugin entry code in `main`, in
a Worker belonging to `main`, or in an in-main SES Realm.

The plugin webview has a separate label and a deny-by-default capability. The
application must make sensitive custom commands reject the plugin label (or
place them behind ACL-governed plugin commands); this requirement is part of
the boundary, not an optional follow-up. The plugin webview may invoke only a
narrow host-owned RPC dispatcher. `network` and `shell` mean mediated RPC
operations, never permission to use an ambient browser/Tauri primitive.

The external plugin API becomes asynchronous and message-safe. Direct host DOM
and synchronous CodeMirror extension APIs are intentionally not preserved.
Plugin views use a future declarative protocol or their plugin-owned surface.

## Consequences

- Manifest permission promises become mechanically enforceable at a native
  caller boundary plus a CSP-controlled JavaScript boundary.
- A compromised plugin cannot directly call OAuth/keychain/AI-key/raw-SQL
  facilities, provided all current sensitive custom commands implement the
  required caller authorization.
- Plugins remain untrusted relative to each other within the shared plugin
  webview; this is a privilege-reduction boundary, not per-plugin process
  isolation.
- The current synchronous DOM/editor plugin API is a deliberate breaking
  change. No compatibility guarantee is made for pre-release plugins.
- The additional webview/RPC cost must be measured before implementation:
  no-plugin startup, first-plugin activation, per-enabled-plugin incremental
  memory, and editor-input latency under vault/editor event traffic.
- This decision does not authorize implementation. Any implementation phase
  must separately design the RPC schema, command authorization, CSP, UI
  protocol, lifecycle/error isolation, and performance tests.

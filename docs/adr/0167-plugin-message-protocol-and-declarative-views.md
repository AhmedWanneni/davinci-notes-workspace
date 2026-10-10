# ADR-0167: Plugin Message Protocol and Declarative Views

## Status

Accepted. This is the API migration required before ADR-0166's plugin-only
webview can be implemented. It does not create a Tauri webview or change a
native capability.

## Context

The current API is in-process: `PluginLifecycleManager` constructs a plugin
class and retains its callbacks; `PluginView.render` receives a host
`HTMLElement`; and `PluginEditor` is synchronous. Those references cannot
cross the webview boundary selected by ADR-0166.

## Decision

The host and plugin runner communicate only with versioned, structured-clone
safe messages. A host session is identified by an opaque host-issued session
ID; plugin IDs supplied in messages are display data, never authority.

### Protocol

Messages use this envelope:

```ts
type PluginMessage = {
  protocol: 1;
  sessionId: string;
  requestId: string;
  kind: "request" | "response" | "notification";
  method: string;
  params?: JsonValue;
  result?: JsonValue;
  error?: { code: string; message: string };
};
```

`JsonValue` excludes functions, DOM nodes, class instances, `Error`, and
host-owned objects. The host owns session state and serializable descriptors;
the runner owns all executable plugin functions.

Host-to-runner lifecycle calls are `lifecycle.activate` and
`lifecycle.deactivate`. The entry module is evaluated and instantiated only
by the runner. The runner replies with success or a serialized error. The host
record therefore changes from `instance: DavinciPlugin | null` to session
state (`starting | active | stopping | error`) plus its manifest and
registration descriptors.

Commands are two messages, not a callback transfer: the runner sends
`commands.register { id, name, hotkey? }`; when the user selects it, the host
sends `commands.invoke { id }`. The runner looks up and calls its local
callback. Disable/disconnect removes all registrations for the session,
including if the runner fails to acknowledge deactivation.

Vault (`vault.read`, `vault.write`, `vault.list`, `vault.delete`), plugin data,
settings registration, and workspace operations are runner-to-host requests.
The host resolves the session first, then applies the session's immutable
approved permissions and path validation before handling the operation.

### Views

`PluginView.render({ container, dom })` is removed. A registered view has an
ID, a name, and a serializable `PluginViewModel`; updates use
`workspace.setView { viewId, model }`. The host renders a constrained,
declarative tree (text, headings, lists, buttons, inputs, and layout nodes)
with values and event IDs. User interaction becomes
`workspace.viewEvent { viewId, eventId, value? }` sent to the runner, where a
local handler runs and may send a new model.

This fits ADR-0166's one shared plugin-only webview: plugin code remains in
that one off-screen/shared execution surface while `main` renders trusted
components from a data-only model. Raw plugin HTML is not rendered in `main`:
that would reintroduce script/DOM escape risk. A VS Code-style arbitrary
HTML/JS view instead needs a per-view child webview (or another isolated
surface), because one rectangular shared webview cannot occupy independent
React leaf positions. Per-view webviews conflict with the one-shared-webview
cost/identity decision and are explicitly deferred.

### Editor

All editor operations become promises: `getContent`, `setContent`,
`getSelection`, `setSelection`, and `insertText` are requests. Snapshot reads
return `{ content, selection, version }`; mutations may include
`expectedVersion` so the host can reject stale full-document replacements.
Content-change subscription is an explicit `editor.subscribe` request and an
`editor.changed` notification. The callback remains local to the runner;
`main` retains only the subscription ID. Host delivery must be debounced and
coalesced—never one serialized document per keystroke.

## Breaking API changes

- `DavinciPlugin` is runner-local. The host no longer imports a
  `PluginConstructor`, invokes class methods, or stores `PluginRecord.instance`.
  The current CommonJS class export may remain a runner-bootstrap convention,
  but it is no longer an object contract between the host and plugin.
- `PluginCommand.callback` is not part of the host registration descriptor.
  It remains a runner-local handler addressed by command ID.
- `PluginView`, `PluginViewContext`, `PluginDom`, and `render()` are removed;
  host DOM references and cleanup functions cannot be serialized. Views use a
  declarative model and event IDs.
- Every `PluginEditor` getter/setter becomes asynchronous. The synchronous
  CodeMirror extension, state/view, transaction, decoration, and DOM access
  that were already unsupported remain unsupported.
- `workspace.openLeaf`, `closeLeaf`, `focusLeaf`, and `isViewOpen` become
  request/response methods. Settings and vault APIs remain promise-based but
  now cross the same protocol.

## Consequences

- Phase 2b can implement the boundary without retaining a host-memory object
  reference to plugin code.
- The host can validate every runner-originated operation at one dispatcher.
- Plugin UI is intentionally less expressive than arbitrary HTML. This keeps
  a single lazy webview and avoids a webview per panel.
- Plugins sharing the runner can still observe or interfere with runner-global
  state; this protocol does not provide inter-plugin isolation.

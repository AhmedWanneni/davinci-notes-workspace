# ADR-0165: Built-in theme loading and precedence

## Status

Accepted

## Context

Built-in themes must work without an open vault or network access, but the
desktop app must retain its lazy initial-load boundary: inactive theme CSS must
not add to startup fetches. A selected theme must also be app-scoped rather
than stored in a vault database, otherwise it cannot restore before a vault is
opened.

Vault themes remain installable under `<vault>/.davinci/themes`, so an ID can
collide with a bundled theme.

## Decision

Ship built-in manifest files with the frontend and import each stylesheet with
Vite `?raw` dynamic imports. The initial module contains only four small
manifest records and loader functions. It requests one CSS text chunk only
when that theme is activated; the other three have no startup network request.

Persist the selected ID in app-level `localStorage`. For a selected built-in,
cache its already-loaded CSS text with that ID and synchronously insert it at
module startup. This prevents a wrong-theme flash without a new dependency,
Tauri capability, vault I/O, or a startup fetch. Vault-theme IDs persist too,
but their CSS is not cached and is applied only once that vault is available.

Built-ins are immutable in the picker and registry UI. Discovery merges them
before vault themes. A built-in wins an ID collision; the colliding vault
directory is skipped and shown as a clear discovery warning.

## Consequences

There is no new runtime dependency and no widened Tauri scope. The initial
bundle gains the small loader/manifest metadata; each inactive theme remains a
separate approximately 2.2 kB raw JavaScript chunk containing CSS text. The
active stylesheet is the only theme CSS loaded at runtime.

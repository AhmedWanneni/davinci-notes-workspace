# Mobile Package Reuse Audit

Audit date: 2026-10-15  
Status: Complete  
Target: Mobile evaluation (Tauri v2 Mobile webview / React Native Hermes)

---

## 1. Executive Summary & Scope

This audit evaluates the codebase packages and core data paths for reuse on mobile platforms:
1. `packages/indexer` (`@app/indexer`)
2. Sync manifest & transfer code (`packages/sync-client`, `apps/desktop/src/sync/desktopManifestSource.ts`)
3. Drive OAuth code (`packages/sync-client/driveAuth.ts`, `apps/desktop/src/sync/desktopDriveAuth.ts`, `apps/desktop/src-tauri/src/oauth.rs`)
4. `packages/design-system/tokens` (and `@app/design-system`)
5. Editor and its dependencies:
   - `packages/core-types` (`@app/core-types`)
   - `packages/attachments` (`@app/attachments`)
   - `packages/sanitize` (`@app/sanitize`)
   - `packages/editor` (`@app/editor`)
6. Supporting desktop storage boundaries (`apps/desktop/src/vault/sqliteIndex.ts`, `vaultCommands.ts`, `VaultIndexer.ts`)

---

## 2. Verification Commands & Results

All checks were executed with ripgrep (`rg`) across the audited paths. Commands, result counts, and matched lines are recorded below.

### 2.1 Imports of Node Built-ins
**Command**:
```bash
rg -n "from ['\"](node:)?(fs|path|crypto|buffer|os|stream|child_process|util|assert|events)['\"]" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 10 matches across 5 files (0 matches in production source files; all matches are test fixtures or dev scripts):
- `packages/indexer/buildGraph.test.ts:1`: `import { readFileSync } from "node:fs";`
- `packages/indexer/buildGraph.test.ts:2`: `import { dirname, join } from "node:path";`
- `packages/indexer/parseFrontmatter.test.ts:1`: `import { readFileSync } from "node:fs";`
- `packages/indexer/parseFrontmatter.test.ts:2`: `import { dirname, join } from "node:path";`
- `packages/indexer/parseLinks.test.ts:1`: `import { readFileSync } from "node:fs";`
- `packages/indexer/parseLinks.test.ts:2`: `import { dirname, join } from "node:path";`
- `packages/editor/insert/DiagramInsertion.test.ts:2`: `import fs from "node:fs";`
- `packages/editor/insert/DiagramInsertion.test.ts:3`: `import path from "node:path";`
- `packages/indexer/scripts/benchmark-large-vault.ts:1`: `import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";`
- `packages/indexer/scripts/benchmark-large-vault.ts:2`: `import { join } from "node:path";`

---

### 2.2 Imports of Tauri APIs (`@tauri-apps/*`)
**Command**:
```bash
rg -n "@tauri-apps" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 2 matches across 2 files (0 matches in `packages/*`):
- `apps/desktop/src/sync/desktopDriveAuth.ts:1`: `import { invoke } from "@tauri-apps/api/core";`
- `apps/desktop/src/sync/desktopManifestSource.ts:1`: `import { invoke } from "@tauri-apps/api/core";`

---

### 2.3 DOM / Window / Document Globals (Non-Test Source)
**Command**:
```bash
rg -n "\b(window|document|navigator|HTMLElement|localStorage|sessionStorage|DOMParser)\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/*.test.*' --glob '!**/*.stories.*'
```
**Result Count**: 46 matches across 18 files.
- `packages/indexer`: 0 matches
- `packages/sync-client`: 0 matches
- `packages/design-system/tokens`: 0 matches
- `packages/core-types`: 0 matches
- `packages/attachments`: 0 matches (only `Blob` type used in `attachmentWriter.ts:9`)
- `packages/sanitize`:
  - `packages/sanitize/sanitizeHtml.ts:50`: `const window = globalThis.window as WindowLike | undefined;`
  - `packages/sanitize/sanitizeHtml.ts:51`: `if (!window) throw new Error("sanitizeHtml requires a DOM window");`
  - `packages/sanitize/sanitizeHtml.ts:59`: `const purifier = createDOMPurify(window);`
  - `packages/sanitize/iframePolicy.ts:51`: `const window = globalThis.window;`
  - `packages/sanitize/iframePolicy.ts:52`: `if (!window) throw new Error("applyIframePolicy requires a DOM window");`
  - `packages/sanitize/iframePolicy.ts:53`: `const document = new window.DOMParser().parseFromString(\`<body>\${html}</body>\`, "text/html");`
- `packages/editor`: 39 matches (CodeMirror 6 decorations, widgets, DOM listeners, e.g. `document.createElement`, `HTMLElement`, `window.open`, `DOMParser`).

---

### 2.4 Hermes Incompatibility: Regex Lookbehind
**Command**:
```bash
rg -n "\(\?<[=!]" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 4 matches across 4 files:
- `packages/indexer/parseLinks.ts:4`:
  ```ts
  export const MARKDOWN_LINK_PATTERN = /(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g;
  ```
- `packages/editor/links/linkExtension.ts:18`:
  ```ts
  export const MARKDOWN_LINK_REGEX = /(?<!!)\[([^\]]*)\]\((<[^>\n]+>|[^)\s]+)\)/g;
  ```
- `packages/editor/insert/SlashMenuTrigger.ts:66`:
  ```ts
  /(?<!\\)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
  ```
- `packages/editor/blocks/math/mathExtension.ts:172`:
  ```ts
  /(?<!\\)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
  ```

---

### 2.5 Hermes Incompatibility: `Intl`
**Command**:
```bash
rg -n "\bIntl\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 2 matches in 1 file:
- `packages/indexer/parseReminders.ts:65`:
  ```ts
  const formatter = new Intl.DateTimeFormat("en-US", {
  ```
- `packages/indexer/parseReminders.ts:122`:
  ```ts
  (typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC") ??
  ```

---

### 2.6 Hermes Incompatibility: `structuredClone`
**Command**:
```bash
rg -n "\bstructuredClone\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 0 matches.

---

### 2.7 Hermes Incompatibility: `TextEncoder` / `TextDecoder`
**Command**:
```bash
rg -n "\b(TextEncoder|TextDecoder)\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 3 matches across 3 files:
- `packages/sync-client/driveSyncPass.ts:36`:
  ```ts
  return JSON.parse(new TextDecoder().decode(bytes)) as ManifestSnapshot;
  ```
- `packages/sync-client/driveManifestStore.ts:20`:
  ```ts
  return JSON.parse(new TextDecoder().decode(body)) as ManifestSnapshot;
  ```
- `apps/desktop/src/sync/desktopDriveAuth.ts:27`:
  ```ts
  await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  ```

---

### 2.8 Hermes Incompatibility: `URL` / `URLSearchParams` (Non-Test Source)
**Command**:
```bash
rg -n "\b(URL|URLSearchParams)\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/*.test.*'
```
**Result Count**: 17 matches across 7 files:
- `packages/sync-client/driveApi.ts:17`: `request(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;`
- `packages/sync-client/driveApi.ts:79`: `const params = new URLSearchParams({`
- `packages/sync-client/driveApi.ts:94`: `const params = new URLSearchParams({ spaces: "appDataFolder" });`
- `packages/sync-client/driveApi.ts:108`: `const params = new URLSearchParams({`
- `packages/sync-client/driveApi.ts:158`: `const params = new URLSearchParams({`
- `packages/sync-client/driveApi.ts:182`: `const params = new URLSearchParams({`
- `packages/sync-client/driveAuth.ts:65`: `const url = new URL(request.authorizationEndpoint);`
- `packages/sync-client/driveAuth.ts:66`: `url.search = new URLSearchParams({`
- `apps/desktop/src/sync/desktopDriveAuth.ts:46`: `const request = async (params: URLSearchParams): Promise<OAuthToken> => {`
- `apps/desktop/src/sync/desktopDriveAuth.ts:81`: `new URLSearchParams({`
- `apps/desktop/src/sync/desktopDriveAuth.ts:91`: `new URLSearchParams({`
- `packages/sanitize/iframePolicy.ts:30`: `export function validateIframeSrc(rawSrc: string): URL | null {`
- `packages/sanitize/iframePolicy.ts:32`: `try { url = new URL(rawSrc); } catch { return null; }`
- `packages/editor/embeds/tweetEmbed.ts:6`: `try { url = new URL(rawUrl.trim().replace(/^<|>$/g, "")); } catch { return null; }`
- `packages/editor/embeds/youtubeEmbed.ts:6`: `try { url = new URL(rawUrl.trim().replace(/^<|>$/g, "")); } catch { return null; }`
- `packages/editor/insert/mediaValidation.ts:36`: `parsed = new URL(trimmed);`
- `packages/editor/blocks/html/htmlBlockExtension.ts:79`: `const hostname = new URL(iframe.src).hostname;`

---

### 2.9 Hermes Incompatibility: `crypto` / `crypto.subtle`
**Command**:
```bash
rg -n "\bcrypto\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 3 matches across 2 files:
- `apps/desktop/src/sync/desktopDriveAuth.ts:24`: `randomBytes: (length) => crypto.getRandomValues(new Uint8Array(length)),`
- `apps/desktop/src/sync/desktopDriveAuth.ts:27`: `await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),`
- `packages/sync-client/driveApi.ts:171`: `const boundary = \`davinci-\${crypto.randomUUID()}\`;`

---

### 2.10 Hermes Incompatibility: `BigInt` and `WeakRef`
**Commands**:
```bash
rg -n "\bBigInt\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
rg -n "\bWeakRef\b" packages/indexer packages/sync-client packages/design-system/tokens packages/editor packages/attachments packages/core-types packages/sanitize apps/desktop/src/sync --glob '!**/node_modules/**' --glob '!**/dist/**'
```
**Result Count**: 0 matches for `BigInt`, 0 matches for `WeakRef`.

---

### 2.11 Circular Dependency Check
**Command**:
```bash
npx madge --circular --extensions ts,tsx packages/indexer/index.ts packages/sync-client/index.ts packages/core-types/index.ts packages/attachments/index.ts packages/sanitize/index.ts packages/editor/index.ts packages/design-system/index.ts
```
**Result**: 1 circular dependency found in `packages/editor`:
```
editor/blocks/html/index.ts 
  -> editor/blocks/html/htmlBlockExtension.ts 
  -> editor/embeds/index.ts 
  -> editor/embeds/NoteEmbedWidget.ts 
  -> editor/embeds/createReadOnlyEmbedView.ts 
  -> editor/blocks/html/index.ts
```
Exact importing lines:
- `packages/editor/blocks/html/htmlBlockExtension.ts:4`:
  ```ts
  import { mountTweetCard, tweetImageToStatusUrl, youtubeEmbedVideoId, youtubeImageToIframe, youtubeThumbnailUrl } from "../../embeds";
  ```
- `packages/editor/embeds/createReadOnlyEmbedView.ts:18-20`:
  ```ts
  import {
    htmlBlockExtension,
    htmlInlineExtension,
  } from "../blocks/html";
  ```
All other package barrels (`packages/indexer`, `packages/sync-client`, `packages/core-types`, `packages/attachments`, `packages/sanitize`, `packages/design-system`) had **0 circular dependencies**.

---

## 3. Detailed Audit by Area

### 3.1 `packages/indexer` (`@app/indexer`)
- **Node built-ins / Tauri APIs / DOM**: 0 in production code. (Node built-ins used only in Vitest test files and `scripts/benchmark-large-vault.ts`).
- **Hermes compatibility**:
  - Regex lookbehind in `packages/indexer/parseLinks.ts:4`: `/(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g`. Fails in Hermes engines lacking negative lookbehind.
  - `Intl.DateTimeFormat` in `packages/indexer/parseReminders.ts:65, 122`: relies on `formatToParts` with specific `timeZone`. Hermes needs Intl polyfill if running in non-ICU mode.
- **SQLite access**: Present only in `packages/indexer/searchExecution.ts`. It accesses SQLite exclusively through the **injectable interface** `SearchDatabase` (`packages/indexer/searchExecution.ts:8-10`):
  ```ts
  export interface SearchDatabase {
    select<T>(query: string, bindings?: unknown[]): Promise<T[]>;
  }
  ```
  It has 0 hard-wired dependency on Tauri's SQL plugin. (Desktop indexing writes live in `apps/desktop/src/vault/sqliteIndex.ts`).
- **File I/O**: 0 direct file I/O in production code. All parsers are pure text-in, model-out functions.
- **Circular imports**: 0 circular imports detected in `packages/indexer/index.ts`.

---

### 3.2 Sync Manifest & Transfer Code
- **`packages/sync-client`**:
  - **Node built-ins / Tauri APIs**: 0.
  - **DOM globals**: 0.
  - **Hermes compatibility**:
    - `new TextDecoder().decode(...)` in `driveSyncPass.ts:36` and `driveManifestStore.ts:20`. Needs polyfill on Hermes.
    - `new URLSearchParams(...)` in `driveApi.ts:79, 94, 108, 158, 182`.
    - `crypto.randomUUID()` in `driveApi.ts:171`. Needs random UUID helper or polyfill.
  - **SQLite access**: None.
  - **File I/O**: 100% injectable through clean abstractions:
    - `ManifestSource` (`packages/sync-client/manifest.ts:18-21`): `listFiles()`, `hashFile(path)`.
    - `ManifestStorage` (`packages/sync-client/manifestStore.ts:8-11`): `read()`, `write(value)`.
    - `LocalChangeApplier` (`packages/sync-client/applyPulledChanges.ts:8-11`): `write(path, content)`, `remove(path)`.
  - **Circular imports**: 0 circular imports detected.
- **Desktop Transfer Adapter (`apps/desktop/src/sync/desktopManifestSource.ts`)**:
  - Hard-wired to desktop Tauri IPC (`apps/desktop/src/sync/desktopManifestSource.ts:1`: `import { invoke } from "@tauri-apps/api/core";`). Cannot be reused on mobile as-is; mobile requires a mobile-specific `ManifestSource`.

---

### 3.3 Drive OAuth Code
- **`packages/sync-client/driveAuth.ts`**:
  - Pure protocol logic for PKCE OAuth 2.0.
  - Reusable as-is. Already exposes clean injectable seams:
    - `TokenStore` (`packages/sync-client/driveAuth.ts:21-25`): `load()`, `save(token)`, `clear()`.
    - `OAuthTransport` (`packages/sync-client/driveAuth.ts:14-19`): `exchangeCode()`, `refresh()`.
    - `PkceProvider` (`packages/sync-client/driveAuth.ts:8-12`): `randomBytes()`, `sha256()`.
- **Desktop OAuth Implementation (`apps/desktop/src/sync/desktopDriveAuth.ts` & `apps/desktop/src-tauri/src/oauth.rs`)**:
  - Hard-wired to desktop Tauri IPC (`apps/desktop/src/sync/desktopDriveAuth.ts:1`: `import { invoke } from "@tauri-apps/api/core";`).
  - Spawns a local TCP loopback webserver on `127.0.0.1:0` (`start_oauth_listener`).
  - Uses Web Crypto (`crypto.subtle`, `crypto.getRandomValues`).
  - **Desktop-only**: Mobile operating systems (iOS / Android) do not permit arbitrary background loopback servers for OAuth redirect. Mobile requires custom URI scheme callback (e.g. `com.davinci.notes://oauth/callback`) with ASWebAuthenticationSession / Android Custom Tabs.

---

### 3.4 `packages/design-system/tokens`
- **Output files**: `packages/design-system/tokens/dist/` (`_variables.scss`, `variables.css`, `tokens.ts`).
- **Node built-ins / Tauri APIs / DOM**: 0.
- **Hermes compatibility**: 100% pure string and literal exports.
- **SQLite / File I/O**: 0.
- **Circular imports**: 0.
- **Mobile platform considerations**:
  - For Tauri v2 Mobile webview: **Reusable as-is** (loads via CSS variables / SCSS).
  - For React Native: Tokens contain web units (`"1px"`, `"1.5rem"`, `"clamp(...)"`, `"rgba(...)"`). Needs a simple build-time Style Dictionary transform to output numeric pixel values and raw hex/rgba values for React Native `StyleSheet`.

---

### 3.5 Editor & Dependent Packages

#### A. `packages/core-types` (`@app/core-types`)
- Pure TypeScript interfaces and tag parsing validators (`note.ts`, `tag.ts`, `tagParsing.ts`, etc.).
- 0 Node built-ins, 0 Tauri APIs, 0 DOM globals, 0 SQLite, 0 File I/O, 0 Hermes blockers, 0 circular imports.
- **Verdict**: **Reusable as-is**.

#### B. `packages/attachments` (`@app/attachments`)
- Defines format allowlists, filename collision suffixing, and directory resolution.
- 0 Node built-ins, 0 Tauri APIs, 0 DOM globals (except standard `Blob` type in type union).
- File I/O is 100% injectable via `AttachmentFileSystem` (`packages/attachments/attachmentWriter.ts:3-7`):
  ```ts
  export interface AttachmentFileSystem {
    exists(path: string): Promise<boolean>;
    mkdir(path: string): Promise<void>;
    writeFile(path: string, data: Uint8Array): Promise<void>;
  }
  ```
- **Verdict**: **Needs adapter** (supply mobile implementation of `AttachmentFileSystem`).

#### C. `packages/sanitize` (`@app/sanitize`)
- Wraps `dompurify` and applies iframe allowlist policies.
- Requires a DOM environment:
  - `packages/sanitize/sanitizeHtml.ts:50-51`: checks `globalThis.window`, throws if missing.
  - `packages/sanitize/iframePolicy.ts:51-53`: creates `new window.DOMParser()`.
  - `packages/sanitize/iframePolicy.ts:32`: uses `new URL(rawSrc)`.
- **Verdict**:
  - In Tauri v2 Mobile webview: **Reusable as-is** (webview provides global `window` and `DOMParser`).
  - In React Native (Hermes without DOM): **Needs adapter** (requires jsdom, a headless webview, or native string sanitizer).

#### D. `packages/editor` (`@app/editor`)
- Built directly on CodeMirror 6 (`@codemirror/*`), which is a browser DOM-centric editor engine.
- **Hermes blockers**:
  - Lookbehinds: `linkExtension.ts:18` (`(?<!!)`), `SlashMenuTrigger.ts:66` (`(?<!\\)`), `mathExtension.ts:172` (`(?<!\\)`).
  - Heavy DOM usage: `document.createElement`, `HTMLElement`, `window.open`.
- **Circular import blocker**:
  - `packages/editor/blocks/html/htmlBlockExtension.ts:4` imports `../../embeds`.
  - `packages/editor/embeds/createReadOnlyEmbedView.ts:18-20` imports `../blocks/html`.
- **Mobile platform considerations**:
  - In React Native Hermes: **Desktop/Webview-only**. CodeMirror cannot run in pure native Hermes; it requires a webview container.
  - In Tauri v2 Mobile: **Needs adapter** (break circular import barrel, replace lookbehind regexes, provide mobile touch-selection & virtual keyboard accommodations).

---

### 3.6 Desktop SQLite & Vault Storage Boundary
Where does SQLite and File I/O actually live today?
- **SQLite**:
  - `apps/desktop/src/vault/sqliteIndex.ts:2`: `import Database from "@tauri-apps/plugin-sql";`
  - `apps/desktop/src/vault/sqliteIndex.ts:53`: `Database.load("sqlite:vault-index.db")`
  - All vault persistence (`persistNotesBatch`, `clearVaultIndex`, `sqliteReminderIndex.ts`, `sqliteFtsIndex.ts`, `sqliteNoteQueries.ts`) is currently coupled directly to the desktop `Database` instance.
- **Vault File I/O**:
  - `apps/desktop/src/vault/vaultCommands.ts:1`: `import { invoke } from "@tauri-apps/api/core";`
  - Calls `invoke("read_note")`, `invoke("write_note")`, `invoke("list_notes")`, `invoke("start_vault_watcher")`.
- **Verdict**: **Desktop-only implementation**. Mobile requires an injectable vault storage and database connection seam.

---

## 4. Package Audit Summary Table

| Package / Module | Verdict | Blockers (Exact File:Line) | Proposed Adapter Seam |
|---|---|---|---|
| `packages/core-types` | **Reusable as-is** | None | None (pure models and validators) |
| `packages/design-system/tokens` | **Reusable as-is** (Webview) / **Needs adapter** (React Native) | None for Webview. For RN: CSS string values (`tokens.ts:5, 11, 43`) | Optional RN Style Dictionary transform for numeric pixels/colors |
| `packages/attachments` | **Needs adapter** | None in package; needs file I/O implementation | `AttachmentFileSystem` (`exists`, `mkdir`, `writeFile`) |
| `packages/sync-client` (manifest & transfer) | **Needs adapter** | `packages/sync-client/driveManifestStore.ts:20` (`new TextDecoder`)<br>`packages/sync-client/driveSyncPass.ts:36` (`new TextDecoder`)<br>`packages/sync-client/driveApi.ts:171` (`crypto.randomUUID`) | Mobile `ManifestSource` + `LocalChangeApplier` + `ManifestStorage`; Hermes polyfills for `TextDecoder` and `crypto.randomUUID` |
| `packages/sync-client` (Drive OAuth logic) | **Reusable as-is** | `packages/sync-client/driveAuth.ts:65-66` (`new URL`, `new URLSearchParams`) | Already exposes `TokenStore`, `OAuthTransport`, and `PkceProvider` seams |
| `apps/desktop/src/sync` (Drive auth & manifest source) | **Desktop-only** | `apps/desktop/src/sync/desktopDriveAuth.ts:1` (`@tauri-apps/api/core`)<br>`apps/desktop/src/sync/desktopManifestSource.ts:1` (`@tauri-apps/api/core`) | `MobileDriveAuthAdapter` (deep link / ASWebAuthenticationSession) and `MobileManifestSource` |
| `packages/indexer` | **Needs adapter** | `packages/indexer/parseLinks.ts:4` (`(?<!!)`)<br>`packages/indexer/parseReminders.ts:65, 122` (`Intl.DateTimeFormat`) | Mobile `SearchDatabase` implementation; non-lookbehind regex for `parseLinks.ts`; `Intl` polyfill |
| `packages/sanitize` | **Reusable as-is** (Webview) / **Needs adapter** (React Native) | `packages/sanitize/sanitizeHtml.ts:50-51` (`globalThis.window`)<br>`packages/sanitize/iframePolicy.ts:51-53` (`DOMParser`) | Needs DOM window environment (webview) or mobile native HTML sanitizer |
| `packages/editor` | **Needs adapter** (Tauri Webview) / **Desktop/Webview-only** (React Native) | `packages/editor/blocks/html/htmlBlockExtension.ts:4` & `packages/editor/embeds/createReadOnlyEmbedView.ts:18-20` (Circular import)<br>`packages/editor/links/linkExtension.ts:18` (`(?<!!)`)<br>`packages/editor/insert/SlashMenuTrigger.ts:66` (`(?<!\\)`)<br>`packages/editor/blocks/math/mathExtension.ts:172` (`(?<!\\)`)<br>CodeMirror 6 DOM dependency (`document.createElement`, `HTMLElement`) | Break barrel circular import between `blocks/html` and `embeds`; rewrite lookbehind regexes; host editor in WebView bridge for mobile UI |
| `apps/desktop/src/vault` (Vault SQLite & I/O) | **Desktop-only** | `apps/desktop/src/vault/sqliteIndex.ts:2` (`@tauri-apps/plugin-sql`)<br>`apps/desktop/src/vault/vaultCommands.ts:1` (`@tauri-apps/api/core`) | Extract `VaultStorageAdapter` (`readNote`, `writeNote`, `listNotes`) and `VaultSqliteAdapter` (`getDb`, `withDbLock`, `withDbTransaction`) |

---

## 5. Ranked List of Adapter Seams Needed (Cheapest First)

1. **`AttachmentFileSystem` Adapter** *(Cheapest)*
   - **Cost**: ~20 lines of code.
   - **Interface**: Already cleanly defined in `packages/attachments/attachmentWriter.ts` (`exists`, `mkdir`, `writeFile`).
   - **Action**: Implement for mobile file sandbox (via Tauri Mobile fs or native filesystem).

2. **`ManifestSource`, `LocalChangeApplier`, and `ManifestStorage` Adapters**
   - **Cost**: ~50–70 lines of code.
   - **Interface**: Already cleanly defined in `packages/sync-client` (`manifest.ts`, `applyPulledChanges.ts`, `manifestStore.ts`).
   - **Action**: Implement native mobile file listing, BLAKE3/SHA-256 hashing, and JSON manifest snapshot persistence in mobile app storage.

3. **`SearchDatabase` Adapter**
   - **Cost**: ~15–30 lines of code.
   - **Interface**: Already cleanly defined in `packages/indexer/searchExecution.ts` (`select<T>(query, bindings)`).
   - **Action**: Connect mobile SQLite connection to this single-method interface to reuse the entire search query execution engine.

4. **Editor Barrel Decoupling (Fix Circular Dependency)**
   - **Cost**: ~10 lines of code across 2 files.
   - **Blocker**: Circular dependency between `packages/editor/blocks/html` and `packages/editor/embeds`.
   - **Action**: Change `htmlBlockExtension.ts` and `createReadOnlyEmbedView.ts` to import from internal leaf files rather than sibling barrel `index.ts` files.

5. **Hermes Regex Lookbehind Replacements**
   - **Cost**: ~25 lines of code across 4 files (`parseLinks.ts`, `linkExtension.ts`, `SlashMenuTrigger.ts`, `mathExtension.ts`).
   - **Blocker**: Hermes syntax error on `(?<!!)` and `(?<!\\)`.
   - **Action**: Replace negative lookbehinds with prefix-capturing groups or manual character index checks (e.g. check `content[match.index - 1] !== '!'`).

6. **Hermes Runtime Polyfills (`TextDecoder`, `URLSearchParams`, `crypto.randomUUID`, `Intl`)**
   - **Cost**: Low (standard bundle imports).
   - **Action**: Inject `fast-text-encoding`, `react-native-url-polyfill`, and random UUID helper into mobile runtime entry point.

7. **`VaultStorageAdapter` & `VaultSqliteAdapter` (Extract from Desktop)**
   - **Cost**: Moderate (~150–200 lines).
   - **Current State**: Hard-wired to desktop Tauri IPC in `apps/desktop/src/vault/sqliteIndex.ts` and `vaultCommands.ts`.
   - **Action**: Extract shared interfaces for vault file I/O (`readNote`, `writeNote`, `listNotes`, `deleteNote`) and SQLite operations so mobile and desktop can share `VaultIndexer.ts` and reconciliation logic.

8. **`MobileDriveAuthAdapter` (Custom URI / Deep Link PKCE Flow)**
   - **Cost**: Moderate (~100–150 lines).
   - **Current State**: Desktop relies on a local TCP loopback webserver (`127.0.0.1:0`).
   - **Action**: Implement mobile OAuth PKCE using `ASWebAuthenticationSession` (iOS) and Android Custom Tabs with a registered app deep link (`com.davinci.notes://oauth/callback`), plugging into `DriveTokenManager`.

9. **Mobile Editor Host / WebView Bridge** *(Most Complex)*
   - **Cost**: High.
   - **Current State**: `@app/editor` relies on CodeMirror 6 and browser DOM APIs.
   - **Action**: If mobile is Tauri v2 Mobile, wrap the editor in mobile-responsive viewport controls and touch selection handlers. If mobile is React Native, host `@app/editor` inside a dedicated `WebView` communicating via a typed JSON bridge.

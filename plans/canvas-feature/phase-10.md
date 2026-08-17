# Implementation Plan — Canvas Phase 10: Webpage Embed Cards

## Problem Description
Phase 10 of the Canvas Feature Plan implements **Webpage Embed Cards** (JSON Canvas 1.0 `link` node type). Users can embed live web pages by pasting a URL onto the canvas, interact with them within the card, resize the card with fluid reflow, edit the URL after creation, and enjoy specialized responsive player embeds for YouTube URLs.

Because this feature executes untrusted third-party JavaScript within an application running inside a privileged Tauri v2 desktop webview (which has filesystem and SQLite access), **security sandboxing and origin isolation are top-priority requirements**.

---

## 1. Threat Model & Security Architecture

### Threat Model
- **Host Process**: Tauri v2 application executing on desktop (macOS WebKit WKWebView / Windows WebView2 / Linux WebKitGTK) with native capabilities (filesystem plugin, SQLite plugin, native dialogs, Rust backend IPC).
- **Attack Vector**: An embedded webpage card loads arbitrary third-party URLs input by the user or deserialized from shared `.canvas` files.
- **Threat Actions to Prevent**:
  1. **IPC & Native API Access**: Embedded content must never access `window.__TAURI__`, `window.__TAURI_INTERNALS__`, or invoke backend Rust commands.
  2. **Parent DOM / JavaScript Context Access**: Embedded content must not traverse `window.parent` / `window.top`, read/modify host DOM, or access host localStorage/cookies/vault data.
  3. **Parent Window Navigation / Hijacking**: Embedded content must never redirect the host application (`window.top.location = ...`).
  4. **Local Scheme & Filesystem Access**: Embedded content must never load local URLs (`file://`, `tauri://`, `asset://`, `app://`) or local vault files.
  5. **Dialog & Modal Abuse**: Embedded content must not trigger modal spam (`alert()`, `confirm()`, `prompt()`) blocking the host UI.

### Sandboxing & Defense-in-Depth Implementation
1. **URL Scheme Whitelist**:
   - Only `http:` and `https:` schemes are permitted.
   - Dangerous schemes (`javascript:`, `data:`, `file:`, `tauri:`, `blob:`, `about:`, `vbscript:`) are rejected and sanitized.
2. **Strict iframe `sandbox` Attribute**:
   - Allowed tokens: `allow-scripts allow-same-origin allow-forms allow-presentation`
     - `allow-scripts`: Required for interactive dynamic sites and video players to run scripts in their frame.
     - `allow-same-origin`: Required for external domains to load their assets and manage their frame-scoped storage on their domain. Because the origin is `https://external.com`, standard browser same-origin policy isolates it completely from the host's `tauri://localhost` origin.
     - `allow-forms`: Allows form submissions (e.g. search bars on the embedded page).
     - `allow-presentation`: Enables responsive video playback and presentation features.
   - **Explicitly Forbidden Tokens** (Enforced & Tested):
     - `allow-top-navigation`: **FORBIDDEN** (prevents top-level redirection).
     - `allow-top-navigation-by-user-activation`: **FORBIDDEN**.
     - `allow-top-navigation-to-custom-protocols`: **FORBIDDEN**.
     - `allow-modals`: **FORBIDDEN** (prevents modal lockup).
     - `allow-pointer-lock`: **FORBIDDEN**.
3. **HTTP Referrer Policy**:
   - `referrerPolicy="strict-origin-when-cross-origin"` on all `<iframe>` elements to avoid leaking local note paths or private vault metadata.
4. **Tauri IPC Isolation**:
   - In Tauri v2, IPC bindings are injected only into windows declared in capabilities (`default.json`). External child `<iframe>` elements do not inherit IPC hooks.

---

## 2. Webpage Node Data Model (JSON Canvas 1.0 Spec)
In adherence to the open JSON Canvas 1.0 specification:
- Node type: `"link"`
- Data fields:
  ```json
  {
    "id": "link-uuid",
    "type": "link",
    "url": "https://example.com",
    "x": 100,
    "y": 100,
    "width": 480,
    "height": 360,
    "color": "1"
  }
  ```
- Spec constants added to `canvasConstants.ts`:
  - `DEFAULT_LINK_CARD_WIDTH = 480`
  - `DEFAULT_LINK_CARD_HEIGHT = 360`
  - `MIN_LINK_CARD_WIDTH = 200`
  - `MIN_LINK_CARD_HEIGHT = 120`
  - `createLinkCardId()` (`link-${crypto.randomUUID()}`)

---

## 3. Creation & Interaction Flow
1. **Paste URL onto Canvas**:
   - `useCanvasDropPaste.ts` intercepts clipboard paste. If text matches a valid URL (`http://...` or `https://...`), creates a new `link` card centered in current view.
2. **Drag & Drop URL onto Canvas**:
   - `useCanvasDropPaste.ts` detects URL text in drop event and creates a `link` card at drop coordinates.
3. **YouTube Embed Special-Casing**:
   - Detects `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`, `youtube.com/embed/...`.
   - Converts to privacy-enhanced embed: `https://www.youtube-nocookie.com/embed/{id}?start={timestamp}`.
4. **Card UI & Resize**:
   - `LinkCardNode.tsx` with header displaying domain/favicon, external open button, URL edit button, and sandboxed iframe body.
   - Snaps to canvas grid on resize end; fluid reflow of iframe contents.
5. **Change URL Action**:
   - Header edit button toggles `LinkCardUrlEditor.tsx` inline/popover input to update URL.
   - Context menu provides "Change URL", "Open in browser", color picker, and delete card.

---

## Proposed Changes

### `@app/canvas`

#### [NEW] `packages/canvas/linkCardUtils.ts`
- Functions: `isValidWebUrl`, `sanitizeWebUrl`, `isYouTubeUrl`, `getYouTubeEmbedUrl`, `getEmbedUrl`, `extractDomain`, `isSandboxSafe`.
- Export constants `SANDBOX_PERMISSIONS`, `FORBIDDEN_SANDBOX_TOKENS`.

#### [NEW] `packages/canvas/linkCardUtils.test.ts`
- Unit tests for URL validation, sanitization, YouTube parsing (shorts, parameters, youtu.be, timestamps), and security token checkers.

#### [NEW] `packages/canvas/LinkCardHeader.tsx`
- Header with domain display, external open button, and URL edit toggle.

#### [NEW] `packages/canvas/LinkCardUrlEditor.tsx`
- Popover/inline form for updating the card's URL.

#### [NEW] `packages/canvas/LinkCardNode.module.scss`
- Kebab-case SCSS module with design tokens for link card wrapper, header, iframe container, and loading/empty states.

#### [NEW] `packages/canvas/LinkCardNode.tsx`
- Custom React Flow node for `type === "link"`.
- Features `NodeResizer`, 4 edge handles (`top`, `right`, `bottom`, `left`), sandboxed `<iframe>`, and URL edit state.

#### [NEW] `packages/canvas/LinkCardNode.test.tsx`
- Component tests: rendering with valid URL, YouTube embed conversion, resize handlers, URL edit toggle, error/empty states.

#### [NEW] `packages/canvas/LinkCardSecurity.test.tsx`
- Explicit security boundary test suite verifying:
  - Dangerous schemas (`javascript:`, `data:`, `file:`, `tauri:`, `blob:`) are blocked.
  - Sandbox attribute contains required tokens and strictly excludes all `allow-top-navigation` and forbidden tokens.
  - Cross-origin / parent window isolation tests.

#### [MODIFY] `packages/canvas/canvasConstants.ts`
- Add `DEFAULT_LINK_CARD_WIDTH`, `DEFAULT_LINK_CARD_HEIGHT`, `MIN_LINK_CARD_WIDTH`, `MIN_LINK_CARD_HEIGHT`, `createLinkCardId`.

#### [MODIFY] `packages/canvas/canvasNodeTypes.ts`
- Register `link: LinkCardNode`.

#### [MODIFY] `packages/canvas/CanvasEditorContext.ts`
- Add `onNodeUrlChange?: (nodeId: string, url: string) => void;`.

#### [MODIFY] `packages/canvas/useCanvasFileOps.ts`
- Add `createLinkCard(url: string, position: { x: number; y: number })` and `swapNodeUrl(nodeId: string, newUrl: string)`.

#### [MODIFY] `packages/canvas/useCanvasDropPaste.ts`
- Support URL paste and URL drag-and-drop to invoke `createLinkCard`.

#### [MODIFY] `packages/canvas/useCanvasInteractions.ts`
- Wire `createLinkCard` and `swapNodeUrl`.

#### [MODIFY] `packages/canvas/CanvasContextMenu.tsx`
- Support link card actions (Edit URL, Open in browser, Color, Delete).

#### [MODIFY] `packages/canvas/CanvasView.tsx`
- Provide `onNodeUrlChange` to `CanvasEditorContext`.

#### [MODIFY] `packages/canvas/CanvasView.test.tsx`
- Add tests for link card rendering, URL paste, and persistence.

#### [MODIFY] `packages/canvas/index.ts`
- Export `LinkCardNode`, `linkCardUtils` public helpers, constants.

---

### Documentation & Architecture

#### [NEW] `docs/adr/0054-canvas-webpage-embed-cards-and-sandboxing-security.md`
- Dedicated ADR for the security model, iframe sandboxing tokens, protocol sanitization, and YouTube embed transformation.

#### [MODIFY] `DECISIONS.md`
- Add row for ADR-0054 in Canvas table.

#### [MODIFY] `PROGRESS.md`
- Update with Phase 10 completion details, security test results, and next steps.

---

## Verification Plan

### Automated Tests
- `pnpm --filter @app/canvas test`: run all canvas test suites (including new `linkCardUtils.test.ts`, `LinkCardNode.test.tsx`, `LinkCardSecurity.test.tsx`, and updated `CanvasView.test.tsx`).
- `pnpm typecheck`: verify full TypeScript compilation across workspace.
- `pnpm lint`: verify zero lint errors and file line length limits (<250 lines).

### Explicit Security Boundary Test
- Automated test in `LinkCardSecurity.test.tsx` verifying:
  1. `javascript:`, `file:`, `data:` URLs are rejected and never passed to iframe `src`.
  2. The iframe `sandbox` string contains `allow-scripts`, `allow-same-origin`, `allow-forms`, `allow-presentation`.
  3. The iframe `sandbox` NEVER contains `allow-top-navigation`, `allow-top-navigation-by-user-activation`, `allow-modals`, or `allow-pointer-lock`.
  4. Cross-origin parent isolation boundary.

### Manual Verification
- Render a live webpage card on canvas.
- Paste YouTube URL -> verify privacy-enhanced embed player.
- Resize card -> verify fluid reflow.
- Edit URL -> verify update and debounced save.

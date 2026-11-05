# ADR-0253: Interactive Widgets and Sandboxed Iframe Rendering

## Status

Accepted

## Context

When users ask the AI agent to explain visual concepts (animations, physics simulations, algorithms, diagrams, or interactive charts), textual explanations or static code blocks are often insufficient. The application needs a way for the AI agent to emit self-contained HTML/SVG/JS widgets that render smoothly both in AI chat and inside markdown notes in CodeMirror 6.

Because markdown notes can sync across untrusted environments or contain AI-generated script logic, widget execution introduces severe security and performance risks:
1. Malicious scripts could call `parent.__TAURI_INTERNALS__.invoke` or access the host window/DOM.
2. Malicious scripts could read `localStorage` or session cookies.
3. Untrusted scripts could make unauthorized external network requests (`fetch`/`XHR`) to exfiltrate note contents.
4. Active iframes could leak GPU and memory resources or block typing responsiveness in the editor.

## Decision

1. **Markdown Fenced Code Block Format (`widget`)**:
   - Widgets are represented as standard markdown fenced code blocks: ````widget ... ````.
   - Plain markdown files remain fully portable, tool-call agnostic, and compatible across all AI model providers (Ollama, Gemini, OpenRouter).

2. **Shared Zero-Dependency Renderer (`packages/editor/blocks/widget/`)**:
   - `buildWidgetHtml` constructs a complete HTML document for the iframe's `srcdoc`.
   - Injects computed design token CSS variables (`--color-bg-primary`, `--color-text-normal`, `--color-border-subtle`, `--color-accent`) into `:root` for dark/light theme parity.
   - Injects a strict inner Content Security Policy:
     `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; form-action 'none';`
     This strictly forbids outbound network calls (`fetch`, XHR, WebSocket), prevents form phishing, and permits only inline script and style evaluation.

3. **Strict Sandboxed Iframe Isolation**:
   - Rendered using `<iframe sandbox="allow-scripts" referrerpolicy="no-referrer">`.
   - `allow-same-origin` is strictly omitted, ensuring the iframe runs under an opaque `null` origin. Access to `parent`, `window.localStorage`, and `document.cookie` throws cross-origin `DOMException` or `SecurityError`.

4. **CodeMirror 6 Live-Preview & Cursor Gating**:
   - `widgetExtension` registers a `StateField<DecorationSet>` providing `Decoration.replace({ block: true })`.
   - When cursor is inside the fenced code block, the widget is hidden and the raw markdown source is revealed for seamless editing.
   - `WidgetBlockWidget.eq(other)` compares source content. Keystrokes outside the widget preserve the existing iframe DOM node without triggering a reload.
   - Notes with 0 widgets return `Decoration.none`, incurring 0 KB iframe overhead.

5. **Resource Management & Active Iframe Capping**:
   - Global active iframe cap of 6 (`MAX_ACTIVE_WIDGET_IFRAMES`).
   - `IntersectionObserver` tracks viewport visibility. Offscreen widgets unmount their iframes and render a suspended placeholder to conserve GPU and memory.
   - Auto-resizing is communicated via `postMessage({ type: 'davinci:widget-resize', height })` and clamped between 60px and 500px (`DEFAULT_WIDGET_MAX_HEIGHT`).

6. **Chat Streaming Safety**:
   - In chat messages (`AgentMarkdownContent`), widgets are never mounted while the message is still streaming (`isStreaming === true`) or when the code block is unterminated. A lightweight pulse placeholder (`AgentWidgetPlaceholder`) is shown until the block completes.

## Consequences

- Interactive widgets execute safely with zero network access and zero host privilege.
- Editor typing performance remains fast and uninhibited.
- Clean fallback to raw source when editing or when iframes are suspended.

# ADR-0193: Mobile Read-Only JSON Canvas Rendering and Cycle Detection

## Context

Desktop DaVinci Notes supports JSON Canvas 1.0 files (`.canvas`) with full drag-and-drop editing, node resizing, and React Flow rendering. On mobile, loading a full visual canvas editor would bloat the initial bundle by hundreds of kilobytes and create complex touch conflicts.

Mobile users require a lightweight, read-only canvas viewer that renders JSON Canvas files faithfully with pan/zoom capabilities, while strictly avoiding infinite recursion when nested canvases contain circular references (e.g., Canvas A embeds Canvas B, which embeds Canvas A).

## Decisions

### 1. Lazy-Loaded Read-Only Webview
- JSON Canvas rendering is completely decoupled from initial app startup and lazy-loaded only when a `.canvas` file is opened.
- Rendering uses standard HTML/SVG vector transforms inside an isolated DOM component (`CanvasViewerDom.tsx`), supporting touch pan and pinch-to-zoom gestures.
- No editing capabilities (node creation, handle manipulation, or edge drafting) are loaded, keeping the mobile bundle footprint minimal.

### 2. Strict Cycle Detection & Nesting Bounds
- When a `file` node references another `.canvas` file, the loader evaluates the sub-canvas recursively:
  1. **Ancestor Chain Tracking**: The parser passes an immutable `ancestorChain: Set<string>` representing the file paths of all parent canvases currently on the stack.
  2. **Cycle Prevention**: If `ancestorChain.has(childPath)`, recursion is aborted immediately. The node renders a safe fallback placeholder (`⚠️ Circular canvas embed: <filename>`) rather than crashing or freezing the app.
  3. **Depth Cap**: Enforce a hard recursion limit `MAX_CANVAS_DEPTH = 3`. Deeply nested canvases beyond depth 3 render a depth cap placeholder.

## Consequences

- Circular canvas files cannot cause memory exhaustion, call-stack overflow, or app freezes.
- 0 KB canvas editor dependencies (React Flow, editing toolbars) in the mobile bundle.
- Fluid 60 FPS panning and zooming for viewing mindmaps and diagrams on mobile devices.

# ADR-0050: Path-based media references and native media elements for canvas cards

## Status
Accepted

## Context
Phase 7 adds support for image and video cards to `@app/canvas`. We needed to decide:
1. The data representation in `.canvas` files (JSON Canvas 1.0 specification alignment).
2. The rendering mechanism and layout constraints inside canvas cards.
3. Aspect ratio handling during resizing.

## Decision
- **JSON Canvas 1.0 `file` Node Variant**: Media cards use the standard `file` node type (`type: "file"`, `file: "path/to/media.ext"`). No custom node type is introduced.
- **Path-Based Reference Only (No Base64)**: Aligned with ADR-0004, media cards store only a vault-relative path in the `.canvas` JSON file. Binary media is never embedded as base64.
- **Native `<img>` and `<video>` with `object-fit: contain`**: Media is rendered via standard browser elements. `object-fit: contain` is used to prevent unexpected cropping of diagrams and illustrations.
- **Lazy Loading**: `loading="lazy"` and `decoding="async"` on images, `preload="metadata"` on videos.
- **Aspect Ratio Locking**: Image cards default to `keepAspectRatio={true}` on `<NodeResizer />` to prevent distortion during card resize, snapping dimensions to the 24px grid on resize completion. Videos and markdown notes use free-form resizing (`keepAspectRatio={false}`).

## Consequences
- 100% compliant with JSON Canvas 1.0 open format and interoperable with external tools (Obsidian).
- Zero base64 payload bloat in `.canvas` files.
- Smooth rendering and minimal memory footprint even with large media libraries.

# ADR-0056: Canvas Export Webpage Card Fallback

## Context

Webpage cards in the Canvas feature use `<iframe>` elements to embed external content. Standard DOM-to-image libraries (like `html-to-image`) cannot capture the content of an `<iframe>` due to browser security restrictions (Cross-Origin Resource Sharing / CORS) and the nature of iframes being separate browsing contexts.

When exporting a canvas to an image (viewport or full canvas), iframes typically appear as blank white or gray boxes, which can be confusing to the user.

## Decision

We will explicitly handle webpage cards during the export process by rendering a visual placeholder instead of trying (and failing) to capture the iframe content.

The fallback will:
1. Be triggered by an `isExporting` flag in the `CanvasEditorContext`.
2. Display a standard "Webpage Preview" card UI.
3. Include the URL of the webpage and a globe icon to provide visual context.
4. Use CSS and DOM elements that are easily capturable by the export mechanism.

This ensures that the exported image contains a meaningful representation of the webpage card, even if the live content cannot be rendered.

## Consequences

- **Pros**: 
  - Prevents confusing blank boxes in exports.
  - Provides a consistent and branded placeholder for external content.
  - Avoids complex and fragile workarounds like server-side screenshotting or attempting to bypass iframe security.
- **Cons**: 
  - The exported image does not show the actual content of the webpage.
  - Requires maintaining the `isExporting` state across the canvas component tree.

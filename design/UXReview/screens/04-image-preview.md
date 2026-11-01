# Screen Review: Image Preview Leaf

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/ImagePreview/ImagePreviewLeaf.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/ImagePreview/ImagePreviewLeaf.tsx), [`ImagePreviewToolbar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/ImagePreview/ImagePreviewToolbar.tsx), [`ImagePreviewInfoBar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/ImagePreview/ImagePreviewInfoBar.tsx)
- **Entry Points**: Opening any raster or vector image (.png, .jpg, .svg, .webp) from the file tree.
- **Purpose & Core User Job**: Dedicated workspace tab for inspecting vault images with zoom controls (Zoom in, Zoom out, Reset zoom, Fit to window) and metadata info (dimensions, file size).
- **Current State Description**: Dark centered canvas with floating zoom toolbar and bottom metadata info bar.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Zoom percentage displayed continuously in toolbar. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Standard image viewer interaction model. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Reset zoom button restores 100% scale instantly; close tab with `Cmd+W`. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard zoom and pan mouse wheel controls. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Clamped zoom bounds (10% to 500%) prevent infinite zoom-out loss. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Dimensions (`1920 × 1080 px`) and file size displayed on info bar. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Mouse wheel zoom with Ctrl/Cmd key modifier. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Unobtrusive floating controls. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Broken image path displays fallback message. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Tooltips on zoom buttons. |
| Laws of UX | Fitts's Law | **Pass** | Floating toolbar buttons have 32px targets. |
| Laws of UX | Hick's Law | **Pass** | Focused 4-button zoom control. |
| Laws of UX | Jakob's Law | **Pass** | Parity with VS Code image preview tab. |
| Laws of UX | Miller's Law | **Pass** | Single task view. |
| Laws of UX | Doherty Threshold | **Pass** | Smooth hardware-accelerated CSS transform scaling. |
| Laws of UX | Postel's Law | **Pass** | Handles both vault-relative and absolute paths. |
| Laws of UX | Von Restorff | **Pass** | Checkerboard transparency background distinguishes transparent PNGs/SVGs. |
| Gestalt Laws | Figure-Ground | **Pass** | Clear contrast between image figure and dark canvas ground. |
| Design System | Flat & Tokens | **Pass** | Floating toolbar uses token borders without drop shadows. |
| A11y & Perf | Performance & Memory | **Pass** | Native image rendering; zero CPU overhead when idle. |

---

## 3. Issues & Recommended Fixes

### IMG-01: Lacks Pan Drag When Zoomed In Beyond Viewport
- **Severity**: Medium
- **Rule Violated**: H3 User Control and Freedom + Jakob's Law
- **Evidence**: `ImagePreviewLeaf.tsx:64-90`: When zoomed to 200%+, image overflows container, but there is no click-and-drag panning `[Observed]`
- **Impact**: User cannot pan around high-resolution images when zoomed in; must rely on window scrollbars.
- **Suggested Fix**: Add click-and-drag panning state when `zoom > 1.0`:
  ```tsx
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1.0) return;
    // track drag delta and update pan coordinates
  };
  ```
- **Effort**: S (<30m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.image-preview-toolbar` | Border + bg-primary-alt | Floating toolbar | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Instant metadata readout (pixel dimensions and byte size) without opening file inspector.
- Transparent background pattern clarifies transparent SVG/PNG artwork.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add mouse-drag panning when zoomed in.
- **Larger Work**: None.

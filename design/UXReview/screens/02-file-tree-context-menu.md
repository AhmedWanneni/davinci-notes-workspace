# Screen Review: File Tree Context Menu

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/FileTree/FileTreeContextMenu.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/FileTreeContextMenu.tsx), [`useContextMenuDismiss.ts`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/useContextMenuDismiss.ts)
- **Entry Points**: Right-click on any note, canvas, or folder row in the file tree.
- **Purpose & Core User Job**: Offers context-sensitive file operations: Open, Open in new tab, Rename (`F2`), Duplicate, Bookmark, Reveal in Finder / File Manager, and Delete.
- **Current State Description**: Floating popup menu clamped to viewport boundaries, styled with `--color-bg-primary-alt` and `--color-border-subtle`.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Hover background on active item. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Standard right-click contextual actions. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Capture-phase click-away dismissal and Escape key dismissal. |
| Nielsen Heuristics | H4 Consistency and standards | **Partial** | Uses custom HTML div instead of standard Radix DropdownMenu / ContextMenu primitive. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Delete action separated by divider and highlighted with danger accent. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Displays shortcut hints (e.g. `F2` next to Rename). |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Fast access to file path copy and Finder reveal. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean vertical menu list with thin separators. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Deletion routes through confirmation dialog. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Self-explanatory action labels. |
| Laws of UX | Fitts's Law | **Pass** | Generous 32px height per menu row across full width. |
| Laws of UX | Hick's Law | **Pass** | Scoped strictly to 6–7 relevant file/folder actions. |
| Laws of UX | Jakob's Law | **Pass** | Matches OS and desktop IDE context menu expectations. |
| Laws of UX | Miller's Law | **Pass** | Separators chunk primary actions (Open/Rename) from destructive actions (Delete). |
| Laws of UX | Doherty Threshold | **Pass** | Synchronous render at pointer coordinates (<10ms). |
| Laws of UX | Postel's Law | **Pass** | Automatic screen edge clamping prevents off-screen placement. |
| Laws of UX | Von Restorff | **Pass** | Delete row turns red on hover. |
| Gestalt Laws | Common Region | **Pass** | Single menu container bounded by hairline border. |
| Design System | Radix Primitives | **Fail** | Custom non-Radix div lacks roving keyboard focus and screen reader announcements. |
| A11y & Perf | Keyboard Traversal | **Fail** | ArrowUp / ArrowDown keyboard navigation does not cycle through items. |

---

## 3. Issues & Recommended Fixes

### MENU-01: Custom Div Implementation Lacks Keyboard Roving Focus
- **Severity**: High
- **Rule Violated**: Accessibility Standards + H7 Efficiency + Project Design Rules
- **Evidence**: `FileTreeContextMenu.tsx:54-60`: Rendered as a raw `<div className="file-tree__context-menu">` with no arrow key listener `[Observed]`
- **Impact**: Power users and keyboard-only users who trigger context menus via Shift+F10 or context menu key cannot use `ArrowDown` / `ArrowUp` to navigate items or `Enter` to execute.
- **Suggested Fix**: Migrate to `@radix-ui/react-context-menu` (or add arrow key listener in `useContextMenuDismiss.ts` cycling `.file-tree__context-menu-item:focus`).
- **Effort**: M (1h)

### MENU-02: Hardcoded Viewport Clamping Dimensions
- **Severity**: Low
- **Rule Violated**: Postel's Law + H5 Error Prevention
- **Evidence**: `FileTreeContextMenu.tsx:46, 50`: `Math.min(x, window.innerWidth - 180)` and `Math.min(y, window.innerHeight - 220)` `[Observed]`
- **Impact**: Uses fixed estimates (180px width, 220px height) rather than measuring actual bounding client rect. If custom plugins or localized labels make the menu wider, it clips at the right edge of the window.
- **Suggested Fix**: Use Radix ContextMenu with built-in collision boundary detection (`collisionPadding={8}`).
- **Effort**: M (combined with MENU-01)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.file-tree__context-menu` | Border + bg-primary-alt | Standard contextual menu frame | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Capture-phase click-away dismissal (`useContextMenuDismiss.ts`) guarantees reliable menu closure even if clicking outside frames.
- Dangerous "Delete" action is grouped at bottom with red hover accent.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add simple `ArrowDown`/`ArrowUp` key handler to cycle focus through menu items.
- **Larger Work**:
  - Replace custom div with Radix Context Menu primitive.

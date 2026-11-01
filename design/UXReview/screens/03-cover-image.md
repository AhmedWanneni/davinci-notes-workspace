# Screen Review: Note Cover Image & Picker Modal

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/EditorArea/NoteCoverImage.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/NoteCoverImage.tsx), [`CoverImagePickerModal.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/CoverImagePickerModal.tsx)
- **Entry Points**: Hovering above the note title and clicking "Add cover", or clicking an existing cover image banner.
- **Purpose & Core User Job**: Adds a decorative header banner to notes with vertical repositioning, preset selection, local file upload, or external image URL.
- **Current State Description**: Banner header pinned above document with hover action toolbar (Change cover, Reposition, Remove), opening a 3-tab modal (Gallery presets, Upload, Link).

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Drag repositioning feedback with vertical percentage tracker. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar Notion / Obsidian banner header pattern. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Easy "Remove cover" action and cancelable modal. |
| Nielsen Heuristics | H4 Consistency and standards | **Partial** | Uses CSS Modules and non-Radix modal instead of CUBE CSS and Radix Dialog. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Graceful fallback if image URL fails to load. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Visual thumbnail gallery of curated presets. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | 1-click preset application. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Controls hide completely when mouse leaves banner area. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Can revert or re-upload anytime. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Explains drag repositioning instructions. |
| Laws of UX | Fitts's Law | **Pass** | Preset thumbnail cards have large click hitboxes. |
| Laws of UX | Hick's Law | **Pass** | Curated gallery with 12 presets; clear 3-tab categorization. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Notion cover image interaction. |
| Laws of UX | Miller's Law | **Pass** | 3 tabs (Gallery, Upload, Link). |
| Laws of UX | Doherty Threshold | **Pass** | Synchronous preview updates while dragging position. |
| Laws of UX | Postel's Law | **Pass** | Handles both local paths and web URLs. |
| Laws of UX | Von Restorff | **Pass** | Controls appear on hover without blocking document text. |
| Gestalt Laws | Common Region | **Pass** | Banner establishes clean top visual anchor. |
| Design System | CUBE CSS vs CSS Modules | **Fail** | `CoverImagePickerModal.module.scss` violates ADR-0038 CUBE CSS standard. |
| A11y & Perf | Dialog Focus Trap | **Fail** | Custom `role="dialog"` lacks Radix accessible focus trapping and keyboard focus restoration. |

---

## 3. Issues & Recommended Fixes

### COV-01: Non-Radix Modal Lacks Focus Trap and Accessibility Tree Wiring
- **Severity**: Medium
- **Rule Violated**: Accessibility Standards + Project Design Rules
- **Evidence**: `CoverImagePickerModal.tsx:55-63`: Built with raw `<div className={styles["cover-picker-overlay"]}>` and CSS modules `[Observed]`
- **Impact**: Screen readers and keyboard users cannot easily navigate tabs with arrow keys, and pressing Tab can escape the modal into background editor elements.
- **Suggested Fix**: Refactor to `@radix-ui/react-dialog` using CUBE CSS classes:
  ```tsx
  <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog__overlay" />
      <DialogPrimitive.Content className="dialog__content cover-picker-modal">
        ...
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
  ```
- **Effort**: M (1h)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.cover-picker-modal` | CSS Modules card frame | Lingering CSS module | CUBE CSS standard `.dialog__content` |

---

## 5. What Works Well
- Drag repositioning (`reposition`) is smooth and persists `cover_y` cleanly in note YAML frontmatter.
- Hover controls disappear completely when not hovered, preserving minimalist editorial presentation.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Add Escape key handler in `CoverImagePickerModal.tsx`.
- **Larger Work**:
  - Refactor modal to Radix Dialog primitive and CUBE CSS.

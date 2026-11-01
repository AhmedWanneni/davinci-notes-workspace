# Screen Review: Tree Delete Confirmation Dialog

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/FileTree/confirmTreeDelete.ts`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/FileTree/confirmTreeDelete.ts)
- **Entry Points**: Selecting "Delete" from the file tree context menu or pressing Backspace/Delete on a focused row.
- **Purpose & Core User Job**: Prevents accidental, irrecoverable data loss by requiring explicit confirmation before deleting notes or entire folder hierarchies.
- **Current State Description**: Modal confirmation prompt displaying the target file or folder name, item count warning for folders, and Cancel / Delete actions.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Clear modal state while deletion is confirmed. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar OS file deletion confirmation pattern. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | "Cancel" button and Escape key dismiss cleanly without changes. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard destructive modal dialog style. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Destructive action requires secondary intentional click. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Names exact path/file being targeted. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Enter key confirms; Escape key cancels. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Focused dialog with concise confirmation text. |
| Nielsen Heuristics | H9 Recover from errors | **Partial** | File moves to system Trash where supported, but does not provide in-app undo banner. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Clarifies that deleting a folder deletes all nested contents. |
| Laws of UX | Fitts's Law | **Pass** | Standard button sizes (>32px height). |
| Laws of UX | Hick's Law | **Pass** | Binary choice (Cancel vs Delete). |
| Laws of UX | Jakob's Law | **Pass** | Matches OS file manager confirmation prompts. |
| Laws of UX | Miller's Law | **Pass** | Single warning chunk. |
| Laws of UX | Doherty Threshold | **Pass** | Instant modal response. |
| Laws of UX | Postel's Law | **Pass** | Handles non-empty folders safely. |
| Laws of UX | Von Restorff | **Pass** | "Delete" action styled with danger red button (`--color-text-error`). |
| Gestalt Laws | Common Region | **Pass** | Centered modal on dark backdrop scrim (`--color-bg-scrim`). |
| Design System | Flat & Tokens | **Pass** | Uses tokens for danger background and borders. |
| A11y & Perf | Focus Trap | **Pass** | Focus trapped inside dialog until dismissed. |

---

## 3. Issues & Recommended Fixes

### DEL-01: Focus Should Default to "Cancel" for Safe Error Prevention
- **Severity**: Medium
- **Rule Violated**: H5 Error Prevention + Jakob's Law
- **Evidence**: `confirmTreeDelete.ts:28`: Dialog autofocus defaults to "Delete" button instead of "Cancel" `[Observed]`
- **Impact**: If a user accidentally presses `Delete` on the keyboard and quickly presses `Enter`, the note or folder is deleted immediately without reading the warning.
- **Suggested Fix**: Focus the "Cancel" button by default so that an inadvertent `Enter` keypress safely aborts the deletion.
- **Effort**: S (<15m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.confirm-delete-modal` | Border + scrim + bg-primary | Standard modal dialog | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Clear folder warning displaying total count of files that will be deleted.
- Non-destructive "Cancel" action is clearly accessible via Escape key.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Switch default focus to "Cancel" button.
- **Larger Work**:
  - Add transient "Note moved to trash (Undo)" toast in StatusBar.

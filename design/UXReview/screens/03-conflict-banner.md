# Screen Review: Editor Conflict Banner

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/EditorArea/EditorConflictBanner.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/EditorConflictBanner.tsx), [`EditorConflictBanner.module.scss`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/EditorConflictBanner.tsx)
- **Entry Points**: Appears dynamically above the CodeMirror editor when an external modification or sync collision occurs on the active note.
- **Purpose & Core User Job**: Prevents silent overwrite and data loss by alerting the user that disk content differs from in-memory editor content, providing 3 recovery choices.
- **Current State Description**: Warning banner with amber/yellow icon, clear warning message, and three action buttons: "Save mine as a copy", "Use the disk version", and "Overwrite disk version".

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | High-visibility warning banner paused autosave. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Explains external disk change in plain English. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | User can choose local version, disk version, or dual copies. |
| Nielsen Heuristics | H4 Consistency and standards | **Partial** | Uses CSS Modules instead of CUBE CSS. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Safest option ("Save mine as a copy") is styled as the primary button. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Tooltips explain what each button will do in detail. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Instant 1-click resolution. |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean banner across editor top; no multi-nested cards. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Core purpose of the component is graceful conflict recovery. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Explains why autosave is paused. |
| Laws of UX | Fitts's Law | **Pass** | Generous button heights (>32px) with distinct styling. |
| Laws of UX | Hick's Law | **Pass** | 3 mutually exclusive choices. |
| Laws of UX | Jakob's Law | **Pass** | Matches VS Code conflict notification banner. |
| Laws of UX | Miller's Law | **Pass** | 1 chunk: Warning message + 3 choices. |
| Laws of UX | Doherty Threshold | **Pass** | Instant rendering when watcher detects external edit. |
| Laws of UX | Postel's Law | **Pass** | Non-destructive by default. |
| Laws of UX | Von Restorff | **Pass** | Primary button highlighted distinctly from secondary choices. |
| Gestalt Laws | Common Region | **Pass** | Single banner bounded above editor. |
| Design System | CUBE CSS Standard | **Fail** | `EditorConflictBanner.module.scss` violates CUBE CSS architecture. |
| A11y & Perf | ARIA Live Region | **Pass** | Uses `role="alert"` and `aria-live="assertive"`. |

---

## 3. Issues & Recommended Fixes

### CONF-01: CSS Modules Violation
- **Severity**: Low
- **Rule Violated**: Project Design Rules (CUBE CSS Architecture)
- **Evidence**: `EditorConflictBanner.tsx:3`: Imports `EditorConflictBanner.module.scss` `[Observed]`
- **Impact**: Inconsistent with desktop CUBE CSS styling convention in ADR-0038.
- **Suggested Fix**: Convert to global CUBE CSS classes (`.editor-conflict-banner`, `.editor-conflict-banner__actions`, `.editor-conflict-banner__btn`) in `src/styles/components/_conflict-banner.scss`.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.conflict-banner` | Border-bottom hairline, subtle bg-warning-subtle | Clean inline notification banner | Keep as-is (passes box audit) |

---

## 5. What Works Well
- "Save mine as a copy" is the primary default, preventing accidental loss of work.
- `aria-live="assertive"` announces external modification immediately to assistive technology.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Migrate SCSS module to CUBE CSS.
- **Larger Work**: None.

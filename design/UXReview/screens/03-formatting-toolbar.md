# Screen Review: Floating Formatting Toolbar

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/EditorArea/EditorFormattingToolbar.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/EditorFormattingToolbar.tsx), [`EditorFormattingToolbarButtons.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/EditorFormattingToolbarButtons.tsx)
- **Entry Points**: Appears floating directly above text selection inside the CodeMirror markdown editor.
- **Purpose & Core User Job**: Quick inline formatting: Undo/Redo, Heading level selector (Paragraph, H1, H2, H3, Code block), Bold, Italic, Strikethrough, Highlight, Inline code, Wikilink, Bullet list, Numbered list, Task list.
- **Current State Description**: Floating pill toolbar with icon groups and an inline native `<select>` dropdown for heading styles.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Floating position tracks selection coordinates. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar WYSIWYG selection bubble toolbar. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Instant undo/redo buttons available directly in toolbar. |
| Nielsen Heuristics | H4 Consistency and standards | **Fail** | Uses native unstyled HTML `<select>` dropdown inside floating toolbar. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Formatting applies cleanly without deselecting active range. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Icons for all common formatting operations. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Accelerates formatting for mouse/touch-oriented users. |
| Nielsen Heuristics | H8 Minimalist design | **Partial** | Too many buttons squeezed into one floating bar. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Toggling formatting button again unwraps syntax. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Tooltips display keyboard shortcuts (e.g. `Cmd+B`, `Cmd+I`). |
| Laws of UX | Fitts's Law | **Fail** | Buttons are 24×24px, causing misclicks on small screen displays. |
| Laws of UX | Hick's Law | **Partial** | 15 buttons and a dropdown crammed into a floating strip. |
| Laws of UX | Jakob's Law | **Partial** | Modern editors (Notion, Medium, Bear) use a custom styled heading picker rather than native HTML `<select>`. |
| Laws of UX | Miller's Law | **Pass** | Separators chunk Undo, Headings, Inline formats, and Lists. |
| Laws of UX | Doherty Threshold | **Pass** | Instant appearance upon text selection (<50ms). |
| Laws of UX | Postel's Law | **Pass** | Safely handles multi-line selections and nested formatting. |
| Laws of UX | Von Restorff | **Pass** | Distinct active states when selection matches format. |
| Gestalt Laws | Common Region | **Pass** | Single floating toolbar bubble. |
| Design System | Radix & CUBE CSS | **Fail** | Uses CSS Modules and native `<select>` instead of Radix DropdownMenu. |
| A11y & Perf | Hitboxes & Native UI | **Fail** | Native `<select>` clashes with dark theme tokens and causes platform-specific UI quirks. |

---

## 3. Issues & Recommended Fixes

### FMT-01: Native HTML `<select>` Dropdown Inside Floating Toolbar
- **Severity**: Medium
- **Rule Violated**: Project Design Rules + Jakob's Law + H4 Consistency
- **Evidence**: `EditorFormattingToolbar.tsx:35-44`: Renders native `<select onChange={onSelectHeading}>` inside floating toolbar `[Observed]`
- **Impact**: Native HTML select opens OS-native popup controls that clash visually with the dark theme and cannot be styled with design tokens.
- **Suggested Fix**: Replace `<select>` with Radix `@app/design-system` DropdownMenu or compact heading icon pills (H1, H2, H3).
- **Effort**: S (<30m)

### FMT-02: Narrow 24px Button Targets
- **Severity**: Medium
- **Rule Violated**: Fitts's Law
- **Evidence**: `EditorFormattingToolbar.module.scss:22`: Button size is `24×24px` `[Observed]`
- **Impact**: Difficult to accurately click on high-DPI laptop touchpads; high risk of misclicking adjacent formatting buttons.
- **Suggested Fix**: Expand button bounds to `28×28px` with `4px` padding.
- **Effort**: S (<15m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.editor-formatting-toolbar__group` | Border-right divider between button groups | Clean dividers | Keep as-is (passes box audit) |

---

## 5. What Works Well
- `run` helper executes CodeMirror transaction and immediately restores focus to editor view (`view.focus()`).
- Tooltips include standard markdown shortcuts (`Cmd+B`, `Cmd+I`, `Cmd+K`).

---

## 6. Action Roadmap
- **Quick Wins**:
  - Enlarge button hitboxes to 28×28px.
  - Replace native `<select>` with custom Radix dropdown.
- **Larger Work**: None.

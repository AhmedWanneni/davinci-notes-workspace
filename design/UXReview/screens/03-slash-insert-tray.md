# Screen Review: Editor Slash Menu / Insert Tray

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/EditorArea/EditorInsertTray.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/EditorInsertTray.tsx), [`InsertMenu.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/EditorArea/InsertMenu.tsx)
- **Entry Points**: Typing `/` on an empty editor line or clicking the `+` insert affordance in the editor gutter.
- **Purpose & Core User Job**: Surfaces the complete catalog of insertable markdown elements: Headings, Bullet/Numbered/Task lists, Blockquotes, Callouts, Tables, Code blocks, Math formulas (KaTeX), Mermaid diagrams (Flowchart, Sequence, Gantt, Class, Git graph), Note embeds, and Attachments.
- **Current State Description**: Popover menu with category filter bar, search input, and filterable list of rich block templates with icons and keyboard shortcuts.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Active category filter and highlighted selection item. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar block insertion catalog (Notion / Slack `/` commands). |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Dismisses with Escape or backspace. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Standard slash menu UX conventions. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Previews Mermaid and math syntax before inserting into editor. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Visual icons and descriptions for every template. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Fast keyboard filtering (typing `/table` inserts table immediately). |
| Nielsen Heuristics | H8 Minimalist design | **Pass** | Clean cardless popover. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | CodeMirror undo (`Cmd+Z`) removes inserted block in one step. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Explains each block template's syntax. |
| Laws of UX | Fitts's Law | **Pass** | List rows span full popover width (36px row height). |
| Laws of UX | Hick's Law | **Pass** | Category filter tabs prevent visual overload. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Notion and modern slash command menus. |
| Laws of UX | Miller's Law | **Pass** | Chunked into Categories (Diagrams, Tables, Callouts, Media, Code). |
| Laws of UX | Doherty Threshold | **Pass** | Instantaneous menu display and typing filter. |
| Laws of UX | Postel's Law | **Pass** | Fuzzy substring search across item names and descriptions. |
| Laws of UX | Von Restorff | **Pass** | Active item highlighted clearly. |
| Gestalt Laws | Common Region | **Pass** | Single popover container. |
| Design System | Flat & Tokens | **Pass** | Uses design tokens; no drop shadows. |
| A11y & Perf | Keyboard Traversal | **Pass** | Full `ArrowUp`/`ArrowDown`/`Enter` keyboard navigation. |

---

## 3. Issues & Recommended Fixes

### TRAY-01: Category Pills Use Outdated CSS Modules
- **Severity**: Low
- **Rule Violated**: Project Design Rules (CUBE CSS Architecture)
- **Evidence**: `EditorInsertTray.module.scss:1-60`: Styled via local CSS Modules file `[Observed]`
- **Impact**: Violates ADR-0038 CUBE CSS standard across desktop components.
- **Suggested Fix**: Migrate to CUBE CSS classes in `apps/desktop/src/styles/components/_insert-tray.scss`.
- **Effort**: S (<20m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.editor-insert-tray` | Border + bg-primary-alt | Standard popover container | Keep as-is (passes box audit) |

---

## 5. What Works Well
- Complete coverage of Mermaid diagram templates (Flowchart, Sequence, Gantt, Class, Git graph) saves users from memorizing Mermaid syntax.
- Instant keyboard filter with `Enter` insertion and automatic cursor placement inside inserted template.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Migrate styling to CUBE CSS.
- **Larger Work**: None.

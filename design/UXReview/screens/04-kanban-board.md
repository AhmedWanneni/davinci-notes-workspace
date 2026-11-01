# Screen Review: Kanban Board View

## 1. Overview
- **Component Path**: [`packages/kanban/KanbanView.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/packages/kanban/KanbanView.tsx), [`KanbanLaneComponent.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/packages/kanban/KanbanLaneComponent.tsx), [`KanbanCardComponent.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/packages/kanban/KanbanCardComponent.tsx)
- **Entry Points**: Opening any note containing `kanban-plugin: board` in its frontmatter.
- **Purpose & Core User Job**: Visual task management board with draggable cards across lanes/columns, inline card creation, and lane color customization.
- **Current State Description**: Multi-column board layout with lane headers, card count chips, scrollable card lists, and inline "Add a card" textareas.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Drag preview indicator shows exact destination slot before drop. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Familiar physical Kanban board sticky card metaphor. |
| Nielsen Heuristics | H3 User control & freedom | **Pass** | Drag cards freely between any lanes or reorder within a lane. |
| Nielsen Heuristics | H4 Consistency and standards | **Pass** | Compatible with the Obsidian Kanban plugin markdown syntax. |
| Nielsen Heuristics | H5 Error prevention | **Pass** | Autosaves changes non-destructively as markdown task lists. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Renders inline markdown inside cards (checkboxes, tags, bold text). |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Enter key submits new card and immediately opens next card input. |
| Nielsen Heuristics | H8 Minimalist design | **Partial** | Double card border nesting (lane container has card border + each card has a card border). |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Markdown file can be edited as plain text if syntax is malformed. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty lane placeholder prompts. |
| Laws of UX | Fitts's Law | **Pass** | Cards span full column width with comfortable vertical padding. |
| Laws of UX | Hick's Law | **Pass** | Scoped strictly to lane operations. |
| Laws of UX | Jakob's Law | **Pass** | 1:1 match with Trello and Obsidian Kanban plugin. |
| Laws of UX | Miller's Law | **Pass** | Columns visually chunk tasks into status categories. |
| Laws of UX | Doherty Threshold | **Pass** | Instant optimistic card movement during drag. |
| Laws of UX | Postel's Law | **Pass** | Preserves unknown YAML properties during board serialization. |
| Laws of UX | Von Restorff | **Pass** | Optional lane header color stripes. |
| Gestalt Laws | Common Region (Box Audit) | **Partial** | Over-boxed: lane wrapper card + card container border creates a "box inside a box" aesthetic. |
| Design System | Flat, Tokens Only | **Pass** | Uses design tokens; depth indicated by borders, not drop shadows. |
| A11y & Perf | Keyboard Nav | **Pass** | `useKanbanKeyboardNav.ts` allows moving cards with arrow keys. |

---

## 3. Issues & Recommended Fixes

### KAN-01: Nested Box Clutter (Lane Box Wrapping Card Boxes)
- **Severity**: Medium
- **Rule Violated**: Gestalt Common Region + H8 Minimalist Design
- **Evidence**: `KanbanLaneComponent.module.scss:12` and `KanbanCardComponent.module.scss:10`: Both lane and cards declare heavy borders and backgrounds `[Observed]`
- **Impact**: Multi-layered card nesting makes the board look cluttered and heavy.
- **Suggested Fix**: Flatten the lane column background to `transparent` or subtle hairline divider, allowing individual cards to sit cleanly on the canvas:
  ```scss
  // Before
  .kanban-lane {
    background-color: var(--color-bg-primary-alt);
    border: var(--border-width-thin) solid var(--color-border-subtle);
    border-radius: var(--border-radius-lg);
  }

  // After
  .kanban-lane {
    background-color: transparent;
    border: none;
    border-right: var(--border-width-thin) solid var(--color-border-subtle);
  }
  ```
- **Effort**: S (<30m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.kanban-lane` | Full border + bg-primary-alt + radius-lg | Redundant outer card container | Flat column with hairline right border |

---

## 5. What Works Well
- True plain-markdown interoperability: parses standard `- [ ] Task` markdown lists under `## Lane` headings.
- Keyboard navigation hook (`useKanbanKeyboardNav.ts`) allows full card reordering without mouse.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Flatten lane column container to eliminate nested card visual clutter.
- **Larger Work**: None.

# Screen Review: Properties Block

## 1. Overview
- **Component Path**: [`apps/desktop/src/components/PropertiesBlock/PropertiesBlock.tsx`](file:///Users/ahmedwaanneni/orca/workspaces/davinci-notes/ai-agent/apps/desktop/src/components/PropertiesBlock/PropertiesBlock.tsx)
- **Entry Points**: Pinned at the top of note content whenever YAML frontmatter exists.
- **Purpose & Core User Job**: Visual representation of document metadata (tags, dates, author, wikilinks) with collapsible accordion header.
- **Current State Description**: Accordion container with properties count badge, property row pairs (key icon + label on left, value on right), and an "Add property" footer button.

---

## 2. Scorecard

| Rule Family | Rule | Status | Evidence / One-Line Reason |
|---|---|---|---|
| Nielsen Heuristics | H1 Visibility of system status | **Pass** | Displays property count in header. |
| Nielsen Heuristics | H2 Match with real world | **Pass** | Key-value properties metaphor. |
| Nielsen Heuristics | H3 User control & freedom | **Fail** | "Add property" button is completely non-functional (displays future release tooltip). |
| Nielsen Heuristics | H4 Consistency and standards | **Fail** | Renders tags with rounded pill badges, violating the project "no pill badges" rule. |
| Nielsen Heuristics | H5 Error prevention | **Fail** | Misleading interactive affordance on a dead button. |
| Nielsen Heuristics | H6 Recognition over recall | **Pass** | Contextual icons for tags, dates, authors, and links. |
| Nielsen Heuristics | H7 Flexibility & efficiency | **Pass** | Clicking wikilink values navigates to target note. |
| Nielsen Heuristics | H8 Minimalist design | **Partial** | Pill badges and extra borders add visual weight above the note title. |
| Nielsen Heuristics | H9 Recover from errors | **Pass** | Invalid frontmatter falls back gracefully. |
| Nielsen Heuristics | H10 Help and documentation | **Pass** | Empty values rendered as subtle "empty" placeholder. |
| Laws of UX | Fitts's Law | **Pass** | Full-width collapse accordion header. |
| Laws of UX | Hick's Law | **Pass** | Clear tabular 2-column layout. |
| Laws of UX | Jakob's Law | **Pass** | Matches Obsidian Properties view at top of note. |
| Laws of UX | Miller's Law | **Pass** | Segmented key-value rows. |
| Laws of UX | Doherty Threshold | **Pass** | Synchronous render on note load. |
| Laws of UX | Postel's Law | **Pass** | Parses arrays, comma-delimited strings, or single values for tags. |
| Laws of UX | Von Restorff | **Fail** | Tag badges draw more eye contrast than the actual H1 document title. |
| Gestalt Laws | Common Region | **Partial** | Properties block sits in a bounded frame directly above the title. |
| Design System | No Pill Badges | **Fail** | `PropertiesBlock.tsx:65`: Uses `<Badge variant="accent">` pill badges for tags. |
| A11y & Perf | Keyboard Accessibility | **Pass** | Accordion header toggleable with Space/Enter. |

---

## 3. Issues & Recommended Fixes

### PROP-01: Non-Functional "Add Property" Dead Click
- **Severity**: High
- **Rule Violated**: H3 User Control and Freedom + H5 Error Prevention
- **Evidence**: `PropertiesBlock.tsx:191-199`: `<button className="properties-block__add-btn" title="Inline property editing available in future release">` has no `onClick` handler `[Observed]`
- **Impact**: Users click "Add property" expecting to append frontmatter, but nothing happens except an unhelpful tooltip.
- **Suggested Fix**: Either implement a minimal prompt appending `new_key: ""` to the note's frontmatter, or hide the button until the editor supports inline property creation.
- **Effort**: S (<30m)

### PROP-02: Pill Badge Violation on Tags
- **Severity**: Medium
- **Rule Violated**: Project Design Rules (No Pill Badges) + H8 Minimalist Design
- **Evidence**: `PropertiesBlock.tsx:65`: `<Badge variant="accent">{#${cleanTag}}</Badge>` `[Observed]`
- **Impact**: Violates strict `AGENTS.md` standing rule: "no pill badges". Tags look like bubbly web pills rather than editorial Swiss typography.
- **Suggested Fix**: Render tags as flat text with `#` prefix, subtle monospace styling, and hairline divider or light border:
  ```tsx
  // Before
  <Badge variant="accent">{`#${cleanTag}`}</Badge>

  // After
  <span className="properties-block__tag">{`#${cleanTag}`}</span>
  ```
- **Effort**: S (<15m)

---

## 4. Box Audit
| Container / Wrapper | Current Styling | Issue | Flat Replacement |
|---|---|---|---|
| `.properties-block__tags .badge` | Pill border-radius + accent background | Prohibited pill badge | Flat `#tag` text with `font-family: var(--font-mono)` |

---

## 5. What Works Well
- Fold/unfold state remembers user choice.
- Ignores internal metadata keys (`cover`, `banner`, `kanban-plugin`) cleanly per `HIDDEN_FRONTMATTER_KEYS`.

---

## 6. Action Roadmap
- **Quick Wins**:
  - Remove pill badges on tags; use flat Swiss tag text.
  - Hide or wire the "Add property" button.
- **Larger Work**: Full inline frontmatter key-value editor.

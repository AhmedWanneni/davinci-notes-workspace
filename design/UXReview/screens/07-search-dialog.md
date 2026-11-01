# UX Review: Full-Text Search Dialog

## 1. Overview
The Search Dialog (`SearchDialog.tsx`) provides vault-wide full-text search (SQLite FTS5) as well as optional semantic vector search (`semanticSearch`).
- **Entry points**: `Cmd+P` or `Cmd+Shift+F`, magnifying glass in sidebar/rail.
- **Current state**: Modal dialog with a search input, an optional exact/semantic mode toggle button group, and a scrollable results list showing matched notes, headings, and excerpts.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Debounced 120ms queries with live search updates; active selection index tracked. |
| **H2 Match with real world** | Fail | Input placeholder erroneously reads `"Select a command..."` in a document search dialog! |
| **H3 User control and freedom** | Pass | Dismisses cleanly with Escape or overlay click; arrow keys navigate results. |
| **H4 Consistency and standards** | Partial | Shares dialog structure with CommandPalette but diverged in copy and mode toggling. |
| **H5 Error prevention** | Pass | Disables semantic query until minimum 3 characters entered. |
| **H6 Recognition over recall** | Pass | Shows note path and contextual snippet around matched terms. |
| **H7 Flexibility and efficiency** | Pass | Supports exact FTS5 syntax (`tag:`, boolean operators) and semantic embeddings. |
| **H8 Aesthetic and minimalist design** | Pass | Clean list view without unnecessary card framing. |
| **H9 Error recovery** | Pass | Query remains editable; invalid syntax handled gracefully by indexer. |
| **H10 Help and documentation** | Partial | Does not hint at supported search operators (`tag:`, `""`, `-`). |
| **Fitts's Law** | Fail | Close button icon is 10px (`X size={10}`), below minimum clickable target. |
| **Hick's Law** | Pass | Ranks search results by relevance score. |
| **Jakob's Law** | Partial | Users expect standard search placeholder ("Search notes..."). |
| **Miller / Chunking** | Pass | Chunks results by file path, heading, and snippet. |
| **Doherty Threshold** | Pass | Debounced 120ms execution keeps typing responsive. |
| **Postel's Law** | Pass | Tolerates unclosed quotes and whitespace variations in search terms. |
| **Von Restorff** | Pass | Active highlighted result has clear visual distinction. |
| **Proximity** | Pass | Result snippets are closely bound to note titles. |
| **Similarity** | Pass | Consistent typography across search results. |
| **Common Region** | Pass | Single dialog container with divider. |
| **Uniform Connectedness** | Pass | Selected row highlighted across whole horizontal width. |
| **Design tokens & styling** | Pass | Uses tokens and Radix dialog primitive. |
| **Accessibility (a11y)** | Partial | Missing `aria-activedescendant`; mode switch buttons lack proper tab/radio role. |
| **Performance feel** | Pass | Fast SQLite FTS5 index queries. |

---

## 3. Issues

### SEARCH-01: Wrong placeholder copy ("Select a command...") confuses search intent
- **Severity**: High
- **Rule violated**: H2 Match with real world / H4 Consistency
- **Evidence**: `apps/desktop/src/components/SearchDialog/SearchDialog.tsx:126` (`placeholder="Select a command..."`) `[Observed]`
- **Why it hurts the user**: Users opening search dialog see "Select a command...", leading them to think they opened the command palette by mistake.
- **Suggested fix**: Change placeholder to `"Search notes, tags, or content..."`.
- **Effort**: S

### SEARCH-02: Microscopic close button icon
- **Severity**: Low
- **Rule violated**: Fitts's Law
- **Evidence**: `apps/desktop/src/components/SearchDialog/SearchDialog.tsx:137` (`<X size={10} weight="bold" />`) `[Observed]`
- **Why it hurts the user**: Difficult to hit for mouse users.
- **Suggested fix**: Increase icon to 14px or 16px and ensure button target is at least 32×32px.
- **Effort**: S

### SEARCH-03: Lack of operator syntax guidance in empty/initial state
- **Severity**: Low
- **Rule violated**: H10 Help and documentation
- **Evidence**: `apps/desktop/src/components/SearchDialog/SearchDialog.tsx:120-140` `[Code-Read Only]`
- **Why it hurts the user**: Users are unaware that SQLite FTS5 supports `tag:`, `-term`, and exact `"quotes"`.
- **Suggested fix**: Display subtle helper chips or text below input when query is empty: `"Tip: Use quotes for \"exact phrase\" or tag:project"`.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.search-dialog__input-wrapper` | Extra border wrapper | Nested border inside dialog | Borderless input with subtle bottom divider |

---

## 5. What Works Well
- Instant 120ms debounced queries against local SQLite FTS5.
- Seamless toggle between exact full-text and semantic embedding search.
- Clean snippet presentation with matched term context.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Fix placeholder text from "Select a command..." to "Search notes..." (≤5 min).
- **Quick Win**: Enlarge close button hit area (≤15 min).
- **Larger Work**: Add search operator autocomplete chips.

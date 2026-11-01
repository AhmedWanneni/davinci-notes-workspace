# UX Review: Suggest Links Panel

## 1. Overview
The Suggest Links panel (`SuggestLinksPanel.tsx`) appears as a dynamic inspector block within the right sidebar (and backlinks/inspector area) to suggest contextual links between notes based on semantic matching or heading references (`LinkSuggestion`).
- **Entry points**: Right sidebar "Backlinks" tab subsection or context inspector when link suggestions are calculated.
- **Current state**: A compact vertical card-like subsection rendering an icon, header, and list of suggested link items (`button.suggest-links-panel__item`).

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Fail | Does not display a calculation state, loading spinner, or score indicator; when empty it renders `null` with no explanation. |
| **H2 Match with real world** | Pass | Uses recognizable note path and heading metaphor. |
| **H3 User control and freedom** | Partial | Clicking inserts the link, but there is no "Dismiss suggestion" or "Ignore this suggestion" action. |
| **H4 Consistency and standards** | Partial | Uses custom CSS classes `suggest-links-panel__item` rather than standard list item primitives. |
| **H5 Error prevention** | Partial | No confirmation or preview before mutating note text with an inserted link. |
| **H6 Recognition over recall** | Pass | Shows both the target note path and relevant section heading. |
| **H7 Flexibility and efficiency** | Fail | No keyboard shortcut to accept the top suggestion; requires mouse click. |
| **H8 Aesthetic and minimalist design** | Pass | Clean two-line item presentation (path + heading). |
| **H9 Error recovery** | Fail | Inserting an unwanted link relies solely on general document undo (`Cmd+Z`). |
| **H10 Help and documentation** | Partial | "Related notes" header is concise but doesn't explain how suggestions are determined. |
| **Fitts's Law** | Pass | Full-width button target is comfortable to click. |
| **Hick's Law** | Pass | Limits suggestions to top matches. |
| **Jakob's Law** | Partial | Similar to Obsidian's outgoing/unlinked mentions, but lacks an inline preview snippet of the context. |
| **Miller / Chunking** | Pass | Clearly separates path from sub-heading. |
| **Doherty Threshold** | Pass | Insertion is synchronous local text edit. |
| **Postel's Law** | Pass | Safely falls back to `"Related content"` if `heading` is null. |
| **Von Restorff** | Pass | Subtle muted styling keeps primary focus on note content. |
| **Proximity** | Pass | Grouped tightly under subsection header. |
| **Similarity** | Pass | Consistent button row hierarchy. |
| **Common Region** | Partial | Nested inside `app-right-sidebar__subsection` box container. |
| **Uniform Connectedness** | Pass | Clear button boundary on hover. |
| **Design tokens & styling** | Pass | Uses Typography component and design tokens. |
| **Accessibility (a11y)** | Partial | `button` lacks `aria-label` describing action (e.g., "Insert link to Note: Heading"). |
| **Performance feel** | Pass | Zero rendering overhead when empty (`return null`). |

---

## 3. Issues

### SUGGEST-01: Disappearing empty state leaves users wondering if feature works
- **Severity**: Low
- **Rule violated**: H1 Visibility of system status
- **Evidence**: `apps/desktop/src/components/SuggestLinksPanel/SuggestLinksPanel.tsx:16` (`if (suggestions.length === 0) return null;`) `[Code-Read Only]`
- **Why it hurts the user**: When browsing notes, users have no way to know whether the link suggester is scanning, completed with 0 results, or disabled.
- **Suggested fix**: Provide a muted empty placeholder when active note has no outbound suggestions, or a gentle tooltip explanation.
- **Effort**: S

### SUGGEST-02: Missing dismiss action forces unwanted suggestions to persist
- **Severity**: Medium
- **Rule violated**: H3 User control and freedom
- **Evidence**: `apps/desktop/src/components/SuggestLinksPanel/SuggestLinksPanel.tsx:23-28` `[Code-Read Only]`
- **Why it hurts the user**: Irrelevant or false-positive link suggestions remain permanently on the panel until the document changes.
- **Suggested fix**: Add an `onDismiss(path)` "×" button on hover so users can prune unwanted suggestions.
- **Effort**: S

### SUGGEST-03: Lack of accessible action description on suggestion buttons
- **Severity**: Medium
- **Rule violated**: Accessibility (a11y)
- **Evidence**: `apps/desktop/src/components/SuggestLinksPanel/SuggestLinksPanel.tsx:24` `[Code-Read Only]`
- **Why it hurts the user**: Screen readers announce raw path strings without indicating that clicking will insert a markdown link into the active editor.
- **Suggested fix**: Add `aria-label={`Insert wikilink to ${suggestion.path}${suggestion.heading ? ` (${suggestion.heading})` : ""}`}`.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.suggest-links-panel` | Subsection border wrapper | Additional box boundary inside right sidebar tabs | Rely on standard hairline divider or uppercase section heading |

---

## 5. What Works Well
- Immediate link insertion into active editor position.
- Graceful heading fallback (`suggestion.heading ?? "Related content"`).
- Clean use of Design System `Typography`.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Add accessible `aria-label` to each suggestion item button (≤15 min).
- **Quick Win**: Add a dismiss icon button (`X`) on suggestion hover (≤30 min).
- **Larger Work**: Add contextual sentence preview / highlight snippet for why the link was suggested.

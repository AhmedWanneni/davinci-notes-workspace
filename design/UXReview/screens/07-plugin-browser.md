# UX Review: Plugin Browser Modal

## 1. Overview
The Plugin Browser (`PluginBrowser.tsx`) provides an in-app community extensions directory to browse, install, toggle, update, and remove third-party plugins.
- **Entry points**: Settings > Community Plugins > "Browse Plugins" button.
- **Current state**: Modal listing of registered plugins with name, version, author, description, update indicators, and install/enable buttons.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Loading spinner while fetching remote registry; clear "Installed" / "Update available" badges. |
| **H2 Match with real world** | Pass | Standard extension marketplace concepts (install, enable, disable, uninstall). |
| **H3 User control and freedom** | Pass | Any community plugin can be disabled or uninstalled with one click. |
| **H4 Consistency and standards** | Pass | Matches Obsidian community plugin browser workflow. |
| **H5 Error prevention** | Pass | Strict manifest inspection (`inspectPluginArchive`) ensures package ID matches before installation. |
| **H6 Recognition over recall** | Pass | Displays plugin descriptions, authors, and compatibility versions clearly. |
| **H7 Flexibility and efficiency** | Pass | Filterable search to quickly locate specific plugins. |
| **H8 Aesthetic and minimalist design** | Pass | Clean row/card hierarchy with typography-driven layout. |
| **H9 Error recovery** | Pass | Catches network errors and provides clear retry state. |
| **H10 Help and documentation** | Partial | Security disclaimer regarding running arbitrary JavaScript in notes is absent or understated. |
| **Fitts's Law** | Pass | Generous button click targets for Install and Toggle actions. |
| **Hick's Law** | Pass | Straightforward action buttons (Install / Update / Uninstall). |
| **Jakob's Law** | Pass | Mirrors VS Code extension manager. |
| **Miller / Chunking** | Pass | Chunks author, description, and status into structured sections. |
| **Doherty Threshold** | Pass | Quick archive download and local sandboxed extraction. |
| **Postel's Law** | Pass | Handles offline mode and outdated registry caches without crashing. |
| **Von Restorff** | Pass | "Update Available" button uses accent color to draw user attention. |
| **Proximity** | Pass | Action buttons are right-aligned alongside corresponding plugin details. |
| **Similarity** | Pass | Uniform list items across all plugin entries. |
| **Common Region** | Partial | Heavy card borders around each plugin item. |
| **Uniform Connectedness** | Pass | Clear row boundaries. |
| **Design tokens & styling** | Pass | Uses Design System components and CSS Modules with tokens. |
| **Accessibility (a11y)** | Pass | Buttons have clear text labels; status badges use contrasting colors. |
| **Performance feel** | Pass | Clean asynchronous fetching with cancellation on unmount (`active = false`). |

---

## 3. Issues

### PLUGIN-01: Missing community plugin security notice
- **Severity**: High
- **Rule violated**: H5 Error prevention / H10 Help and documentation
- **Evidence**: `apps/desktop/src/components/PluginBrowser/PluginBrowser.tsx:28-80` `[Code-Read Only]`
- **Why it hurts the user**: Third-party plugins execute arbitrary code in the user's workspace. Without a clear warning, non-technical users might install untrusted code without understanding risks.
- **Suggested fix**: Include a persistent warning banner at the top of the browser: `"Community plugins have full access to your vault files. Only install plugins from developers you trust."`.
- **Effort**: S

### PLUGIN-02: Over-boxed plugin cards in narrow windows
- **Severity**: Medium
- **Rule violated**: Gestalt Common Region / H8 Aesthetic and minimalist design
- **Evidence**: `apps/desktop/src/components/PluginBrowser/PluginBrowser.module.scss` `[Code-Read Only]`
- **Why it hurts the user**: Heavy card borders around every item create visual noise and consume horizontal space on smaller screens.
- **Suggested fix**: Switch to clean hairline dividers between list rows (`border-bottom: 1px solid var(--color-border-subtle)`).
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.plugin-card` | Card border + radius | Repetitive bounding boxes for simple text rows | Flat list item with subtle divider line |

---

## 5. What Works Well
- Secure manifest verification before writing plugin files to disk.
- Graceful offline error handling with clean retry logic.
- Clear "Update Available" notification flow.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Add security notice banner to top of browser (≤20 min).
- **Quick Win**: Convert card list to flat divider rows (≤30 min).
- **Larger Work**: Add plugin categories/tags filter (e.g. "Editor", "Themes", "Sync", "AI").

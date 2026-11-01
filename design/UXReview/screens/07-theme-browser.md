# UX Review: Theme Browser Modal

## 1. Overview
The Theme Browser (`ThemeBrowser.tsx`) allows users to discover, preview, install, update, and switch themes (built-in and community-contributed) from a centralized catalog.
- **Entry points**: Settings > Appearance > "Browse Themes" button.
- **Current state**: Modal grid view of theme cards showing title, author, version compatibility check (`checkAppCompatibility`), install/activate buttons, and live preview swatch palettes.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Clear loading spinner, offline error notice, and active theme badge. |
| **H2 Match with real world** | Pass | Visual color swatch palettes immediately communicate theme aesthetics. |
| **H3 User control and freedom** | Pass | Builtin themes are protected from deletion; installed themes can be easily uninstalled. |
| **H4 Consistency and standards** | Pass | Follows Obsidian/VS Code marketplace patterns. |
| **H5 Error prevention** | Pass | Verifies version compatibility before installation. |
| **H6 Recognition over recall** | Pass | Displays visual color tokens so users don't have to guess how a theme looks. |
| **H7 Flexibility and efficiency** | Pass | One-click install and immediate hot-reload activation (`onActivate`). |
| **H8 Aesthetic and minimalist design** | Pass | Attractive card gallery layout suited for visual themes. |
| **H9 Error recovery** | Pass | Network failure provides informative offline message (`Offline: reason`). |
| **H10 Help and documentation** | Partial | Doesn't explain how custom CSS snippets can be added manually. |
| **Fitts's Law** | Pass | Sizable "Apply" and "Install" buttons on each card. |
| **Hick's Law** | Pass | Curated catalog prevents cognitive fatigue. |
| **Jakob's Law** | Pass | Matches standard theme gallery interfaces. |
| **Miller / Chunking** | Pass | Cards group author, version, description, and color swatches cleanly. |
| **Doherty Threshold** | Pass | Theme switching applies CSS variables instantly without requiring an app reload. |
| **Postel's Law** | Pass | Handles offline registry caching gracefully. |
| **Von Restorff** | Pass | Currently active theme is highlighted with an "Active" badge. |
| **Proximity** | Pass | Swatches and theme title closely paired. |
| **Similarity** | Pass | Uniform card grid geometry. |
| **Common Region** | Pass | Justified use of cards here: visual theme previews naturally require bounding frames. |
| **Uniform Connectedness** | Pass | Card boundaries visually isolate distinct theme packages. |
| **Design tokens & styling** | Pass | Uses Design System `Button`, `Typography`, and CSS Modules. |
| **Accessibility (a11y)** | Partial | Color swatch circles lack descriptive color name labels or contrast ratios for screen readers. |
| **Performance feel** | Pass | Fast local inspection of downloaded archive bytes (`inspectThemeArchive`). |

---

## 3. Issues

### THEME-01: Color swatches lack accessible names for screen readers
- **Severity**: Low
- **Rule violated**: Accessibility (a11y)
- **Evidence**: `apps/desktop/src/components/ThemeBrowser/ThemeBrowser.tsx` `[Code-Read Only]`
- **Why it hurts the user**: Visually impaired or screen reader users only hear empty container elements rather than theme palette colors.
- **Suggested fix**: Add `aria-label={`Color swatch: ${colorName}`}` or a descriptive palette text summary.
- **Effort**: S

### THEME-02: Missing live preview toggle before applying
- **Severity**: Medium
- **Rule violated**: H3 User control and freedom / H5 Error prevention
- **Evidence**: `apps/desktop/src/components/ThemeBrowser/ThemeBrowser.tsx:28-36` `[Code-Read Only]`
- **Why it hurts the user**: Clicking "Apply" commits the theme change to settings immediately; users cannot temporarily hover or preview the theme on their current document before committing.
- **Suggested fix**: Add a "Preview" mode that temporarily applies the CSS variables on hover or click, with a "Keep Theme" / "Revert" banner.
- **Effort**: M

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.theme-card` | Bordered card | Card design is justified here for graphical previews | Keep card boundary; ensure border uses `--color-border-subtle` |

---

## 5. What Works Well
- Dynamic client-side version compatibility checks (`checkAppCompatibility`).
- Safe archive validation before disk write (`inspectThemeArchive`).
- Protected status for core built-in themes.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Add accessible labels to color swatches (≤20 min).
- **Larger Work**: Add temporary live-preview before final theme activation (≤1 hour).

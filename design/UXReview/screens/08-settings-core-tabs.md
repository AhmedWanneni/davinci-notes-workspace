# UX Review: Settings Tabs 1–5 (Core Preferences)

## 1. Overview
The Core Preferences group covers the essential application settings:
1. **General** (`GeneralSettingsTab.tsx`, `UpdateSettingsCard.tsx`): Active vault directory path, switch vault button, app version, release channel, automatic updates toggle, check for updates button.
2. **Appearance** (`AppearanceSettingsTab.tsx`, `ThemeSettingsList.tsx`): Theme selection (Dark / Light / System), active theme cards, custom accent colors, "Browse Themes" button.
3. **Editor** (`EditorSettingsTab.tsx`): Font family picker, font size stepper, line height, Vim mode toggle, Vim monospace toggle, bracket auto-close, word wrap.
4. **Files and links** (`FilesLinksSettingsTab.tsx`, `AttachmentLocationSettings.tsx`): Default location for new notes (Vault root, same folder, custom folder), attachment folder mode (vault root, specific folder, subfolder per note).
5. **Git** (`GitSettingsTab.tsx`): Repository status, branch display, remote URL, author name/email, auto-commit interval, push-on-commit toggle.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Active vault path displayed, Git status (clean / changes) reported, theme swatches shown. |
| **H2 Match with real world** | Pass | Standard editor options (Vim mode, font size, word wrap). |
| **H3 User control and freedom** | Pass | Vault can be switched anytime; themes can be restored to default. |
| **H4 Consistency and standards** | Pass | Follows conventional settings row patterns (Label on left, control on right). |
| **H5 Error prevention** | Pass | Path inputs validate folder existence before applying. |
| **H6 Recognition over recall** | Pass | Dropdowns display human-readable font names and attachment location options. |
| **H7 Flexibility and efficiency** | Pass | Instant real-time preview of font size and editor theme adjustments. |
| **H8 Aesthetic and minimalist design** | Partial | Nested cards inside each tab clutter the right pane. |
| **H9 Error recovery** | Pass | Reset buttons provided for font settings and keybindings. |
| **H10 Help and documentation** | Pass | Clear descriptive subtitles below each setting row. |
| **Fitts's Law** | Pass | Toggle switches and dropdown select triggers meet minimum 32px targets. |
| **Hick's Law** | Pass | Scoped into logical cards (Display, Typing, Behavior). |
| **Jakob's Law** | Pass | Identical to Obsidian's Files & Links and Editor settings. |
| **Miller / Chunking** | Pass | Clear thematic grouping of preferences. |
| **Doherty Threshold** | Pass | Changes apply immediately to editor state without stutter. |
| **Postel's Law** | Pass | Tolerates varied folder path inputs (leading/trailing slashes). |
| **Von Restorff** | Pass | Danger actions (e.g. Disconnect Git) use warning color tokens. |
| **Proximity** | Pass | Setting descriptions are directly beneath titles. |
| **Similarity** | Pass | Consistent toggle switch and dropdown styles. |
| **Common Region** | Partial | Over-use of `.settings-card` wrappers. |
| **Uniform Connectedness** | Pass | Related sub-options indent cleanly under parent toggles. |
| **Design tokens & styling** | Pass | Clean token integration throughout. |
| **Accessibility (a11y)** | Pass | Proper labels and `aria-checked` states on toggle switches. |
| **Performance feel** | Pass | Zero lag when adjusting font sizes or toggling options. |

---

## 3. Issues

### CORE-01: Multiple nested bordered cards inside single settings tab
- **Severity**: Medium
- **Rule violated**: Gestalt Common Region / H8 Aesthetic and minimalist design
- **Evidence**: `apps/desktop/src/components/SettingsDialog/EditorSettingsTab.tsx` and `FilesLinksSettingsTab.tsx` `[Observed]`
- **Why it hurts the user**: A single tab (like Editor) contains 4 separate bordered boxes (`Typography`, `Behavior`, `Vim Mode`, `Display`), creating a fragmented visual stack.
- **Suggested fix**: Use flat section headings with subtle dividers instead of heavy card frames.
- **Effort**: S

### CORE-02: Attachment custom folder input lacks directory picker button
- **Severity**: Low
- **Rule violated**: H7 Flexibility and efficiency / H5 Error prevention
- **Evidence**: `apps/desktop/src/components/AttachmentLocationSettings/AttachmentLocationSettings.tsx` `[Code-Read Only]`
- **Why it hurts the user**: When selecting "Specified folder below", users must manually type the folder path string rather than browsing to select an existing folder.
- **Suggested fix**: Add a "Browse..." folder picker button next to the text input.
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.settings-card-wrapper` | Bordered box per section | Excess visual boundary | Flat section with bold heading and hairline row separators |

---

## 5. What Works Well
- Instant live font preview in editor upon changing font family or size.
- Flexible attachment placement options (vault root, current note folder, or subfolder) matching Obsidian parity.
- Robust Git author and auto-commit configuration.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Flatten card borders in Editor and Files tabs (≤30 min).
- **Larger Work**: Add folder picker dialog button for custom attachment destination folder (≤45 min).

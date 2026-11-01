# TASK: Rule-based UX Review — Group 08: Settings & QuickCapture

## Step 0 — Read First
Read `AGENTS.md`, `DECISIONS.md` (index only), `PROGRESS.md`, `PERFORMANCE.md`, and `design/UXReview/00-screen-inventory.md`.
Open only ADRs relevant to settings and quick capture (ADR-0033, ADR-0065, ADR-0113, ADR-0120, ADR-0124, ADR-0160, ADR-0171, ADR-0172, ADR-0180, ADR-0198 to ADR-0201, ADR-0224, ADR-0225). Never edit an ADR.
Output goes ONLY in `design/UXReview/screens/`. Do not modify anything under `apps/` or `packages/`.

## Goal
Conduct an exhaustive, empirical, rule-based UX test of **Screen Group 08: Settings & QuickCapture** against the UX rubric.
For each tab/mode in this group, generate a detailed report file in `design/UXReview/screens/`. Every finding must name the violated rule, cite empirical evidence, and provide a concrete fix.

## Target Screens in Group 08
1. **Settings Dialog Shell & Navigation** (`apps/desktop/src/components/SettingsDialog/SettingsDialog.tsx`, `SettingsSidebar.tsx`)
   - Modal shell (`Cmd+,`), two-column layout, search filter across 12 tabs, category grouping (Options, Core Plugins, Community Plugins).
2. **Settings Tabs 1–5: Core Preferences**
   - `General`: Vault switcher, app version, updater (`GeneralSettingsTab.tsx`).
   - `Appearance`: Dark theme, active theme cards, accent color, theme browser trigger (`AppearanceSettingsTab.tsx`).
   - `Editor`: Font family dropdown, custom font upload, font size, Vim mode toggle, Vim monospace mode (`EditorSettingsTab.tsx`).
   - `Files and links`: Default note folder, attachment folder location (root, subfolder, same folder, custom) (`FilesLinksSettingsTab.tsx`, `AttachmentLocationSettings.tsx`).
   - `Git`: Status, remote URL, credentials input, commit author, auto-commit interval (`GitSettingsTab.tsx`).
3. **Settings Tab 6: Sync & Syncthing** (`apps/desktop/src/components/SettingsDialog/SyncSettingsTab.tsx`, `SyncthingPanel/`)
   - Sync mode isolation (None / Drive / Syncthing). Google Drive PKCE OAuth connect/status.
   - Syncthing Panel: Mobile QR pairing section, manual Device ID input, paired devices list with ping status, shared vaults list, incoming pending folder offers.
4. **Settings Tabs 7–12: Services & Advanced**
   - `Notifications`: Telegram token/chat ID, Slack webhook, scheduled message rules (`NotificationsSettingsTab.tsx`).
   - `Google Calendar`: OAuth sign-in, active calendar checklist, sync frequency (`GoogleCalendarSettingsTab.tsx`).
   - `AI Assistant`: Privacy consent toggles, provider switcher (Gemini, OpenRouter, Ollama), API key with keychain status, model selectors, temperature, feature toggles (`AISettingsPanel.tsx`, `AIAgentSettingsSection.tsx`).
   - `Web Clipper`: Loopback listener port, pairing token, extension pairing guide (`ClipperSettingsSection.tsx`).
   - `Community plugins`: Safety disclaimer, installed plugins list, toggle switches (`PluginsSettingsTab.tsx`).
   - `Logs`: Filterable debug log stream, level filter, copy to clipboard (`LogsSettingsTab.tsx`).
5. **System Tray QuickCapture Window Shell** (`apps/desktop/src/components/QuickCapture/QuickCapture.tsx`, `QuickCaptureHeader.tsx`, `QuickCaptureFooter.tsx`)
   - Popover window anchored to tray icon (`Cmd+Shift+N`): Close vs Quit app buttons, keyboard shortcut hints.
6. **QuickCapture Modes 1–4**
   - `Mode 1: Fast Note Capture`: Note draft input, destination folder selector (`QuickCaptureDestination.tsx`).
   - `Mode 2: Quick Reminder`: Task input, date/time pickers (`QuickCaptureReminder.tsx`).
   - `Mode 3: Audio Record`: Live waveform, record/pause/stop (`QuickCaptureRecord.tsx`).
   - `Mode 4: Quick Search`: Instant fuzzy note search popover (`QuickSearchList.tsx`).

---

## The Rubric (Score every screen against ALL of it)

### A. Nielsen's 10 Heuristics
H1 Visibility of system status · H2 Match with real world · H3 User control and freedom (undo, cancel, escape) · H4 Consistency and standards · H5 Error prevention · H6 Recognition over recall · H7 Flexibility and efficiency (shortcuts, power users) · H8 Aesthetic and minimalist design · H9 Help users recognize, diagnose, recover from errors · H10 Help and documentation.

### B. Laws of UX
- **Fitts's Law**: Hit targets for switches, radio options, dropdown triggers, and QuickCapture action buttons (min 32px desktop).
- **Hick's Law**: Settings sidebar tab count; chunking complex tabs into clear sections.
- **Jakob's Law**: Standard settings modal conventions (Obsidian/VS Code settings layout; instant auto-save of preferences without an explicit "Save Changes" button).
- **Miller's Law & Chunking**: Using `SettingsCard` and `SettingsRow` to chunk related options.
- **Doherty Threshold**: Instant setting persistence; QuickCapture window appearance <150ms.
- **Postel's Law**: Permissive input validation on API keys, custom font names, and folder paths.
- **Von Restorff / Serial Position**: Danger zone actions (Disconnect, Reset, Clear) distinct and protected.

### C. Gestalt Grouping (Box Audit — Known Issue)
Check Proximity, Similarity, Common Region, Uniform Connectedness. `SettingsCard` containers often add heavy borders where subtle spacing or hairline dividers suffice.
Grouping order of preference:
$$\text{Spacing} \longrightarrow \text{Typography/Heading} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Subtle Background} \longrightarrow \text{Border} \longrightarrow \text{Card}$$
Count and list per settings tab: wrapper nesting depth, elements with border/background/radius, boxes carrying zero information, and their flat Obsidian-style alternatives.

### D. Project Design Rules
Flat, borders not shadows, no gradients/glassmorphism, Phosphor regular icons, design tokens only (`tokens/dist/`), dark-first, Radix primitives, CUBE CSS conventions.

### E. Accessibility and Performance Feel
Contrast, focus visibility and order, keyboard-only operation, labels, reduced motion. Settings search filtering performance; zero background polling (`PERFORMANCE.md`).

---

## How to TEST (Empirical, not just code reading)
- Run the real app (`pnpm --filter @app/desktop dev:web` or Tauri app) and test Storybook stories (`apps/desktop/src/components/SettingsDialog/SettingsDialog.stories.tsx`, `SyncthingPanel.stories.tsx`, `QuickCapture.stories.tsx`).
- **Keyboard-only pass**: Settings sidebar navigation via arrow keys/Tab, toggle switches with Spacebar, dismiss with Escape. QuickCapture shortcut operation (`Esc` to close, `Cmd+Q` to quit).
- **State matrix**: Default values, unauthenticated cloud states, connected states, invalid inputs (e.g. invalid port or path), QuickCapture popover across all 4 modes.
- Measure DOM nesting depth of `SettingsCard` and `SettingsRow`.
- Label every finding `[Observed]` or `[Code-Read Only]`.

---

## Per-Screen Report Format
Save reports as `design/UXReview/screens/08-<screen-name>.md` using this template:
1. **Overview**: Purpose, entry points, current state description.
2. **Scorecard**: Table of Rule | Pass / Partial / Fail | One-line evidence.
3. **Issues**: Each with ID (e.g. `SET-01`), Severity (Blocker / High / Medium / Low), Rule Violated, Evidence (`[Observed]` or `[Code-Read Only]`), Impact, Concrete Suggested Fix, Effort (S / M / L).
4. **Box Audit**: Table of unnecessary containers and flat replacements.
5. **What Works Well**: Verified positive interactions.
6. **Quick Wins (≤ 1h)** vs **Larger Work**.

---

## Deliverables & Session Closeout
- Create `design/UXReview/screens/08-settings-shell.md`
- Create `design/UXReview/screens/08-settings-core-tabs.md`
- Create `design/UXReview/screens/08-settings-sync-syncthing.md`
- Create `design/UXReview/screens/08-settings-services-tabs.md`
- Create `design/UXReview/screens/08-quickcapture-shell.md`
- Create `design/UXReview/screens/08-quickcapture-modes.md`
- Commit: `docs(ux-review): group-08-settings-and-quickcapture`

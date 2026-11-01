# UX Review: Settings Tabs 7–12 (Services & Advanced)

## 1. Overview
The Services & Advanced preferences group encompasses external integrations and developer diagnostics:
1. **Notifications** (`NotificationsSettingsTab.tsx`): Telegram bot token & chat ID, Slack webhook URL, test notification trigger, delivery schedule rules.
2. **Google Calendar** (`GoogleCalendarSettingsTab.tsx`): OAuth 2.0 PKCE connection, synced calendars multi-checkbox list, auto-sync frequency.
3. **AI Assistant** (`AISettingsPanel.tsx`, `AIAgentSettingsSection.tsx`): Privacy consent agreement, provider switcher (Google Gemini, OpenRouter, Ollama local), API key management with OS Keychain indicator, model selector dropdown, temperature slider, agent autonomous tooling toggles.
4. **Web Clipper** (`ClipperSettingsSection.tsx`): Local loopback server port (default 37420), auth pairing token, browser extension setup instructions.
5. **Community plugins** (`PluginsSettingsTab.tsx`, `PluginSettingsList.tsx`): Community plugins master toggle, installed plugin list with individual enable/disable switches, plugin options triggers.
6. **Logs** (`LogsSettingsTab.tsx`): Real-time debug log console, log level filter (Trace, Debug, Info, Warn, Error), search filter, "Copy All" button.

---

## 2. Scorecard

| Rule | Status | Reason |
| :--- | :---: | :--- |
| **H1 Visibility of system status** | Pass | Clear connection indicators for Telegram, Slack, Google Calendar, and AI Keychain. |
| **H2 Match with real world** | Pass | Standard webhooks and API token configuration metaphors. |
| **H3 User control and freedom** | Pass | Any integration can be disconnected or wiped cleanly at any time. |
| **H4 Consistency and standards** | Pass | Consistent settings row layouts across all external services. |
| **H5 Error prevention** | Pass | "Send Test Notification" verifies Telegram/Slack tokens before saving; AI key is validated on blur. |
| **H6 Recognition over recall** | Pass | Dropdowns show available Gemini / OpenRouter models so users don't have to memorize model IDs. |
| **H7 Flexibility and efficiency** | Pass | One-click "Copy All Logs" facilitates effortless bug reporting. |
| **H8 Aesthetic and minimalist design** | Partial | Heavy card boundaries around every service config card. |
| **H9 Error recovery** | Pass | Informative error messages when OAuth or Webhook requests fail. |
| **H10 Help and documentation** | Pass | Deep links to Telegram `@BotFather` and Google Cloud Console setup guides. |
| **Fitts's Law** | Pass | Ample click targets on action buttons ("Test Webhook", "Connect Calendar"). |
| **Hick's Law** | Pass | AI providers partitioned logically by vendor. |
| **Jakob's Law** | Pass | Follows typical developer settings panels (VS Code / Raycast). |
| **Miller / Chunking** | Pass | Complex AI settings chunked into Privacy, Credentials, Models, and Agent Tools. |
| **Doherty Threshold** | Pass | Zero latency when toggling switches or filtering logs. |
| **Postel's Law** | Pass | Trims whitespace from webhook URLs and API keys automatically. |
| **Von Restorff** | Pass | Privacy consent toggle prominently flagged before enabling cloud AI. |
| **Proximity** | Pass | Test buttons are placed immediately next to token inputs. |
| **Similarity** | Pass | Shared input heights and typography. |
| **Common Region** | Partial | Over-boxed `SettingsCard` containers in AI and Notifications tabs. |
| **Uniform Connectedness** | Pass | Clear visual coupling between providers and their sub-options. |
| **Design tokens & styling** | Pass | Adheres strictly to design tokens. |
| **Accessibility (a11y)** | Pass | Sensitive credential inputs use `type="password"` with explicit labels. |
| **Performance feel** | Pass | Virtualized log stream prevents memory leaks during high log volume. |

---

## 3. Issues

### SERV-01: AI API key input lacks show/hide password toggle
- **Severity**: Low
- **Rule violated**: H3 User control and freedom / H5 Error prevention
- **Evidence**: `apps/desktop/src/components/AISettingsPanel/AISettingsPanel.tsx` `[Code-Read Only]`
- **Why it hurts the user**: Users entering or pasting long AI keys cannot verify that the full string was pasted without trailing spaces.
- **Suggested fix**: Add an eye toggle icon button inside the input field.
- **Effort**: S

### SERV-02: Logs tab lacks "Clear logs" button
- **Severity**: Low
- **Rule violated**: H3 User control and freedom
- **Evidence**: `apps/desktop/src/components/SettingsDialog/LogsSettingsTab.tsx` `[Code-Read Only]`
- **Why it hurts the user**: When debugging an issue, users cannot clear past history to watch for new events during a fresh repro.
- **Suggested fix**: Add a "Clear" button next to "Copy All".
- **Effort**: S

---

## 4. Box Audit

| Element / Container | Current Styling | Problem | Flat Replacement |
| :--- | :--- | :--- | :--- |
| `.settings-card` (AI Settings) | Bordered card box | Excessive boxing | Flat sections with clear headings and hairline dividers |
| `.clipper-card` | Bordered box | Unnecessary wrapper | Borderless description + pairing code badge |

---

## 5. What Works Well
- Secure OS Keychain storage for AI and Git credentials.
- Test buttons for Slack and Telegram verify connectivity immediately without leaving settings.
- Real-time log level filtering with one-click clipboard copy.

---

## 6. Quick Wins vs Larger Work
- **Quick Win**: Add "Clear" button to Logs tab (≤15 min).
- **Quick Win**: Add reveal password toggle to AI key inputs (≤20 min).
- **Larger Work**: Flatten nested card borders across AI and Notifications tabs (≤45 min).

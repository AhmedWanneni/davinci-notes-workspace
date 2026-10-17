# DaVinci Notes Web Clipper — Store Listings & Privacy Declarations

Official store listing copy and permission justifications for the Chrome Web Store, Firefox Add-ons (AMO), and Microsoft Edge Add-ons.

---

## 1. Store Metadata

- **Name**: DaVinci Notes Web Clipper
- **Short Name**: DaVinci Clipper
- **Version**: 0.1.0
- **Category**: Productivity / Notes
- **Summary**: Save web pages, selections, and highlights to your local DaVinci Notes vault as clean Markdown notes.

---

## 2. Store Description

### Short Description (up to 132 characters)
Save articles, text selections, and highlights directly into your local DaVinci Notes vault as clean Markdown notes.

### Detailed Description

DaVinci Notes Web Clipper lets you capture the web directly into your personal knowledge base without relying on cloud services or third-party servers.

**Key Features:**
- **Zero-Cloud & Privacy-First**: Clips travel directly from your browser to the DaVinci Notes desktop application on your computer over a secure local loopback connection. No telemetry, no intermediate servers.
- **Clean Markdown Formatting**: Uses an intelligent readability extractor to turn cluttered web pages into clean Markdown, preserving headings, lists, tables, code blocks, and math formulas.
- **Three Clipping Modes**:
  - Full Page: Extracts the main article content cleanly.
  - Selection: Clips only the text you highlight on the page.
  - Highlights: Saves your persistent highlights from the page.
- **In-Page Highlighter**: Highlight important passages on any web page. Your highlights persist locally and restore automatically when you revisit the page.
- **Custom Templates & Auto-Apply**: Define custom note formats with variables (`{{title}}`, `{{url}}`, `{{author}}`, `{{published}}`, `{{body}}`), CSS selectors, and Schema.org metadata. Auto-apply rules select the right template based on URL or page type.
- **Offline Image Downloads**: Option to download images into your vault attachments folder and rewrite links for 100% offline readability.
- **Closed-App Queuing**: If DaVinci Notes is closed, clips are queued safely in your browser and automatically delivered when the app opens.
- **Quick-Clip Shortcut**: Press `Alt+Shift+S` to instantly clip the active tab without interrupting your reading flow.

---

## 3. Permissions Justification

| Permission | Purpose | Justification |
|---|---|---|
| `activeTab` | Read page content | Used only when the user explicitly triggers the extension (clicking the icon or pressing a shortcut) to extract the article text, title, and metadata. |
| `scripting` | Content extraction | Executes the extraction scripts in the context of the active tab upon invocation. |
| `storage` | Save settings & queue | Stores user templates, local pairing tokens, highlight anchors per URL, and offline queued clips in `chrome.storage.local`. |
| `contextMenus` | Context menu actions | Allows users to right-click on web pages or selections to trigger clipping and highlighting. |
| `downloads` | Download .md fallback | Allows users to save clipped notes as local `.md` files when DaVinci Notes desktop is closed or unpaired. |
| `host_permissions` (`http://127.0.0.1/*`) | Local app transport | Required to send clipped Markdown payloads and receive delivery acknowledgments from the DaVinci Notes desktop app running on the local machine without CORS rejection. |
| `optional_host_permissions` (`*://*/*`) | Highlight restoration | Declared as optional so users can opt into restoring saved highlights on revisiting pages without granting blanket access by default. |

---

## 4. Privacy Policy & Single Purpose Declaration

### Single Purpose
The DaVinci Notes Web Clipper has a single purpose: to extract text and metadata from web pages upon explicit user request and save it as Markdown notes into the user's local DaVinci Notes vault or download folder.

### Data Collection & Usage
- **Personal Data**: The extension does not collect, log, transmit, or sell any personal data, browsing history, or identifiers.
- **Remote Communications**: The extension makes zero connections to external servers or cloud services. Network activity is strictly confined to `http://127.0.0.1` for local communication with the user's desktop application.
- **Local Storage**: All templates, pairings, highlights, and cached offline clips are stored strictly in the browser's sandboxed local storage on the user's device.

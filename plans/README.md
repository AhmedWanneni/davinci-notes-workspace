# Feature Implementation Plans

This directory contains the phased engineering specifications and implementation roadmaps for DaVinci Notes (Sophia).

Every major feature begins with an adversarial, phased feature plan conforming to the constraints in [`AGENTS.md`](../AGENTS.md) and [`PERFORMANCE.md`](../PERFORMANCE.md).

---

## Active & Implemented Feature Plans

| Feature Area | Specification Document | Status | Primary Subsystems | Linked ADRs |
|---|---|---|---|---|
| **Release Pipeline & Distribution** | [`releases-feature-plan.md`](releases-feature-plan.md) | **Completed** | CI Matrix, Signing, Auto-Updater, Website `/download`, Rollback CLI | ADR-0242 – ADR-0248 |
| **"Create a Release" Agent Skill** | [`release-skill-feature-plan.md`](release-skill-feature-plan.md) | **Planning** | Universal Agent Skill, Preflight Checks, Approval Gates, Auto-Deploy Website | ADR-0249 |
| **Git Manager** | [`git-manager-feature-plan.md`](git-manager-feature-plan.md) | **Completed** | Desktop `@app/git-manager`, CodeMirror Merge Diff, SVG Graph, OS Keychain | ADR-0232 – ADR-0241 |
| **Meeting Recorder & AI Listening** | [`meeting-recorder-feature-plan.md`](meeting-recorder-feature-plan.md) | **Completed** | Rust `cpal` Audio Loopback, Whisper Transcription, Vault Grounding | ADR-0226 – ADR-0231 |
| **AI Agent & Vault Grounding** | [`agent-feature-plan.md`](agent-feature-plan.md) | **Completed** | `@app/ai-agent`, Autonomous Tool Jail, Map of Content, FTS5 Search | ADR-0211 – ADR-0218 |
| **Reminders & Scheduled Messages** | [`reminders-feature-plan.md`](reminders-feature-plan.md) | **Completed** | Desktop `davinci://reminders`, Telegram/Slack/WhatsApp adapters, SQLite | ADR-0182 – ADR-0184 |
| **Google Calendar Sync** | [`calendar-feature-plan.md`](calendar-feature-plan.md) | **Completed** | Schedule-X Shell, Incremental SyncToken, SQLite Event Cache | ADR-0199, ADR-0201, ADR-0223 |
| **Bookmarks & Web Archive** | [`bookmarks-feature-plan.md`](bookmarks-feature-plan.md) | **Completed** | Desktop Bookmarks View, Chrome/Safari HTML Import, AI Organizer | ADR-0210 |
| **Web Clipper Extension** | [`web-clipper`](web-clipper/) | **Completed** | WXT Web Extension, Receiver Server, Reader Mode Content Extractor | ADR-0174, ADR-0180 |
| **System Tray & Quick Capture** | [`tray-popover-plan.md`](tray-popover-plan.md) | **Completed** | macOS NSPanel Popover, Global Hotkey, Voice/Text Fast Capture | ADR-0225 |
| **Canvas Card Grouping** | [`canvas-grouping-plan.md`](canvas-grouping-plan.md) | **Completed** | Infinite Canvas, Visual Card Clusters, Bounding Boxes | ADR-0145 |
| **Canvas PDF Cards** | [`canvas-pdf-plan.md`](canvas-pdf-plan.md) | **Completed** | Canvas PDF Embedding, Multi-Page Preview | ADR-0148 |
| **Native CLI** | [`cli-feature-plan.md`](cli-feature-plan.md) | **Completed** | Rust Terminal Client, Headless Note Search & Edit | ADR-0176 |
| **Web Version Roadmap** | [`web-version-feature-plan.md`](web-version-feature-plan.md) | Proposed | Client-Side Web Assembly, OPFS Local Storage | ADR-0116 |

---

## Historical Foundation Plans

Earlier bootstrap and stabilization plans are archived under [`historical/`](historical/):

- [`historical/phase-6-editor-integration.md`](historical/phase-6-editor-integration.md): Core CodeMirror 6 editor engine integration.
- [`historical/phase-7-file-tree-sidebar.md`](historical/phase-7-file-tree-sidebar.md): Virtualized vault file tree navigation.
- [`historical/phase-8-backlinks-panel.md`](historical/phase-8-backlinks-panel.md): Backlinks and unlinked mentions indexing.
- [`historical/phase-9-quick-switcher.md`](historical/phase-9-quick-switcher.md): Command palette and note search quick switcher.
- [`historical/phase-10-graph-view.md`](historical/phase-10-graph-view.md): D3 force-directed visual knowledge graph.
- [`historical/phase-11-settings-and-polish.md`](historical/phase-11-settings-and-polish.md): Multi-tab settings dialog and theme selection.
- [`historical/phase-12-performance-audit.md`](historical/phase-12-performance-audit.md): Initial performance budget benchmarks.
- [`historical/phase-13-staging-release-1.md`](historical/phase-13-staging-release-1.md): Initial desktop shell staging build.
- [`historical/desktop-app-build.md`](historical/desktop-app-build.md): Tauri v2 desktop shell scaffolding.
- [`historical/cube-css-app-migration.md`](historical/cube-css-app-migration.md): Design tokens & SCSS module styling migration.
- [`historical/ui-grid-layout-plan.md`](historical/ui-grid-layout-plan.md): Obsidian-parity multi-pane workspace layout.
- [`historical/stablize.md`](historical/stablize.md): Post-MVP stabilization checklist.

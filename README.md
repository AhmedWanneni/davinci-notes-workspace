# DaVinci Notes (Sophia)

<p align="center">
  <strong>A local-first, privacy-focused, zero-backend personal knowledge base and networked note-taking application.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-24C8D8?style=flat-square&logo=tauri&logoColor=white" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Expo-SDK_53-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo SDK 53" />
  <img src="https://img.shields.io/badge/Rust-2021_Edition-DEA584?style=flat-square&logo=rust&logoColor=black" alt="Rust" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square" alt="License" />
</p>

---

## Overview

**DaVinci Notes** (internally designated **Sophia**) is an Obsidian-inspired, local-first personal knowledge workspace built from the ground up for speed, cryptographic privacy, and long-term data sovereignty.

Every note is stored as plain Markdown on your local disk. There is **no owned backend server**, no proprietary database format, and zero cloud vendor lock-in. Multi-device synchronization operates entirely through independent channels (Google Drive private application storage and peer-to-peer Syncthing folder replication).

---

## Key Capabilities

### ✍️ CodeMirror 6 Markdown Editor
- **Bi-directional Wikilinks**: Seamless auto-complete for `[[Note Title]]`, block references, and heading targets.
- **Rich Live Preview**: Inline KaTeX math equations (`$$...$$`), interactive Mermaid diagrams, live table grids with sorting/resizing, and syntax-highlighted code blocks.
- **Editorial Typography**: Hand-crafted Swiss/editorial typography tokens with organic borders and zero drop-shadow bloat.

### 🕸️ Interactive Knowledge Graph
- **Force-Directed Graph**: High-performance D3 visual graph rendering note relationships, local neighborhoods, backlinks, and orphan nodes.
- **God Nodes & Clusters**: Automatic Leiden community clustering and hub detection powered by the built-in Graphify engine.

### 🔄 Serverless Multi-Device Sync ([ADR-0116](docs/adr/0116-sync-via-drive-syncthing-no-owned-backend.md))
- **Google Drive Sync**: Synchronizes manifests and content directly into your personal Google Drive `appDataFolder` without third-party intermediary servers.
- **Syncthing P2P Replicator**: Native Syncthing daemon management with one-tap QR pairing between Desktop and Mobile.
- **Diff3 Conflict Resolution**: Automatic 3-way line-level text merging with non-destructive conflict branching for concurrent edits.

### 🌿 Integrated Git Source Control ([ADR-0232](docs/adr/0232-git-manager-phase-0-audit-and-capabilities.md))
- **Side-by-Side Diff Editor**: Two-pane CodeMirror merge viewer opened as native workspace tabs.
- **Git Manager Sidebar**: Visual branch switcher, ahead/behind counters (`↑2 ↓1`), staging/unstage toggles, and commit history graphs.
- **Open Vault from GitHub**: Clone any public or private remote repository directly into a local vault using OS Keychain PAT storage.

### 🎙️ Audio Meeting Recorder & AI Listening ([ADR-0226](docs/adr/0226-native-desktop-dual-channel-audio-loopback-architecture.md))
- **Dual-Channel Loopback Capture**: Low-latency desktop system audio and microphone recording via Rust `cpal`.
- **Whisper Streaming Pipeline**: Chunked speech-to-text with interactive audio players in Markdown notes.
- **Live Vault Grounding**: Automatic synthesis of meeting action items, wikilink suggestions, and knowledge graph cross-linking.

### 🤖 Autonomous Local AI Agent ([ADR-0211](docs/adr/0211-modality-neutral-tool-calling-and-streaming.md))
- **Vault Grounding**: Natural language queries grounded in your personal notes via SQLite FTS5 full-text indexing.
- **Safety Jail**: Strict, capability-gated execution environment preventing unauthorized external operations.
- **Map of Content (MOC)**: Autonomous folder synthesis and structured topic index generation.

### 📅 Google Calendar & Reminders ([ADR-0182](docs/adr/0182-reminder-syntax-and-storage-model.md), [ADR-0199](docs/adr/0199-google-calendar-oauth-architecture-and-scope-isolation.md))
- **Two-Way Calendar Sync**: Schedule-X interactive calendar shell with bidirectional Google Calendar OAuth synchronization.
- **Task Reminders**: Natural inline task reminders (`- [ ] Review PR (@2026-10-30 09:00 /daily)`).
- **Multi-Channel Dispatcher**: Native desktop notifications, Telegram bot, Slack webhooks, and WhatsApp Click-to-Chat adapters with encrypted OS Keychain secret storage.

### 🔖 Web Clipper & Bookmarks ([ADR-0174](docs/adr/0174-clipper-content-extraction-and-markdown-libraries.md), [ADR-0210](docs/adr/0210-bookmarks-storage-identity-and-lifecycle.md))
- **Browser Extension**: Companion web extension (`apps/web-clipper`) for clipping articles, highlighting text, and saving clean reader-mode Markdown.
- **Browser Importers**: One-click import for Chrome, Safari, and Firefox bookmark trees.

---

## Monorepo Architecture

DaVinci Notes is structured as a high-performance [pnpm](https://pnpm.io/) + [Turborepo](https://turbo.build/) workspace:

```
davinci-notes/
├── apps/
│   ├── desktop/               # Desktop application (Tauri v2 + React 19 + SCSS)
│   ├── mobile/                # Mobile application (Expo SDK 53 + React Native + DOM Components)
│   ├── website/               # Marketing & static download site (Astro static pre-rendered)
│   ├── web-clipper/           # Browser extension for Chrome/Firefox/Safari (WXT)
│   └── cli/                   # Native terminal tool (Rust)
│
├── packages/
│   ├── editor/                # Shared CodeMirror 6 markdown editor & extensions
│   ├── design-system/         # Shared React UI components & typography
│   ├── design-tokens/         # Design token source of truth (Style Dictionary)
│   ├── sync-client/           # Manifest-diff sync engine & diff3 text merger
│   ├── git-manager/           # Git status, diff viewer, and history graph
│   ├── indexer/               # Wikilink resolution, SQLite schema, and full-text search
│   ├── ai-agent/              # Grounded LLM agent & prompt rewriting pipeline
│   ├── canvas/                # Infinite spatial canvas (nodes, cards, connections)
│   ├── attachments/           # Image, audio, and media ingestion & deduplication
│   ├── database/              # SQLite database lock & transaction bridge
│   ├── core-types/            # Canonical shared TypeScript interfaces
│   └── plugin-runtime/        # Capability-gated plugin execution environment
│
├── docs/                      # Technical specifications, ADRs & runbooks
│   ├── architecture/          # Foundational stack, mobile, and design architecture specs
│   ├── adr/                   # 248 Architecture Decision Records
│   └── releasing.md           # Release management & rollback runbook
│
├── plans/                     # Phased feature implementation plans & historical archives
│   ├── README.md              # Feature plans status index
│   └── historical/            # Archived bootstrap phase plans
│
└── scripts/
    └── release/               # Automated release, version sync & verification scripts
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or later
- **pnpm**: `v10.x` (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Rust**: `1.77.2` or later (`rustup default stable`)
- **Python**: `3.10+` (optional, for local [Graphify](https://github.com/Graphify-Labs/graphify) code graphs)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/AhmedWanneni/davinci-notes-workspace.git
cd davinci-notes-workspace

# Install all workspace dependencies with frozen lockfile
pnpm install
```

### 2. Launch Development Environments

```bash
# Launch Desktop application (Web dev server + Tauri v2 native shell)
pnpm --filter @app/desktop dev

# Launch Desktop in pure Web browser mode (fast frontend UI iteration)
pnpm --filter @app/desktop dev:web

# Launch Mobile application (Expo development server)
pnpm --filter @app/mobile dev

# Launch Marketing & Download Website (Astro dev server)
pnpm --filter @app/website dev
```

### 3. Run Verification & Quality Gates

```bash
# Run all unit tests across monorepo packages (Vitest)
pnpm test

# Typecheck all TypeScript packages
pnpm turbo run typecheck

# Lint SCSS and TypeScript
pnpm lint

# Verify version synchronization across all 6 manifests
pnpm run check:version-sync
```

---

## Release Pipeline & Distribution

DaVinci Notes utilizes a fully automated, serverless release pipeline:

- **Manifest Parity**: [`scripts/release/check-version-sync.sh`](scripts/release/check-version-sync.sh) enforces exact version synchronization across all 6 project manifests.
- **One-Command Releases**: Maintainers cut releases using the automated driver:
  ```bash
  bash scripts/release/release.sh [patch|minor|major]
  ```
- **Multi-Platform CI Matrix**: GitHub Actions automatically compiles, signs, notarizes, and attaches installers to GitHub Releases:
  - macOS Apple Silicon DMG (`aarch64-apple-darwin`)
  - macOS Intel DMG (`x86_64-apple-darwin`)
  - Windows x64 Installer (`x86_64-pc-windows-msvc`)
  - Linux x64 Universal AppImage & `.deb` (`x86_64-unknown-linux-gnu`)
- **Auto-Updates**: In-app updater powered by `tauri-plugin-updater` reading cryptographically signed `latest.json` directly from GitHub Releases CDN.
- **Static Website Download**: Download page pre-rendered with Astro at `/download` with client-side OS auto-detection.

See [`docs/releasing.md`](docs/releasing.md) for the complete release runbook, hotfix instructions, and emergency rollback protocol.

---

## Architecture Principles & Documentation

All contributions adhere to strict standing architectural rules:

1. **Lightweight & Fast Principle** ([`PERFORMANCE.md`](PERFORMANCE.md)): Every feature, package, and dependency is weighed against bundle size, memory footprint, and CPU budget. Heavy dependencies are strictly banned.
2. **File Size Hard Caps** ([`AGENTS.md`](AGENTS.md)): Files are soft-capped at 150–200 lines and hard-capped at 250 lines (`max-lines`). Single responsibility per file.
3. **Universal SQLite Lock Discipline** ([ADR-0168](docs/adr/0168-vault-index-write-lock-contention-and-universal-lock-discipline.md)): Every read and write to `vault-index.db` routes through `withDbLock` to prevent write contention.
4. **Immutable Migrations** ([ADR-0035](docs/adr/0035-never-edit-applied-migration.md)): Applied database migrations are never modified; schema evolution requires new incremental migration entries.
5. **Architectural Decisions Index**: Consult [`DECISIONS.md`](DECISIONS.md) before altering established patterns.

---

## Contributing

We welcome contributions from the community! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/architecture/git-workflow.md`](docs/architecture/git-workflow.md) for pull request guidelines, commit formatting rules (`@commitlint/config-conventional`), and coding conventions.

---

## License

DaVinci Notes is open source software licensed under the [Apache License, Version 2.0](LICENSES.md).

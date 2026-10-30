# Architecture Specifications & Technical Standards

This directory contains the foundational technical specifications, architectural blueprints, and coding standards for DaVinci Notes (Sophia).

---

## System Architecture Overview

```mermaid
flowchart TD
    subgraph Clients["Applications Layer (apps/)"]
        Desktop["Desktop (apps/desktop)\nTauri v2 + React 19 + SCSS"]
        Mobile["Mobile (apps/mobile)\nExpo SDK 53 + React Native"]
        Website["Website (apps/website)\nAstro Static + /download"]
        Clipper["Web Clipper (apps/web-clipper)\nWXT Browser Extension"]
        CLI["Terminal CLI (apps/cli)\nRust Native CLI"]
    end

    subgraph CorePackages["Shared Domain Packages (packages/)"]
        Editor["@app/editor\nCodeMirror 6 Engine"]
        DesignSystem["@app/design-system\nEditorial SCSS Primitives"]
        Tokens["@app/design-tokens\nStyle Dictionary Source"]
        Indexer["@app/indexer\nWikilinks, Reminders, FTS5"]
        SyncClient["@app/sync-client\nManifest Diffing & Conflict Resolution"]
        GitManager["@app/git-manager\nGit History & Diffing UI"]
        AIAgent["@app/ai-agent\nAutonomous Vault Assistant"]
        Canvas["@app/canvas\nInfinite Visual Canvas"]
        Database["@app/database\nSQLite & Universal Lock Bridge"]
    end

    subgraph NativeIOLayer["Native Desktop Engine (src-tauri/)"]
        RustShell["Tauri Rust Runtime (v2.11+)"]
        FSWatcher["Vault Watcher (notify crate)"]
        AudioLoopback["Audio Loopback Capture (cpal)"]
        SQLiteEngine["SQLite Indexer (vault-index.db)"]
        KeychainBridge["OS Keychain Access (keyring)"]
        Sidecars["Bundled Syncthing External Binary"]
    end

    Desktop --> CorePackages
    Mobile --> CorePackages
    Desktop <--> NativeIOLayer
```

---

## Architectural Specifications Index

| Specification | Document | Scope & Focus |
|---|---|---|
| **Desktop Stack Architecture** | [`stack-architecture.md`](stack-architecture.md) | Tauri v2 shell, React 19 architecture, Rust I/O boundary, SQLite lock discipline, and state management. |
| **Mobile Architecture** | [`mobile-architecture.md`](mobile-architecture.md) | Expo SDK 53, React Native architecture, sandboxed storage, NativeWind, and DOM components. |
| **Design System & Tokens** | [`design-system.md`](design-system.md) | Editorial Swiss-influenced typography, zero-shadows rule, token contracts, and SCSS module patterns. |
| **Coding Conventions** | [`conventions.md`](conventions.md) | File size caps (<250 lines), single-responsibility rule, TypeScript strictness, and anti-dumping standards. |
| **Git & PR Workflow** | [`git-workflow.md`](git-workflow.md) | Branching strategy, conventional commits (`commitlint`), pull request checklists, and release gating. |
| **Visual Wireframes** | [`wireframe.md`](wireframe.md) | Component wireframes, sidebar rails, tabs, layout dimensions, and editor canvas layouts. |

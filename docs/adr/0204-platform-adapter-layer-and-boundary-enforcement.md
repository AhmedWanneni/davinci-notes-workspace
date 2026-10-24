# 0204 — Platform Adapter Layer and Boundary Enforcement

- **Status:** Accepted (extends ADR-0001, ADR-0011, ADR-0029)
- **Date:** 2026-10-22

## Context

DaVinci Notes originally coupled desktop UI and feature workflows directly to `@tauri-apps/*` packages (`invoke`, `dialog`, `fs`, `sql`, `window`, `event`) across 49 source files in `apps/desktop/src/`. Supporting a browser version (`apps/web`) while sharing the same design system, indexer, sync engine, and feature logic requires a strict runtime-agnostic boundary between UI/feature code and host OS or browser APIs.

## Decision

1. **Dedicated Adapter Package (`@app/platform-adapters`)**:
   - Define nine typed contracts in `packages/platform-adapters/`: `FileSystemAdapter`, `WatcherAdapter`, `SqliteAdapter`, `DialogAdapter`, `SecretStoreAdapter`, `WindowControlsAdapter`, `ExternalUrlAdapter`, `NotificationAdapter`, and `VaultRegistryAdapter`.
   - Provide runtime dependency injection via `setPlatformAdapters()` and `getPlatformAdapters()`.
2. **Desktop & Web Implementations**:
   - Desktop (`apps/desktop/src/adapters/`) provides `Tauri*Adapter` classes wrapping `@tauri-apps/*` and Rust `invoke` commands.
   - Web (`packages/platform-adapters/src/web/`) provides browser implementations (`OpfsFileSystemAdapter`, `FileSystemAccessAdapter`, `WebWatcherAdapter`, `WebSqliteAdapter`, `WebDialogAdapter`, `WebSecretStoreAdapter`, `WebVaultRegistryAdapter`, `WebWindowControlsAdapter`, `WebExternalUrlAdapter`, `WebNotificationAdapter`).
3. **Architecture Boundary Enforcement**:
   - Enforce package dependency boundaries via `eslint-plugin-boundaries` in `.eslintrc.js` so `app-web` and shared packages never import `@tauri-apps/*`.

## Consequences

- Desktop behavior remains 100% unchanged while routing I/O through `@app/platform-adapters`.
- Web and desktop shells can evolve independently without leaking runtime globals into shared components or domain packages.

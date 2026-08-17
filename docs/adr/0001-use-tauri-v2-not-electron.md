# ADR-0001: Use Tauri v2, not Electron

## Status
Accepted

## Context
Need desktop *and* mobile (iOS/Android) from one codebase. Electron has no mobile path. Bundle size, idle memory, and startup speed matter (see `PERFORMANCE.md`).

## Decision
Use Tauri v2 (Rust + native webview). Rust handles native I/O; the frontend is webview-rendered.

## Consequences
- ~8 MB bundle vs Electron's ~150 MB; lower idle memory, faster startup.
- Desktop and mobile share one codebase.
- Native filesystem/vault work is written in Rust (`apps/desktop/src-tauri`).

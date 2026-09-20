# ADR-0162: Unified custom window controls

## Status

Accepted

## Context

The prior macOS overlay configuration left native traffic lights visible after
the app removed its conventional title bar. In the sidebar, they read as
unintegrated system chrome rather than part of the application layout.

## Decision

Use undecorated windows on macOS as well as Windows and Linux, and render the
existing Tauri-backed custom minimize, maximize, and close controls in the
sidebar header on every platform. When the sidebar is collapsed, render the
same controls in the tab row. The controls use existing tokens for compact,
flat border-based styling and retain keyboard focus states.

## Consequences

This supersedes the native-traffic-light portion of ADR-0156. The macOS green
button hover menu is no longer available; maximize is provided by the app
button and existing drag-region double-click. No dependency or background work
is added.

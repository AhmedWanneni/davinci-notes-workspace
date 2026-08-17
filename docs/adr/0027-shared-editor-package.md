# ADR-0027: Shared `@app/editor` package for desktop and mobile

## Status
Accepted

## Context
The CodeMirror 6 editor's core logic is identical across platforms but requires distinct layout wrappers and platform-specific options (folder-picker storage paths on desktop vs app-private sandbox on mobile).

## Decision
Implement the editor inside a shared workspace package (`packages/editor`, re-exported as `@app/editor`), parameterizing the workspace metadata (`notePaths`, `sourcePath`, `onLinkClick` navigation callbacks) so the React component stays storage-agnostic.

## Consequences
- No duplicated editor configuration across platforms.
- Eases the path for mobile-specific touch customization.

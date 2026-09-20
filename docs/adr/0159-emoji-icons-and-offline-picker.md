# 159. Emoji Icon Storage and Offline Picker Boundary

Date: 2026-09-20

## Context

Files and folders need user-selected native emoji icons without adding startup
weight, remote network dependencies, or a second source of truth for note
metadata.

## Decisions

1. Markdown notes store `icon` in their existing YAML frontmatter. Folders and
   non-Markdown files use the vault-relative `.davinci/icons.json` map. The
   map is atomically written with stable, sorted keys and is updated by the
   canonical rename, move, and delete paths.
2. Use `frimousse@0.3.0` (MIT; peer dependency `react: ^18 || ^19`) with
   native system emoji. `emoji-mart` was rejected: its current packages were
   published roughly two years ago and its React peer range is React 18-only.
3. Bundle only `emojibase-data@17.0.0` English `data.json` and
   `messages.json`. A build/dev preparation script copies them from the pinned
   dependency into ignored static assets; no CDN or external fetch is used.
   French can be added later only if the picker itself is localized.
4. The picker is dynamically imported by the file-tree icon action and its
   data is fetched from `/emoji-data` only after the picker mounts. The Tauri
   CSP remains `null`; no remote `connect-src` origin is added.
5. Frimousse supplies virtualized categories, search, keyboard navigation,
   skin tones, and native-font support filtering. Recents, if needed, are
   stored through the existing settings persistence under the database lock.

## Status

Accepted.

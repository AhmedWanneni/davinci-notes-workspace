# ADR-0177: Editor Media Insert Items, Declarative Dialogs, and Attachment Pipeline Integration

## Status

Accepted

## Context

Phase 3 requires adding three media items (Image, YouTube, and Tweet / X) to the immutable `@app/editor` insert registry. The items must automatically surface across all entry points (the header `...` menu, the `/` slash menu, and the Command Palette) without second lists or hardcoded dialogs inside menu components. The syntax must reuse existing renderers (`embedImageExtension.ts`, `imageExtension.ts`, `youtubeEmbed.ts`, `tweetEmbed.ts`, and `tweetCard.ts`), and strict URL validation must reject lookalikes, non-http(s) protocols, overlong strings, and unsupported forms such as YouTube Shorts (per ADR-0102).

## Decision

- Extend `InsertItem` with an optional declarative `dialog` specification (`InsertDialogSpec`) and `input` context payload.
- Register three media items under a new `Media` group:
  - **Image**: offers two sources in one dialog — importing a local image through the existing vault attachment pipeline (`writeAttachmentToVault`) yielding a vault-relative embed `![[path]]`, or providing an external URL yielding `![](url)`.
  - **YouTube**: validates standard watch and youtu.be URLs, preserving timestamp query parameters (`?t=...`), and rejecting Shorts with an explicit inline message. Syntax: `![](youtube-url)`.
  - **Tweet / X**: validates strict status URLs (`x.com` / `twitter.com`), inserting `![](x-status-url)` rendered by the script-free oEmbed card.
- Extract insertion dispatching into `runInsertItem()`: items without a dialog insert immediately; items with a dialog open a small, flat Obsidian-style dialog built dynamically from the item's specification. No dialogs are hardcoded into menu components.
- Dialog interactions guarantee: Enter confirms, Esc cancels, Cancel button inserts nothing and preserves cursor selection, and invalid input displays an inline error without closing the dialog.
- Enforce strict URL parsing: protocol must be `http:` or `https:`; maximum length 2048 characters; exact hostname allowlists (no lookalikes or substring checks); zero insertion of iframes or raw user HTML.
- **Local-first & Network Independence**:
  - Local images require no network and render completely offline.
  - External images, YouTube, and Tweet embeds require network to fetch media/metadata; offline states fail gracefully to native placeholders or plain status links.
  - No background network fetching occurs during insertion.
- **Proposed Attachment File-Size Limit**: The attachment pipeline currently has no file-size ceiling. We propose a default ceiling of 50 MB, configurable in Attachment Settings (`maxAttachmentSizeBytes`), to guard against accidental imports of oversized files while accommodating high-resolution photos and documents.

## Consequences

- All three insertion surfaces (`...` menu, slash menu, command palette) automatically gain media support with shared MRU recency tracking and zero code duplication.
- Single transaction, single undo step, blank-line padding, and read-only protection remain uniform across all items.
- Lazy-loading dialogs and file pickers ensures zero startup bundle impact.

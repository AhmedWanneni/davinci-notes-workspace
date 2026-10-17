# ADR-0197: Mobile note identity and rename safety

## Status

Accepted (extends ADR-0187, ADR-0196)

## Context

Testing on Android devices revealed three critical runtime failures during note creation, editing, and navigation:

1. **Rename Collisions on Android (`FileAlreadyExistsException`)**:
   - `FileSystemFile.rename(name)` on Android delegates to Kotlin `javaFile.toPath().moveTo(newFile.toPath())` without `StandardCopyOption.REPLACE_EXISTING`.
   - When a note was created, `atomicWriteNote` performed a redundant second atomic rename on top of `adapter.writeNote`'s own atomic write (`atomicWriteEntry`), attempting to rename a `.tmp` file over an existing destination.
   - If `Untitled.md` already existed, opening or creating a new note attempted to rename over it without disambiguation, crashing with:
     ```
     Uncaught (in promise) Error: Call to function 'FileSystemFile.rename' has been rejected.
     → Caused by: java.nio.file.FileAlreadyExistsException: .../Untitled.md
     ```

2. **Navigation Stack Staleness on Rename**:
   - Routes carried only mutable file paths (`/editor?path=Untitled.md`).
   - When H1 heading sync or user actions renamed a note, `router.setParams()` only updated the top `/editor` screen; the underlying `/note` screen in the navigation stack retained the stale path.
   - Navigating back popped to a stale path or an orphaned screen. Furthermore, `handleBack` used `router.replace("/note")`, duplicating screen instances in the stack instead of popping with `router.back()`.

3. **Editor Surface Height Collapse & Focus**:
   - In React Native with CSS interop, `<View className="flex-1">` collapsed to height 0 between fixed header and toolbar elements without an explicit inline `style={{ flex: 1, width: "100%" }}`.
   - Tapping the empty area of the editor did not focus CodeMirror because the host element lacked touch-event listeners.

## Decision

1. **Stable Note Identity (`NoteStore`)**:
   - Introduce `NoteStore` (`apps/mobile/vault/noteStore.ts`) providing a reactive bidirectional mapping between a stable note ID (`note_<uuid>`) and its current vault-relative path.
   - Routes carry `noteId` alongside `path`. Both `/note` and `/editor` resolve the current note path reactively via `useNotePath(noteId, path)` and re-verify file existence on focus via `useFocusEffect`.
   - Renaming a note immediately updates `NoteStore`, allowing all screens in the navigation stack to observe the new path without duplicating routes.

2. **Atomic Write Simplification & Non-Destructive Rename**:
   - Remove the redundant second rename step in `atomicWriteNote`. `adapter.writeNote(path, content)` delegates directly to `atomicWriteEntry`, which uses hidden temporary files (`.name.<nonce>.tmp`) and moves with `{ overwrite: true }` (`StandardCopyOption.REPLACE_EXISTING`), guaranteeing full crash safety.
   - New notes are created with pre-disambiguated unique filenames (`generateUniqueNotePath`: `Untitled.md`, `Untitled 1.md`, ...) at creation time rather than renaming on open.
   - `adapter.renameNote` performs safe non-destructive renames: returns the actual resolved path, disambiguates target collisions with numeric suffixes, and updates `NoteStore`.

3. **Navigation Stack & Recovery Discipline**:
   - `handleBack` in `/editor` flushes pending debounced bridge changes and calls `router.back()`. No `router.replace` duplicate screen creation.
   - `new-note-action` trampoline replaces history using `<Redirect href="/editor?preset=new&autoFocus=1" />`, ensuring the trampoline never stays in the back history.
   - When a note is deleted externally or missing on disk, `/note` renders recovery options ("Back" and "Go to Files"), eliminating dead ends.

4. **Editor Surface & Touch Focus**:
   - Apply explicit `style={{ flex: 1, width: "100%" }}` to container Views in `editor.tsx`.
   - In `EditorDom.tsx`, style HTML, body, root, and host container to 100% height, and attach `click` and `touchend` event handlers to the host div to focus CodeMirror and place the cursor at the end when tapping empty surface area.

## Consequences

- Android `FileAlreadyExistsException` crashes during note creation and editing are completely eliminated.
- Navigating back from `/editor` to `/note` or between notes always displays the current, correctly renamed note without stale paths or duplicate screens.
- Missing notes provide clean recovery navigation rather than blank or crashing views.
- Tapping anywhere in the editor surface immediately activates CodeMirror and focuses input.

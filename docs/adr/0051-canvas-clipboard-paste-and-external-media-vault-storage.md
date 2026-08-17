# ADR-0051: Canvas clipboard paste and external media import saved to vault attachments

## Status
Accepted

## Context
Adding media to a canvas requires creation workflows beyond selecting existing vault files:
1. Pasting image data directly from the system clipboard (`Cmd+V` / `Ctrl+V`).
2. Dropping external image or video files from the OS file manager onto the canvas.
Per ADR-0004 and ADR-0050, the canvas cannot store base64 data and must reference a real file path in the vault.

## Decision
- **Automatic Vault Storage in `attachments/`**: When raw image data or external media files are pasted or dropped onto the canvas, the application writes the binary bytes to disk inside the active vault under `attachments/Pasted image YYYYMMDDHHMMSS.png` (or `attachments/<original-filename>`).
- **Native Rust `write_binary_file` Command**: Implemented safe binary I/O in `fs.rs` validating vault boundaries with `resolve_in_vault` and ensuring parent directories (`attachments/`) are automatically created.
- **Immediate Index & Tree Sync**: Writing the media file updates `allNotePaths` in the store and refreshes the sidebar file tree with media icons (`Image`, `Video`).
- **Canvas Node Instantiation**: After persisting the file to disk, a `CanvasFileNode` referencing the newly created vault path is placed at the viewport center or drop position.

## Consequences
- Seamless creation workflow for media cards matching user mental models.
- All media assets exist as plain, grep-able, portable files on disk.
- Zero base64 creep into canvas files.

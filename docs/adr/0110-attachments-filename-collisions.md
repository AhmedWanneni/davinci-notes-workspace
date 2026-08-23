# ADR-0110: Attachment filename collision suffixes

## Status

Accepted

When the target path already exists, attachment writes preserve the requested
filename first, then try a space-separated numeric suffix before the extension:
`image.png`, `image 1.png`, `image 2.png`, and so on. The existence check and
write are asynchronous and continue until an unused candidate is found.

The writer creates the resolved folder recursively before checking collisions.
It rejects path separators in the filename so a caller cannot escape the
resolved folder. Unsupported extensions produce the structured
`AttachmentWriteError` with code `unsupported-format`; this phase does not
inspect file contents or MIME signatures.

The core package accepts an injected native filesystem adapter for cheap tests;
desktop supplies Tauri's `exists`, recursive `mkdir`, and async `writeFile`.

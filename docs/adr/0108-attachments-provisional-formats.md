# ADR-0108: Provisional attachment format allowlist

## Status

Accepted provisionally

The authoritative “Accepted file formats” reference was unavailable during
Attachments Phase 1. Until it is available, the allowlist accepts PNG, JPG,
JPEG, GIF, WebP, SVG, MP3, WAV, M4A, MP4, WebM, MOV, and PDF extensions.
The list is centralized in `@app/attachments` and is explicitly provisional;
Phase 2 or a later reference review must revise it rather than treating this
starter set as Obsidian-compatible parity.

Extension matching is case-insensitive and rejects unlisted executable and
archive formats. MIME sniffing and file-content validation belong to the later
I/O phase, not this pure data-model phase.

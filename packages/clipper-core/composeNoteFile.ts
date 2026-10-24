import type { ClipPayload } from "./ClipPayload.js";
import { renderFrontmatter } from "./frontmatter.js";

export type NoteFileInput = Pick<ClipPayload, "properties" | "tags" | "body">;

/**
 * The note as it will exist in the vault: frontmatter block, then body.
 *
 * Shared by both sides of the wire (ADR-0176): the extension composes the file it
 * downloads, the desktop composes the file it writes through the canonical vault
 * path. Keeping one definition means the file the user downloads and the note the
 * vault later receives are the same bytes, and a change to the shape cannot land
 * on one side only.
 */
export function composeNoteFile(payload: NoteFileInput): string {
  const frontmatter = renderFrontmatter(payload.properties, payload.tags);
  const body = payload.body.length > 0 ? `${payload.body}\n` : "";
  return `${frontmatter}${body}`;
}

/**
 * Vault-relative path for a clip: `folder/noteName`, or just `noteName` at the
 * vault root.
 *
 * As a download path Chrome creates the subfolders itself. The desktop derives
 * the same path from the same two fields (`resolve_clip_path` in
 * `clipper_name_rules.rs`), so this is the shape both sides agree on rather than
 * a download-only convenience.
 */
export function suggestedFilePath(payload: ClipPayload): string {
  const folder = payload.target.folder.trim();
  return folder.length > 0
    ? `${folder}/${payload.target.noteName}`
    : payload.target.noteName;
}

import { renderFrontmatter, type ClipPayload } from "@app/clipper-core";

export type NoteFileInput = Pick<ClipPayload, "properties" | "tags" | "body">;

/**
 * The note as it will exist in the vault: frontmatter block, then body.
 *
 * The desktop writes this same shape via the canonical note writer, so the file
 * the extension downloads and the note the vault later receives are identical.
 */
export function composeNoteFile(payload: NoteFileInput): string {
  const frontmatter = renderFrontmatter(payload.properties, payload.tags);
  const body = payload.body.length > 0 ? `${payload.body}\n` : "";
  return `${frontmatter}${body}`;
}

/** Vault-relative path as a download path (Chrome creates the subfolders). */
export function suggestedFilePath(payload: ClipPayload): string {
  const folder = payload.target.folder.trim();
  return folder.length > 0
    ? `${folder}/${payload.target.noteName}`
    : payload.target.noteName;
}

import type { ClipPayload } from "@app/clipper-core";

/**
 * What the user changed by hand before saving.
 *
 * Absent keys mean "leave what the template produced". Present-but-empty property
 * values mean "drop this property", because an empty frontmatter line is noise
 * rather than intent.
 */
export interface ClipEdits {
  noteName?: string;
  folder?: string;
  properties?: Readonly<Record<string, string>>;
}

/** The name a clip gets when the user empties the field entirely. */
export const FALLBACK_NOTE_NAME = "Untitled.md";

/**
 * Keep a typed note name to a single file name.
 *
 * This is defence in depth, not the security boundary: the desktop re-validates
 * every field of a clip as hostile input (ADR-0177). Doing it here as well means
 * the preview never shows a name that the desktop would have to reject, and the
 * browser's download step is never handed characters it refuses.
 */
export function sanitizeNoteName(raw: string): string {
  const base = raw
    .replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // A dot segment is a path step, not a word: "../../etc/passwd" must not come
    // back as a name containing "..".
    .split(" ")
    .filter(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    )
    .join(" ")
    // Characters no common filesystem, and no Chrome download, will accept
    // (`\p{Cc}` covers control characters a paste can carry in).
    .replace(/[<>:"|?*\p{Cc}]/gu, "")
    // A leading dot would make the note hidden.
    .replace(/^\.+/, "")
    .trim();

  if (base.length === 0) return FALLBACK_NOTE_NAME;
  return base.toLowerCase().endsWith(".md") ? base : `${base}.md`;
}

/** Keep a typed folder vault-relative: no drive letters, no `..` segments. */
export function sanitizeFolder(raw: string): string {
  return raw
    .split(/[\\/]+/)
    .map((segment) => segment.trim())
    .filter(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    )
    .join("/");
}

/**
 * Apply hand edits to a rendered clip.
 *
 * `contentHash` is left alone on purpose: it hashes the body, and the body is not
 * editable here (the desktop dedupe reads it — ADR-0178).
 */
export function applyClipEdits(
  payload: ClipPayload,
  edits: ClipEdits,
): ClipPayload {
  const properties: ClipPayload["properties"] = { ...payload.properties };

  for (const [name, value] of Object.entries(edits.properties ?? {})) {
    if (value.trim().length === 0) {
      delete properties[name];
    } else {
      properties[name] = value;
    }
  }

  return {
    ...payload,
    target: {
      ...payload.target,
      folder: sanitizeFolder(edits.folder ?? payload.target.folder),
      noteName: sanitizeNoteName(edits.noteName ?? payload.target.noteName),
    },
    properties,
  };
}

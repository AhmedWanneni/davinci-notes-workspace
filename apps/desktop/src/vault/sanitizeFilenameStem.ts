const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

/** Sanitize H1 text into a filename stem, or null if empty/invalid. */
export function sanitizeFilenameStem(text: string): string | null {
  const withoutInvalid = text.replace(INVALID_FILENAME_CHARS, " ").trim();
  const withoutTrailingDots = withoutInvalid.replace(/\.+$/g, "").trim();
  if (!withoutTrailingDots) {
    return null;
  }
  return withoutTrailingDots;
}

export function noteStemsEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Build a vault-relative `.md` path in the same folder as `currentPath`. */
export function buildNotePathInFolder(
  currentPath: string,
  stem: string,
): string {
  const parts = currentPath.split("/");
  parts[parts.length - 1] = `${stem}.md`;
  return parts.join("/");
}

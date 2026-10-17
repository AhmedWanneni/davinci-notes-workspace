import { parseFrontmatter } from "@app/indexer";

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

/**
 * Extracts the first H1 markdown heading (# Heading) from the note body,
 * ignoring YAML frontmatter.
 */
export function extractH1Title(content: string): string | null {
  const { content: body } = parseFrontmatter(content);
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^#\s+(.+?)\s*$/);
    if (match) {
      return match[1].trim();
    }
    // If first non-empty line after frontmatter is not an H1, do not look further
    break;
  }
  return null;
}

/**
 * Sanitizes an H1 string into a valid filesystem filename stem.
 * Replaces illegal characters (\ / : * ? " < > |) with space and trims.
 */
export function sanitizeFilenameStem(text: string): string | null {
  const withoutInvalid = text.replace(INVALID_FILENAME_CHARS, " ").trim();
  const withoutTrailingDots = withoutInvalid.replace(/\.+$/g, "").trim();
  if (!withoutTrailingDots) {
    return null;
  }
  return withoutTrailingDots;
}

/**
 * Case-insensitive comparison of note filename stems (ADR-0060 feedback loop guard).
 */
export function noteStemsEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Builds a new vault-relative note path with the given stem in the same folder.
 */
export function buildNotePathInFolder(
  currentPath: string,
  stem: string,
): string {
  const parts = currentPath.split("/");
  parts[parts.length - 1] = `${stem}.md`;
  return parts.join("/");
}

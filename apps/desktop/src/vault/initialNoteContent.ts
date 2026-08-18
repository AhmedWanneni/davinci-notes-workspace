/** Basename of a vault-relative `.md` path, without the extension. */
export function noteTitleFromPath(path: string): string {
  return path.replace(/\.md$/i, "").split(/[/\\]/).pop() ?? path;
}

/** Default body for a newly created markdown note: `# <title>\n\n`. */
export function initialNoteContent(path: string): string {
  return `# ${noteTitleFromPath(path)}\n\n`;
}

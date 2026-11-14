export type NoteEditorMode = "note" | "text";

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Reads whether a note is 'note' mode or 'text' mode from frontmatter properties.
 * Defaults to 'note'.
 */
export function getNoteMode(content: string): NoteEditorMode {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) return "note";

  const block = match[1];
  const typeMatch = /(?:^|\n)\s*(?:type|mode)\s*:\s*["']?(note|text)["']?/i.exec(block);
  if (typeMatch) {
    return typeMatch[1].toLowerCase() as NoteEditorMode;
  }
  return "note";
}

/**
 * Updates or sets the 'type: note' or 'type: text' property in the file's frontmatter.
 */
export function setNoteModeInContent(content: string, mode: NoteEditorMode): string {
  const match = content.match(FRONTMATTER_REGEX);
  if (match) {
    const fullFm = match[0];
    const innerFm = match[1];
    let updatedInner: string;
    if (/(?:^|\n)\s*(?:type|mode)\s*:/i.test(innerFm)) {
      updatedInner = innerFm.replace(
        /((?:^|\n)\s*(?:type|mode)\s*:\s*).*(\r?\n|$)/i,
        `$1${mode}$2`
      );
    } else {
      updatedInner = innerFm.trimEnd() + `\ntype: ${mode}\n`;
    }
    return `---\n${updatedInner.trim()}\n---\n` + content.slice(fullFm.length);
  }

  // No frontmatter yet: prepend frontmatter block with type property
  return `---\ntype: ${mode}\n---\n\n` + content;
}

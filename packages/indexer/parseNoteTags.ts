import type { Frontmatter, NoteTagSet } from "@app/core-types";
import { collectNoteTags, emptyNoteTagSet } from "@app/core-types";

function frontmatterTags(frontmatter: Frontmatter): readonly unknown[] {
  const value = frontmatter.tags;
  return Array.isArray(value) ? value : [];
}

/** Collect the canonical merged tag set for a note from frontmatter and body. */
export function parseNoteTags(
  frontmatter: Frontmatter,
  body: string,
): NoteTagSet {
  if (!frontmatterTags(frontmatter).length && body.length === 0) {
    return emptyNoteTagSet();
  }
  return collectNoteTags(frontmatter, body);
}

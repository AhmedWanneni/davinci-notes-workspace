import type { Frontmatter } from "./Frontmatter.js";
import { TagRegistry } from "./TagRegistry.js";
import { isValidTagBody, matchTags } from "./parseTag.js";
import type { Tag } from "./Tag.js";

/** Canonical merged tags for a note. */
export interface NoteTagSet {
  /** Unique tags from YAML `tags:` frontmatter entries. */
  frontmatter: readonly Tag[];
  /** Unique tags detected inline from `#tag` tokens in the body. */
  inline: readonly Tag[];
  /** Deduplicated union of frontmatter and inline tags in first-seen order. */
  all: readonly Tag[];
}

export function emptyNoteTagSet(): NoteTagSet {
  return { frontmatter: [], inline: [], all: [] };
}

function frontmatterTagValues(frontmatter: Frontmatter): readonly unknown[] {
  const raw = frontmatter.tags;
  return Array.isArray(raw) ? raw : [];
}

function addUnique(target: Tag[], tag: Tag): void {
  if (!target.some((entry) => entry.key === tag.key)) {
    target.push(tag);
  }
}

/**
 * Builds a merged tag set from YAML frontmatter and inline body tags.
 *
 * Frontmatter tags are expected without `#`; inline tags use the `#tag`
 * spelling from the body. The merged `all` array keeps first-seen order.
 */
export function collectNoteTags(
  frontmatter: Frontmatter,
  body: string,
): NoteTagSet {
  const registry = new TagRegistry();
  const frontmatterTags: Tag[] = [];
  const inlineTags: Tag[] = [];

  for (const value of frontmatterTagValues(frontmatter)) {
    if (typeof value !== "string" || !isValidTagBody(value)) continue;
    addUnique(frontmatterTags, registry.registerBody(value));
  }

  for (const match of matchTags(body)) {
    addUnique(inlineTags, registry.register(match.raw));
  }

  return {
    frontmatter: frontmatterTags,
    inline: inlineTags,
    all: registry.values(),
  };
}

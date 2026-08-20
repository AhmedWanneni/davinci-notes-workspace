export type { Frontmatter } from "./Frontmatter.js";
export type { Link } from "./Link.js";
export type { Note } from "./Note.js";
export {
  collectNoteTags,
  emptyNoteTagSet,
} from "./NoteTags.js";
export type { NoteTagSet } from "./NoteTags.js";
export type { Vault } from "./Vault.js";
export type { Tag, TagMatch } from "./Tag.js";
export { TagRegistry } from "./TagRegistry.js";
export {
  decomposeTag,
  isValidTag,
  isValidTagBody,
  matchTags,
  normalizeTag,
  normalizeTagBody,
} from "./parseTag.js";

/** Package identifier kept for shell smoke tests. */
export const name = "@app/core-types";

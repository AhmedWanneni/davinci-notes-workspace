import type { Frontmatter } from "./Frontmatter";
import type { Link } from "./Link";
import type { NoteTagSet } from "./NoteTags";

/** A markdown note loaded from the vault. */
export interface Note {
  /** Vault-relative path (e.g. `projects/alpha.md`). */
  path: string;
  /** Display title — filename stem or frontmatter `title` override. */
  title: string;
  frontmatter: Frontmatter;
  /** Raw markdown body (frontmatter excluded when parsed). */
  content: string;
  /** Outbound links parsed from `content`. */
  outlinks: Link[];
  /** Canonical merged tags from frontmatter and inline `#tag` tokens. */
  tags: NoteTagSet;
  /** Last modified time (Unix ms). */
  mtime: number;
}

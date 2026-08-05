import type { Frontmatter } from "./Frontmatter";
import type { Link } from "./Link";

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
  /** Tags from frontmatter and inline `#tag` tokens. */
  tags: string[];
  /** Last modified time (Unix ms). */
  mtime: number;
}

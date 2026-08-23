import type { Link } from "@app/core-types";

export const WIKILINK_PATTERN = /\[\[([^\]|]+?)(?:\|([^\]|]+?))?\]\]/g;
export const MARKDOWN_LINK_PATTERN = /(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g;

export interface ParseLinksOptions {
  /** Vault-relative paths of all notes (e.g. `daily/2026-08-01.md`). */
  notePaths: readonly string[];
  /** Path of the note being parsed — used for relative markdown link resolution. */
  sourcePath: string;
}

/** Strip fenced and inline code so links inside code are not parsed. */
export function maskCodeRegions(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, (block) => " ".repeat(block.length))
    .replace(/`[^`\n]+`/g, (span) => " ".repeat(span.length));
}

interface WikilinkParts {
  noteTarget: string;
  displayText?: string;
  heading?: string;
  blockId?: string;
}

/** Split `Note#Heading`, `Note#^block`, or `Note#^block|alias` target segment. */
export function parseWikilinkTarget(rawTarget: string): WikilinkParts {
  const hashIndex = rawTarget.indexOf("#");
  if (hashIndex === -1) {
    return { noteTarget: rawTarget.trim() };
  }

  const noteTarget = rawTarget.slice(0, hashIndex).trim();
  const fragment = rawTarget.slice(hashIndex + 1).trim();

  if (fragment.startsWith("^")) {
    return { noteTarget, blockId: fragment.slice(1).trim() };
  }

  return { noteTarget, heading: fragment };
}

/** Build a case-insensitive note-name → path index (first path wins on duplicates). */
export function buildNoteNameIndex(
  notePaths: readonly string[],
): Map<string, string> {
  const index = new Map<string, string>();
  const sorted = [...notePaths].sort();

  for (const path of sorted) {
    const stem = path.replace(/\.md$/i, "").split("/").pop() ?? path;
    const key = stem.toLowerCase();
    if (!index.has(key)) {
      index.set(key, path);
    }
  }

  return index;
}

export function findWikilinkCandidates(
  noteTarget: string,
  paths: readonly string[],
): string[] {
  const normalized = noteTarget.replace(/\\/g, "/").toLowerCase();
  const exact = paths.filter((path) => path.toLowerCase() === normalized);
  if (exact.length > 0) return [...exact].sort();

  const stem = normalized.replace(/\.md$/i, "").split("/").pop() ?? normalized;
  return paths
    .filter((path) => {
      const pathStem = path.replace(/\.md$/i, "").split("/").pop() ?? path;
      return pathStem.toLowerCase() === stem;
    })
    .sort();
}

function resolveWikilinkTarget(
  noteTarget: string,
  nameIndex: Map<string, string>,
): Pick<Link, "target" | "resolved"> {
  const resolvedPath = nameIndex.get(noteTarget.toLowerCase());
  if (resolvedPath) {
    return { target: resolvedPath, resolved: true };
  }
  return { target: noteTarget, resolved: false };
}

function resolveMarkdownHref(
  href: string,
  sourcePath: string,
  notePaths: readonly string[],
): Pick<Link, "target" | "resolved"> {
  const normalizedHref = href.split("#")[0]?.trim() ?? href;
  if (
    !normalizedHref ||
    normalizedHref.startsWith("http://") ||
    normalizedHref.startsWith("https://")
  ) {
    return { target: href, resolved: false };
  }

  const sourceDir = sourcePath.includes("/")
    ? sourcePath.slice(0, sourcePath.lastIndexOf("/"))
    : "";
  const joined = sourceDir ? `${sourceDir}/${normalizedHref}` : normalizedHref;
  const resolvedPath = normalizeVaultPath(joined);
  const noteSet = new Set(notePaths.map((p) => p.toLowerCase()));

  if (noteSet.has(resolvedPath.toLowerCase())) {
    return { target: resolvedPath, resolved: true };
  }

  return { target: resolvedPath, resolved: false };
}

/** Normalize `.` and `..` segments in a vault-relative path. */
export function normalizeVaultPath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }

  return stack.join("/");
}

/** Parse wikilinks and markdown links from note markdown content. */
export function parseLinks(
  content: string,
  options: ParseLinksOptions,
): Link[] {
  const parseable = maskCodeRegions(content);
  const nameIndex = buildNoteNameIndex(options.notePaths);
  const links: Link[] = [];

  for (const match of parseable.matchAll(WIKILINK_PATTERN)) {
    const rawInner = match[1] ?? "";
    const displayText = match[2]?.trim() || undefined;
    const parts = parseWikilinkTarget(rawInner);
    const resolution = resolveWikilinkTarget(parts.noteTarget, nameIndex);
    const start = match.index!;
    const end = start + match[0].length;

    links.push({
      ...resolution,
      targetRaw: parts.noteTarget,
      displayText,
      heading: parts.heading,
      blockId: parts.blockId,
      type: "wikilink",
      start,
      end,
    });
  }

  for (const match of parseable.matchAll(MARKDOWN_LINK_PATTERN)) {
    const displayText = match[1]?.trim() || undefined;
    const href = match[2]?.trim() ?? "";
    const resolution = resolveMarkdownHref(
      href,
      options.sourcePath,
      options.notePaths,
    );
    const start = match.index!;
    const end = start + match[0].length;

    links.push({
      ...resolution,
      targetRaw: href,
      displayText,
      type: "markdown",
      start,
      end,
    });
  }

  return links;
}

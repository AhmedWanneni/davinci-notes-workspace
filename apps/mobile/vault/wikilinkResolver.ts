import { parseWikilinkTarget } from "@app/indexer";

export interface ResolvedWikilink {
  targetRaw: string;
  targetStem: string;
  heading?: string;
  blockId?: string;
  displayText?: string;
  resolvedPath?: string;
  isResolved: boolean;
}

/**
 * Resolves a wikilink string (e.g., `[[Note]]`, `[[Folder/Note|Alias]]`, `[[Note#Section]]`)
 * against vault note paths per ADR-0020:
 * - Compared case-insensitively against note filename stems (basename without .md).
 * - Exact path matches win first.
 * - On stem collision across different folders, alphabetically first vault-relative path wins.
 */
export function resolveWikilink(
  rawTarget: string,
  allNotePaths: readonly string[],
  displayText?: string,
): ResolvedWikilink {
  const parsed = parseWikilinkTarget(rawTarget);
  const targetRaw = parsed.noteTarget;
  const heading = parsed.heading;
  const blockId = parsed.blockId;

  // Clean target stem
  const normalizedTarget = targetRaw.replace(/\.md$/i, "").toLowerCase();
  const targetBasename = normalizedTarget.includes("/")
    ? (normalizedTarget.split("/").pop() ?? normalizedTarget)
    : normalizedTarget;

  // 1. Direct path match check (if full or relative path was supplied)
  const exactPathMatch = allNotePaths.find(
    (p) => p.replace(/\.md$/i, "").toLowerCase() === normalizedTarget,
  );
  if (exactPathMatch) {
    return {
      targetRaw,
      targetStem: targetBasename,
      heading,
      blockId,
      displayText,
      resolvedPath: exactPathMatch,
      isResolved: true,
    };
  }

  // 2. Stem match check: find all matching notes by basename stem
  const matchingPaths = allNotePaths.filter((p) => {
    const noteStem = p.replace(/\.md$/i, "").split("/").pop()?.toLowerCase();
    return noteStem === targetBasename;
  });

  if (matchingPaths.length > 0) {
    // Sort alphabetically so first vault-relative path wins deterministically
    matchingPaths.sort((a, b) => a.localeCompare(b));
    return {
      targetRaw,
      targetStem: targetBasename,
      heading,
      blockId,
      displayText,
      resolvedPath: matchingPaths[0],
      isResolved: true,
    };
  }

  return {
    targetRaw,
    targetStem: targetBasename,
    heading,
    blockId,
    displayText,
    resolvedPath: undefined,
    isResolved: false,
  };
}

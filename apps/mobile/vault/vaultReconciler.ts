import type { VaultChangeBatch } from "./types";

export interface ReconcileStats {
  [path: string]: { size: number; mtime: number };
}

/**
 * Computes a lightweight difference between previous and current file stats.
 * Does not re-read file contents; compares solely mtime and file size.
 */
export function diffVaultStats(
  previous: ReconcileStats,
  current: ReconcileStats,
): VaultChangeBatch {
  const previousPaths = new Set(Object.keys(previous));
  const currentPaths = new Set(Object.keys(current));

  const candidateAdded: string[] = [];
  const candidateRemoved: string[] = [];
  const changed: string[] = [];

  // 1. Detect added and changed files
  for (const path of currentPaths) {
    const prev = previous[path];
    if (!prev) {
      candidateAdded.push(path);
    } else {
      const curr = current[path];
      if (curr.mtime !== prev.mtime || curr.size !== prev.size) {
        changed.push(path);
      }
    }
  }

  // 2. Detect removed files
  for (const path of previousPaths) {
    if (!currentPaths.has(path)) {
      candidateRemoved.push(path);
    }
  }

  // 3. Detect candidate renames: match identical size and mtime (within 1s tolerance)
  const renamed: Array<{ from: string; to: string }> = [];
  const finalAdded: string[] = [];
  const matchedRemovals = new Set<string>();

  for (const addedPath of candidateAdded) {
    const currStat = current[addedPath];
    let matchedFrom: string | null = null;

    for (const removedPath of candidateRemoved) {
      if (matchedRemovals.has(removedPath)) continue;

      const prevStat = previous[removedPath];
      const sameSize = prevStat.size === currStat.size;
      const sameTime = Math.abs(prevStat.mtime - currStat.mtime) <= 1000;

      if (sameSize && sameTime) {
        matchedFrom = removedPath;
        break;
      }
    }

    if (matchedFrom) {
      matchedRemovals.add(matchedFrom);
      renamed.push({ from: matchedFrom, to: addedPath });
    } else {
      finalAdded.push(addedPath);
    }
  }

  const finalRemoved = candidateRemoved.filter((p) => !matchedRemovals.has(p));

  return {
    added: finalAdded,
    changed,
    removed: finalRemoved,
    renamed,
  };
}

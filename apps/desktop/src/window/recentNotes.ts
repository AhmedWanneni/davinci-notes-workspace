export interface TrayRecentNote {
  path: string;
  title: string;
}

/**
 * Derives a deduplicated, most-recent list of notes (up to limit) from navigation history,
 * active note, and open tabs, filtered to existing vault notes.
 */
export function getRecentNotes(
  noteHistoryPaths: string[],
  openNotes: string[],
  activeNotePath: string | null,
  allNotePaths: string[],
  limit = 5,
): TrayRecentNote[] {
  const seen = new Set<string>();
  const recents: string[] = [];

  // 1. History in reverse chronological order
  for (let i = noteHistoryPaths.length - 1; i >= 0; i--) {
    const p = noteHistoryPaths[i];
    if (allNotePaths.includes(p) && !seen.has(p)) {
      seen.add(p);
      recents.push(p);
      if (recents.length >= limit) break;
    }
  }

  // 2. Active note if not yet in recents
  if (
    recents.length < limit &&
    activeNotePath &&
    allNotePaths.includes(activeNotePath) &&
    !seen.has(activeNotePath)
  ) {
    seen.add(activeNotePath);
    recents.push(activeNotePath);
  }

  // 3. Open tabs if room remains
  if (recents.length < limit) {
    for (const p of openNotes) {
      if (allNotePaths.includes(p) && !seen.has(p)) {
        seen.add(p);
        recents.push(p);
        if (recents.length >= limit) break;
      }
    }
  }

  return recents.map((path) => {
    const stem =
      path.replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") || path;
    return { path, title: stem };
  });
}

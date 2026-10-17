export type SortMode = "name-asc" | "name-desc";

export type RowItem =
  { type: "folder"; path: string } | { type: "note"; path: string };

export interface VisibleItemsResult {
  visibleFolders: string[];
  visibleNotes: string[];
  listData: RowItem[];
}

export function deriveVisibleItems(
  allFolders: readonly string[],
  allNotes: readonly string[],
  currentFolder: string,
  sortMode: SortMode,
  pinnedNotes: ReadonlySet<string>,
): VisibleItemsResult {
  const prefix = currentFolder ? `${currentFolder}/` : "";

  const folderSet = new Set<string>();
  for (const f of allFolders) {
    if (f.startsWith(prefix)) {
      const rest = f.substring(prefix.length);
      const segment = rest.split("/")[0];
      if (segment) folderSet.add(prefix ? `${prefix}${segment}` : segment);
    }
  }

  const noteList = allNotes.filter((n) => {
    if (prefix) {
      if (!n.startsWith(prefix)) return false;
      const rest = n.substring(prefix.length);
      return !rest.includes("/");
    }
    return !n.includes("/");
  });

  noteList.sort((a, b) => {
    const isPinnedA = pinnedNotes.has(a);
    const isPinnedB = pinnedNotes.has(b);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;

    const nameA = a.split("/").pop() ?? a;
    const nameB = b.split("/").pop() ?? b;
    return sortMode === "name-asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  const sortedFolders = Array.from(folderSet).sort();
  const listData: RowItem[] = sortedFolders.map((f) => ({
    type: "folder",
    path: f,
  }));
  for (const n of noteList) {
    listData.push({ type: "note", path: n });
  }

  return { visibleFolders: sortedFolders, visibleNotes: noteList, listData };
}

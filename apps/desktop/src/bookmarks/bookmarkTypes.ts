export interface BookmarkItem {
  path: string;
  addedAt: number;
  missing?: boolean;
}

export interface BookmarksData {
  version: 1;
  bookmarks: BookmarkItem[];
}

export type BookmarkSortOption = "recent" | "alpha" | "modified";

export const BOOKMARKS_JSON_PATH = ".davinci/bookmarks.json";
export const BOOKMARKS_TAB_ID = "davinci://bookmarks";

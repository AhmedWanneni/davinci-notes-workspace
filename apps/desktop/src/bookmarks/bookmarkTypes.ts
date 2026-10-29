import type { BookmarkOrganizationUpdate } from "./organizeBookmarksWithAI";

export interface BookmarkItem {
  path: string;
  addedAt: number;
  missing?: boolean;
}

export interface WebBookmarkItem {
  id: string;
  url: string;
  title: string;
  domain?: string;
  description?: string;
  folder?: string;
  tags?: string[];
  favicon?: string;
  addedAt: number;
}

export interface WebBookmarkInput {
  url: string;
  title?: string;
  domain?: string;
  description?: string;
  folder?: string;
  tags?: string[];
  favicon?: string;
  addedAt?: number;
}

export interface BookmarksData {
  version: 1;
  bookmarks: BookmarkItem[];
  links?: WebBookmarkItem[];
}

export type BookmarksPageTab = "notes" | "links";
export type BookmarkSortOption = "recent" | "alpha" | "modified";
export type WebBookmarkSortOption = "recent" | "alpha" | "domain";

export const BOOKMARKS_JSON_PATH = ".davinci/bookmarks.json";
export const BOOKMARKS_TAB_ID = "davinci://bookmarks";

export interface BookmarkState {
  bookmarks: BookmarkItem[];
  webBookmarks: WebBookmarkItem[];
  previousWebBookmarks: WebBookmarkItem[] | null;
  isLoaded: boolean;
  loadBookmarks: () => Promise<void>;
  toggleBookmark: (path: string) => Promise<void>;
  addBookmark: (path: string) => Promise<void>;
  removeBookmark: (path: string) => Promise<void>;
  addWebBookmark: (input: WebBookmarkInput) => WebBookmarkItem | null;
  updateWebBookmark: (
    id: string,
    patch: Partial<
      Pick<WebBookmarkItem, "title" | "url" | "folder" | "tags" | "description">
    >,
  ) => void;
  removeWebBookmark: (id: string) => void;
  importWebBookmarks: (incoming: readonly WebBookmarkItem[]) => {
    addedCount: number;
    totalCount: number;
  };
  applyWebBookmarksOrganization: (
    updates: readonly BookmarkOrganizationUpdate[],
  ) => void;
  undoLastOrganization: () => void;
  remapPath: (oldPath: string, newPath: string) => void;
  remapFolder: (oldPrefix: string, newPrefix: string) => void;
  markMissing: (path: string) => void;
  markFolderMissing: (prefix: string) => void;
  clearMissing: (path: string) => void;
  mergeExternalBookmarks: (
    incoming: BookmarkItem[],
    incomingLinks?: WebBookmarkItem[],
  ) => void;
  flushSave: () => Promise<void>;
  reset: () => void;
}

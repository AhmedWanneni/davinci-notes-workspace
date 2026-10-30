import { useEffect, useCallback } from "react";
import { useBookmarkStore } from "./bookmarkStore";
import type {
  BookmarkItem,
  WebBookmarkInput,
  WebBookmarkItem,
} from "./bookmarkTypes";
import type { BookmarkOrganizationUpdate } from "./organizeBookmarksWithAI";

export interface UseBookmarksResult {
  bookmarks: BookmarkItem[];
  webBookmarks: WebBookmarkItem[];
  canUndoOrganization: boolean;
  isLoaded: boolean;
  isBookmarked: (path: string | null | undefined) => boolean;
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
}

export function useBookmarks(): UseBookmarksResult {
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const webBookmarks = useBookmarkStore((state) => state.webBookmarks);
  const canUndoOrganization = useBookmarkStore(
    (state) => state.previousWebBookmarks !== null,
  );
  const isLoaded = useBookmarkStore((state) => state.isLoaded);
  const loadBookmarks = useBookmarkStore((state) => state.loadBookmarks);
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const addBookmark = useBookmarkStore((state) => state.addBookmark);
  const removeBookmark = useBookmarkStore((state) => state.removeBookmark);
  const addWebBookmark = useBookmarkStore((state) => state.addWebBookmark);
  const updateWebBookmark = useBookmarkStore(
    (state) => state.updateWebBookmark,
  );
  const removeWebBookmark = useBookmarkStore(
    (state) => state.removeWebBookmark,
  );
  const importWebBookmarks = useBookmarkStore(
    (state) => state.importWebBookmarks,
  );
  const applyWebBookmarksOrganization = useBookmarkStore(
    (state) => state.applyWebBookmarksOrganization,
  );
  const undoLastOrganization = useBookmarkStore(
    (state) => state.undoLastOrganization,
  );

  useEffect(() => {
    if (!isLoaded) {
      void loadBookmarks();
    }
  }, [isLoaded, loadBookmarks]);

  const isBookmarked = useCallback(
    (path: string | null | undefined): boolean => {
      if (!path) return false;
      return bookmarks.some((b) => b.path === path);
    },
    [bookmarks],
  );

  return {
    bookmarks,
    webBookmarks,
    canUndoOrganization,
    isLoaded,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    addWebBookmark,
    updateWebBookmark,
    removeWebBookmark,
    importWebBookmarks,
    applyWebBookmarksOrganization,
    undoLastOrganization,
  };
}

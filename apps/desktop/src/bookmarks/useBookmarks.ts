import { useEffect, useCallback } from "react";
import { useBookmarkStore } from "./bookmarkStore";
import type { BookmarkItem } from "./bookmarkTypes";

export interface UseBookmarksResult {
  bookmarks: BookmarkItem[];
  isLoaded: boolean;
  isBookmarked: (path: string | null | undefined) => boolean;
  toggleBookmark: (path: string) => Promise<void>;
  addBookmark: (path: string) => Promise<void>;
  removeBookmark: (path: string) => Promise<void>;
}

export function useBookmarks(): UseBookmarksResult {
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const isLoaded = useBookmarkStore((state) => state.isLoaded);
  const loadBookmarks = useBookmarkStore((state) => state.loadBookmarks);
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const addBookmark = useBookmarkStore((state) => state.addBookmark);
  const removeBookmark = useBookmarkStore((state) => state.removeBookmark);

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
    isLoaded,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
  };
}

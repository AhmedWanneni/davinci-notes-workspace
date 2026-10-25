import { create } from "zustand";
import type { BookmarkItem } from "./bookmarkTypes";
import {
  loadBookmarksFile,
  mergeBookmarkSets,
  saveBookmarksFile,
} from "./bookmarkStorage";

export interface BookmarkState {
  bookmarks: BookmarkItem[];
  isLoaded: boolean;
  loadBookmarks: () => Promise<void>;
  toggleBookmark: (path: string) => Promise<void>;
  addBookmark: (path: string) => Promise<void>;
  removeBookmark: (path: string) => Promise<void>;
  remapPath: (oldPath: string, newPath: string) => void;
  remapFolder: (oldPrefix: string, newPrefix: string) => void;
  markMissing: (path: string) => void;
  markFolderMissing: (prefix: string) => void;
  clearMissing: (path: string) => void;
  mergeExternalBookmarks: (incoming: BookmarkItem[]) => void;
  flushSave: () => Promise<void>;
  reset: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleDiskSave(getItems: () => BookmarkItem[]): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    void saveBookmarksFile({ version: 1, bookmarks: getItems() }).catch(
      (err) => {
        console.warn("[bookmarks] Failed to save bookmarks:", err);
      },
    );
  }, 350);
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  isLoaded: false,

  loadBookmarks: async () => {
    try {
      const data = await loadBookmarksFile();
      set({ bookmarks: data.bookmarks, isLoaded: true });
    } catch {
      set({ bookmarks: [], isLoaded: true });
    }
  },

  toggleBookmark: async (path: string) => {
    const { bookmarks, addBookmark, removeBookmark } = get();
    const exists = bookmarks.some((b) => b.path === path);
    if (exists) {
      await removeBookmark(path);
    } else {
      await addBookmark(path);
    }
  },

  addBookmark: async (path: string) => {
    const cleanPath = path.trim();
    if (!cleanPath) return;

    set((state) => {
      const existing = state.bookmarks.find((b) => b.path === cleanPath);
      if (existing) {
        // If it was marked missing, clear missing
        if (existing.missing) {
          const next = state.bookmarks.map((b) =>
            b.path === cleanPath ? { ...b, missing: undefined } : b,
          );
          return { bookmarks: next };
        }
        return state;
      }
      return {
        bookmarks: [
          ...state.bookmarks,
          { path: cleanPath, addedAt: Date.now() },
        ],
      };
    });

    scheduleDiskSave(() => get().bookmarks);
  },

  removeBookmark: async (path: string) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.path !== path),
    }));
    scheduleDiskSave(() => get().bookmarks);
  },

  remapPath: (oldPath: string, newPath: string) => {
    if (oldPath === newPath) return;
    set((state) => {
      const idx = state.bookmarks.findIndex((b) => b.path === oldPath);
      if (idx === -1) return state;

      const next = state.bookmarks.map((b) =>
        b.path === oldPath ? { ...b, path: newPath, missing: undefined } : b,
      );
      return { bookmarks: next };
    });
    scheduleDiskSave(() => get().bookmarks);
  },

  remapFolder: (oldPrefix: string, newPrefix: string) => {
    if (oldPrefix === newPrefix) return;
    const prefixSlash = oldPrefix.endsWith("/") ? oldPrefix : `${oldPrefix}/`;
    const newPrefixSlash = newPrefix.endsWith("/")
      ? newPrefix
      : `${newPrefix}/`;

    set((state) => {
      let changed = false;
      const next = state.bookmarks.map((b) => {
        if (b.path.startsWith(prefixSlash)) {
          changed = true;
          return {
            ...b,
            path: `${newPrefixSlash}${b.path.slice(prefixSlash.length)}`,
            missing: undefined,
          };
        }
        return b;
      });
      return changed ? { bookmarks: next } : state;
    });
    scheduleDiskSave(() => get().bookmarks);
  },

  markMissing: (path: string) => {
    set((state) => {
      const idx = state.bookmarks.findIndex((b) => b.path === path);
      if (idx === -1) return state;

      const next = state.bookmarks.map((b) =>
        b.path === path ? { ...b, missing: true } : b,
      );
      return { bookmarks: next };
    });
    scheduleDiskSave(() => get().bookmarks);
  },

  markFolderMissing: (prefix: string) => {
    const prefixSlash = prefix.endsWith("/") ? prefix : `${prefix}/`;
    set((state) => {
      let changed = false;
      const next = state.bookmarks.map((b) => {
        if (b.path.startsWith(prefixSlash)) {
          changed = true;
          return { ...b, missing: true };
        }
        return b;
      });
      return changed ? { bookmarks: next } : state;
    });
    scheduleDiskSave(() => get().bookmarks);
  },

  clearMissing: (path: string) => {
    set((state) => {
      const idx = state.bookmarks.findIndex((b) => b.path === path);
      if (idx === -1 || !state.bookmarks[idx].missing) return state;

      const next = state.bookmarks.map((b) =>
        b.path === path ? { ...b, missing: undefined } : b,
      );
      return { bookmarks: next };
    });
    scheduleDiskSave(() => get().bookmarks);
  },

  mergeExternalBookmarks: (incoming: BookmarkItem[]) => {
    set((state) => ({
      bookmarks: mergeBookmarkSets(state.bookmarks, incoming),
    }));
  },

  flushSave: async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    const current = get().bookmarks;
    await saveBookmarksFile({ version: 1, bookmarks: current });
  },

  reset: () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    set({ bookmarks: [], isLoaded: false });
  },
}));

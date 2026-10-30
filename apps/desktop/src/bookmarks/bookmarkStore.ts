import { create } from "zustand";
import type {
  BookmarkState,
  WebBookmarkInput,
  WebBookmarkItem,
} from "./bookmarkTypes";
import {
  loadBookmarksFile,
  mergeBookmarkSets,
  mergeWebBookmarkSets,
  saveBookmarksFile,
} from "./bookmarkStorage";
import {
  applyOrganizationUpdatesToList,
  buildWebBookmarkItem,
  patchWebBookmarkList,
} from "./webBookmarkActions";

export type { BookmarkState };

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleDiskSave(
  getState: () => Pick<BookmarkState, "bookmarks" | "webBookmarks">,
): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    const { bookmarks, webBookmarks } = getState();
    void saveBookmarksFile({
      version: 1,
      bookmarks,
      ...(webBookmarks.length > 0 ? { links: webBookmarks } : {}),
    }).catch((err) => console.warn("[bookmarks] Failed to save:", err));
  }, 350);
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  webBookmarks: [],
  previousWebBookmarks: null,
  isLoaded: false,

  loadBookmarks: async () => {
    try {
      const data = await loadBookmarksFile();
      set({
        bookmarks: data.bookmarks,
        webBookmarks: data.links ?? [],
        isLoaded: true,
      });
    } catch {
      set({ bookmarks: [], webBookmarks: [], isLoaded: true });
    }
  },

  toggleBookmark: async (path: string) => {
    const { bookmarks, addBookmark, removeBookmark } = get();
    await (bookmarks.some((b) => b.path === path)
      ? removeBookmark(path)
      : addBookmark(path));
  },

  addBookmark: async (path: string) => {
    const cleanPath = path.trim();
    if (!cleanPath) return;
    set((s) => {
      const existing = s.bookmarks.find((b) => b.path === cleanPath);
      if (existing) {
        return existing.missing
          ? {
              bookmarks: s.bookmarks.map((b) =>
                b.path === cleanPath ? { ...b, missing: undefined } : b,
              ),
            }
          : s;
      }
      return {
        bookmarks: [...s.bookmarks, { path: cleanPath, addedAt: Date.now() }],
      };
    });
    scheduleDiskSave(get);
  },

  removeBookmark: async (path: string) => {
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.path !== path) }));
    scheduleDiskSave(get);
  },

  addWebBookmark: (input: WebBookmarkInput) => {
    const created = buildWebBookmarkItem(input);
    if (!created) return null;
    set((s) => ({ webBookmarks: mergeWebBookmarkSets(s.webBookmarks, [created]) }));
    scheduleDiskSave(get);
    return created;
  },

  updateWebBookmark: (id, patch) => {
    set((s) => ({ webBookmarks: patchWebBookmarkList(s.webBookmarks, id, patch) }));
    scheduleDiskSave(get);
  },

  removeWebBookmark: (id: string) => {
    set((s) => ({ webBookmarks: s.webBookmarks.filter((w) => w.id !== id) }));
    scheduleDiskSave(get);
  },

  importWebBookmarks: (incoming: readonly WebBookmarkItem[]) => {
    const beforeCount = get().webBookmarks.length;
    const merged = mergeWebBookmarkSets(get().webBookmarks, incoming);
    set({ webBookmarks: merged });
    scheduleDiskSave(get);
    return {
      addedCount: Math.max(0, merged.length - beforeCount),
      totalCount: merged.length,
    };
  },

  applyWebBookmarksOrganization: (updates) => {
    set((s) => ({
      previousWebBookmarks: s.webBookmarks,
      webBookmarks: applyOrganizationUpdatesToList(s.webBookmarks, updates),
    }));
    scheduleDiskSave(get);
  },

  undoLastOrganization: () => {
    const prev = get().previousWebBookmarks;
    if (!prev) return;
    set({ webBookmarks: prev, previousWebBookmarks: null });
    scheduleDiskSave(get);
  },

  remapPath: (oldPath: string, newPath: string) => {
    if (oldPath === newPath) return;
    set((s) =>
      s.bookmarks.some((b) => b.path === oldPath)
        ? {
            bookmarks: s.bookmarks.map((b) =>
              b.path === oldPath ? { ...b, path: newPath, missing: undefined } : b,
            ),
          }
        : s,
    );
    scheduleDiskSave(get);
  },

  remapFolder: (oldPrefix: string, newPrefix: string) => {
    if (oldPrefix === newPrefix) return;
    const pOld = oldPrefix.endsWith("/") ? oldPrefix : `${oldPrefix}/`;
    const pNew = newPrefix.endsWith("/") ? newPrefix : `${newPrefix}/`;
    set((s) => {
      let changed = false;
      const next = s.bookmarks.map((b) => {
        if (!b.path.startsWith(pOld)) return b;
        changed = true;
        return { ...b, path: `${pNew}${b.path.slice(pOld.length)}`, missing: undefined };
      });
      return changed ? { bookmarks: next } : s;
    });
    scheduleDiskSave(get);
  },

  markMissing: (path: string) => {
    set((s) =>
      s.bookmarks.some((b) => b.path === path)
        ? {
            bookmarks: s.bookmarks.map((b) =>
              b.path === path ? { ...b, missing: true } : b,
            ),
          }
        : s,
    );
    scheduleDiskSave(get);
  },

  markFolderMissing: (prefix: string) => {
    const pOld = prefix.endsWith("/") ? prefix : `${prefix}/`;
    set((s) => {
      let changed = false;
      const next = s.bookmarks.map((b) => {
        if (!b.path.startsWith(pOld)) return b;
        changed = true;
        return { ...b, missing: true };
      });
      return changed ? { bookmarks: next } : s;
    });
    scheduleDiskSave(get);
  },

  clearMissing: (path: string) => {
    set((s) => {
      const target = s.bookmarks.find((b) => b.path === path);
      if (!target || !target.missing) return s;
      return {
        bookmarks: s.bookmarks.map((b) =>
          b.path === path ? { ...b, missing: undefined } : b,
        ),
      };
    });
    scheduleDiskSave(get);
  },

  mergeExternalBookmarks: (incoming, incomingLinks) => {
    set((s) => ({
      bookmarks: mergeBookmarkSets(s.bookmarks, incoming),
      ...(incomingLinks
        ? { webBookmarks: mergeWebBookmarkSets(s.webBookmarks, incomingLinks) }
        : {}),
    }));
  },

  flushSave: async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    const { bookmarks, webBookmarks } = get();
    await saveBookmarksFile({
      version: 1,
      bookmarks,
      ...(webBookmarks.length > 0 ? { links: webBookmarks } : {}),
    });
  },

  reset: () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    set({ bookmarks: [], webBookmarks: [], previousWebBookmarks: null, isLoaded: false });
  },
}));

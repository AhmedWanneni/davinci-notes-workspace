import { useMemo } from "react";
import { useBookmarkStore } from "../../bookmarks/bookmarkStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { WebBookmarkItem } from "../../bookmarks/bookmarkTypes";
import { convertNotesToWebBookmarkItems } from "./noteBookmarkFilters";

/** Bookmarked notes adapted to the shared web-bookmark item shape. */
export function useNoteBookmarkItems(): WebBookmarkItem[] {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const notesContent = useWorkspaceStore((s) => s.notesContent);
  const allNotePaths = useWorkspaceStore((s) => s.allNotePaths);
  const tagIndex = useWorkspaceStore((s) => s.tagIndex);
  const noteTags = tagIndex?.noteToTags ?? null;

  return useMemo(
    () =>
      convertNotesToWebBookmarkItems(bookmarks, {
        notesContent,
        noteTags,
        allNotePaths,
      }),
    [bookmarks, notesContent, noteTags, allNotePaths],
  );
}

import { useState, useMemo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BookmarkSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { useBookmarks } from "../../bookmarks/useBookmarks";
import type {
  BookmarkSortOption,
} from "../../bookmarks/bookmarkTypes";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { loadTreeIcons } from "../../icons/treeIconStorage";
import { BookmarksHeader } from "./BookmarksHeader";
import { BookmarkRow } from "./BookmarkRow";
import { useBookmarkKeyboardNav } from "./useBookmarkKeyboardNav";
import styles from "./BookmarksView.module.scss";

export interface BookmarksViewProps {
  onOpenNote: (path: string, newTab: boolean) => void;
}

function extractPreview(content: string | undefined): string | undefined {
  if (!content) return undefined;
  const lines = content.split("\n");
  const cleanLines: string[] = [];
  let inFrontmatter = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter || !trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    cleanLines.push(trimmed);
    if (cleanLines.length >= 2) break;
  }

  return cleanLines.length > 0 ? cleanLines.join(" ") : undefined;
}

export function BookmarksView({ onOpenNote }: BookmarksViewProps) {
  const { bookmarks, removeBookmark } = useBookmarks();
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const notesContent = useWorkspaceStore((state) => state.notesContent);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<BookmarkSortOption>("recent");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [icons, setIcons] = useState<Record<string, string>>({});

  const listContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadTreeIcons().then(setIcons);
  }, []);

  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = bookmarks.filter((b) => {
      if (!query) return true;
      const title = b.path.replace(/\.(md|canvas)$/i, "").toLowerCase();
      return title.includes(query) || b.path.toLowerCase().includes(query);
    });

    return list.sort((a, b) => {
      if (sortOption === "alpha") {
        const titleA = a.path.split("/").pop() ?? a.path;
        const titleB = b.path.split("/").pop() ?? b.path;
        return titleA.localeCompare(titleB);
      }
      return b.addedAt - a.addedAt;
    });
  }, [bookmarks, searchQuery, sortOption]);

  useBookmarkKeyboardNav({
    items: filteredAndSorted,
    selectedIndex,
    setSelectedIndex,
    onOpen: onOpenNote,
    onRemove: removeBookmark,
    searchInputRef,
  });

  const shouldVirtualize = filteredAndSorted.length > 200;
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredAndSorted.length : 0,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  return (
    <div className={styles["bookmarks-view"]}>
      <BookmarksHeader
        count={bookmarks.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      <div
        ref={listContainerRef}
        className={styles["bookmarks-view__list-container"]}
      >
        {bookmarks.length === 0 ? (
          <div className={styles["bookmarks-view__empty-state"]}>
            <div className={styles["bookmarks-view__empty-icon"]}>
              <BookmarkSimple size={24} weight="regular" />
            </div>
            <h2 className={styles["bookmarks-view__empty-title"]}>
              No bookmarks yet
            </h2>
            <p className={styles["bookmarks-view__empty-desc"]}>
              Bookmark important notes from the note header, file tree context
              menu, or press Mod+D to quickly access them here.
            </p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className={styles["bookmarks-view__empty-state"]}>
            <div className={styles["bookmarks-view__empty-icon"]}>
              <MagnifyingGlass size={24} weight="regular" />
            </div>
            <h2 className={styles["bookmarks-view__empty-title"]}>
              No matching bookmarks
            </h2>
            <p className={styles["bookmarks-view__empty-desc"]}>
              No bookmarked notes match &quot;{searchQuery}&quot;.
            </p>
          </div>
        ) : shouldVirtualize ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredAndSorted[virtualRow.index];
              const isMissing =
                item.missing === true || !allNotePaths.includes(item.path);
              const preview = extractPreview(notesContent[item.path]);
              return (
                <div
                  key={item.path}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <BookmarkRow
                    item={item}
                    icon={icons[item.path]}
                    preview={preview}
                    isSelected={virtualRow.index === selectedIndex}
                    isMissing={isMissing}
                    onOpen={onOpenNote}
                    onRemove={removeBookmark}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <ul className={styles["bookmarks-view__list"]} role="listbox">
            {filteredAndSorted.map((item, index) => {
              const isMissing =
                item.missing === true || !allNotePaths.includes(item.path);
              const preview = extractPreview(notesContent[item.path]);
              return (
                <BookmarkRow
                  key={item.path}
                  item={item}
                  icon={icons[item.path]}
                  preview={preview}
                  isSelected={index === selectedIndex}
                  isMissing={isMissing}
                  onOpen={onOpenNote}
                  onRemove={removeBookmark}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

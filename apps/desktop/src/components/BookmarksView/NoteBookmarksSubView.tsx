import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BookmarkSimple, MagnifyingGlass } from "@phosphor-icons/react";
import type { BookmarkItem } from "../../bookmarks/bookmarkTypes";
import { BookmarkRow } from "./BookmarkRow";
import styles from "./BookmarksView.module.scss";

export interface NoteBookmarksSubViewProps {
  bookmarks: readonly BookmarkItem[];
  filteredAndSorted: readonly BookmarkItem[];
  searchQuery: string;
  selectedIndex: number;
  icons: Record<string, string>;
  allNotePaths: readonly string[];
  notesContent: Record<string, string>;
  onOpenNote: (path: string, newTab: boolean) => void;
  onRemoveBookmark: (path: string) => void;
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
    if (inFrontmatter || !trimmed || trimmed.startsWith("#")) continue;
    cleanLines.push(trimmed);
    if (cleanLines.length >= 2) break;
  }

  return cleanLines.length > 0 ? cleanLines.join(" ") : undefined;
}

export function NoteBookmarksSubView({
  bookmarks,
  filteredAndSorted,
  searchQuery,
  selectedIndex,
  icons,
  allNotePaths,
  notesContent,
  onOpenNote,
  onRemoveBookmark,
}: NoteBookmarksSubViewProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = filteredAndSorted.length > 200;
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredAndSorted.length : 0,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  return (
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
                  preview={extractPreview(notesContent[item.path])}
                  isSelected={virtualRow.index === selectedIndex}
                  isMissing={isMissing}
                  onOpen={onOpenNote}
                  onRemove={onRemoveBookmark}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <ul className={styles["bookmarks-view__list"]} role="listbox">
          {filteredAndSorted.map((item, index) => (
            <BookmarkRow
              key={item.path}
              item={item}
              icon={icons[item.path]}
              preview={extractPreview(notesContent[item.path])}
              isSelected={index === selectedIndex}
              isMissing={
                item.missing === true || !allNotePaths.includes(item.path)
              }
              onOpen={onOpenNote}
              onRemove={onRemoveBookmark}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

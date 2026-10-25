import React from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { BookmarkSortOption } from "../../bookmarks/bookmarkTypes";
import styles from "./BookmarksView.module.scss";

export interface BookmarksHeaderProps {
  count: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  sortOption: BookmarkSortOption;
  onSortChange: (option: BookmarkSortOption) => void;
}

export function BookmarksHeader({
  count,
  searchQuery,
  onSearchChange,
  searchInputRef,
  sortOption,
  onSortChange,
}: BookmarksHeaderProps) {
  return (
    <header className={styles["bookmarks-view__header"]}>
      <div className={styles["bookmarks-view__header-top"]}>
        <div className={styles["bookmarks-view__title-group"]}>
          <h1 className={styles["bookmarks-view__heading"]}>
            Bookmarks
            <span
              className={styles["bookmarks-view__badge"]}
              aria-label={`${count} bookmarks`}
            >
              {count}
            </span>
          </h1>
        </div>

        <div className={styles["bookmarks-view__controls"]}>
          <div className={styles["bookmarks-view__search-wrapper"]}>
            <MagnifyingGlass
              size={14}
              className={styles["bookmarks-view__search-icon"]}
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="text"
              className={styles["bookmarks-view__search-input"]}
              placeholder="Filter bookmarks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Filter bookmarks"
            />
            {!searchQuery && (
              <kbd className={styles["bookmarks-view__search-kbd"]} aria-hidden="true">
                /
              </kbd>
            )}
          </div>

          <select
            className={styles["bookmarks-view__sort-select"]}
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as BookmarkSortOption)}
            aria-label="Sort bookmarks"
          >
            <option value="recent">Recently added</option>
            <option value="alpha">Name A-Z</option>
            <option value="modified">Last modified</option>
          </select>
        </div>
      </div>
    </header>
  );
}

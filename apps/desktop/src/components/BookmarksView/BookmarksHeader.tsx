import React from "react";
import {
  MagnifyingGlass,
  Plus,
  UploadSimple,
  Sparkle,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import type {
  BookmarksPageTab,
  BookmarkSortOption,
  WebBookmarkSortOption,
} from "../../bookmarks/bookmarkTypes";
import styles from "./BookmarksView.module.scss";
import webStyles from "./WebBookmarks.module.scss";

export interface BookmarksHeaderProps {
  activePage: BookmarksPageTab;
  onPageChange: (page: BookmarksPageTab) => void;
  noteCount: number;
  linkCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  sortOption: BookmarkSortOption;
  onSortChange: (option: BookmarkSortOption) => void;
  webSortOption?: WebBookmarkSortOption;
  onWebSortChange?: (option: WebBookmarkSortOption) => void;
  isOrganizingAI?: boolean;
  canUndoOrganization?: boolean;
  onOpenAddLink?: () => void;
  onOpenImportModal?: () => void;
  onOrganizeWithAI?: () => void;
  onUndoOrganization?: () => void;
}

export function BookmarksHeader({
  activePage,
  onPageChange,
  noteCount,
  linkCount,
  searchQuery,
  onSearchChange,
  searchInputRef,
  sortOption,
  onSortChange,
  webSortOption = "recent",
  onWebSortChange,
  isOrganizingAI = false,
  canUndoOrganization = false,
  onOpenAddLink,
  onOpenImportModal,
  onOrganizeWithAI,
  onUndoOrganization,
}: BookmarksHeaderProps) {
  return (
    <header className={styles["bookmarks-view__header"]}>
      <div className={styles["bookmarks-view__header-top"]}>
        <div className={styles["bookmarks-view__title-group"]}>
          <h1 className={styles["bookmarks-view__heading"]}>Bookmarks</h1>
          <div
            className={webStyles["page-tabs"]}
            role="tablist"
            aria-label="Bookmark pages"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activePage === "notes"}
              className={`${webStyles["page-tab"]} ${activePage === "notes" ? webStyles["is-active"] : ""}`}
              onClick={() => onPageChange("notes")}
            >
              Notes
              <span
                className={styles["bookmarks-view__badge"]}
                aria-label={`${noteCount} bookmarks`}
              >
                {noteCount}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePage === "links"}
              className={`${webStyles["page-tab"]} ${activePage === "links" ? webStyles["is-active"] : ""}`}
              onClick={() => onPageChange("links")}
            >
              Web Links
              <span
                className={styles["bookmarks-view__badge"]}
                aria-label={`${linkCount} web links`}
              >
                {linkCount}
              </span>
            </button>
          </div>
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
              placeholder={
                activePage === "notes"
                  ? "Filter bookmarks..."
                  : "Search links, domains, folders, #tags..."
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={
                activePage === "notes"
                  ? "Filter bookmarks"
                  : "Search web bookmarks"
              }
            />
            {!searchQuery && (
              <kbd
                className={styles["bookmarks-view__search-kbd"]}
                aria-hidden="true"
              >
                /
              </kbd>
            )}
          </div>

          {activePage === "notes" ? (
            <select
              className={styles["bookmarks-view__sort-select"]}
              value={sortOption}
              onChange={(e) =>
                onSortChange(e.target.value as BookmarkSortOption)
              }
              aria-label="Sort bookmarks"
            >
              <option value="recent">Recently added</option>
              <option value="alpha">Name A-Z</option>
              <option value="modified">Last modified</option>
            </select>
          ) : (
            <>
              <select
                className={styles["bookmarks-view__sort-select"]}
                value={webSortOption}
                onChange={(e) =>
                  onWebSortChange?.(e.target.value as WebBookmarkSortOption)
                }
                aria-label="Sort web bookmarks"
              >
                <option value="recent">Recently added</option>
                <option value="alpha">Title A-Z</option>
                <option value="domain">Domain A-Z</option>
              </select>
              <button
                type="button"
                className={webStyles["action-btn"]}
                onClick={onOpenAddLink}
              >
                <Plus size={14} />
                Add Link
              </button>
              <button
                type="button"
                className={webStyles["action-btn"]}
                onClick={onOpenImportModal}
              >
                <UploadSimple size={14} />
                Import
              </button>
              <button
                type="button"
                className={`${webStyles["action-btn"]} ${webStyles["is-primary"]}`}
                disabled={linkCount === 0 || isOrganizingAI}
                onClick={onOrganizeWithAI}
              >
                <Sparkle size={14} />
                {isOrganizingAI ? "Organizing..." : "Organize with AI"}
              </button>
              {canUndoOrganization && (
                <button
                  type="button"
                  className={webStyles["action-btn"]}
                  onClick={onUndoOrganization}
                  title="Undo last AI organization"
                >
                  <ArrowCounterClockwise size={14} />
                  Undo
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

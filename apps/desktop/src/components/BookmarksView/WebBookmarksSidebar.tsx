import React, { useState } from "react";
import {
  Cloud,
  Tray,
  Trash,
  FolderSimple,
  Plus,
  CaretDown,
} from "@phosphor-icons/react";
import type { BookmarkCounts, SidebarSection } from "./webBookmarkFilters";
import { WebBookmarksSidebarFilters } from "./WebBookmarksSidebarFilters";
import styles from "./WebBookmarksSidebar.module.scss";

export interface WebBookmarksSidebarProps {
  counts: BookmarkCounts;
  activeSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
  onAddCollection: () => void;
  pageTab?: "links" | "notes";
  onPageTabChange?: (tab: "links" | "notes") => void;
  noteCount?: number;
  inAppSidebar?: boolean;
}

export function WebBookmarksSidebar({
  counts,
  activeSection,
  onSelectSection,
  onAddCollection,
  pageTab = "links",
  onPageTabChange,
  noteCount = 0,
  inAppSidebar = false,
}: WebBookmarksSidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isSectionActive = (s: SidebarSection): boolean => {
    if (s.type === "all") return activeSection.type === "all";
    if (s.type === "unsorted") return activeSection.type === "unsorted";
    if (s.type === "trash") return activeSection.type === "trash";
    if (s.type === "collection" && activeSection.type === "collection") {
      return activeSection.folder === s.folder;
    }
    if (s.type === "filter" && activeSection.type === "filter") {
      return activeSection.filter === s.filter;
    }
    return false;
  };

  return (
    <aside
      className={`${styles["wb-sidebar"]} ${
        inAppSidebar ? styles["wb-sidebar--in-app-sidebar"] : ""
      }`}
      aria-label="Collections and Filters"
    >
      <div className={styles["wb-sidebar__header"]}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={styles["wb-sidebar__dropdown-btn"]}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <span>{pageTab === "links" ? "Web links" : "Notes"}</span>
            <CaretDown size={12} weight="bold" />
          </button>
          {dropdownOpen && onPageTabChange && (
            <div className={styles["wb-sidebar__dropdown-menu"]}>
              <button
                type="button"
                className={`${styles["wb-sidebar__dropdown-item"]} ${
                  pageTab === "links" ? styles["is-selected"] : ""
                }`}
                onClick={() => {
                  onPageTabChange("links");
                  setDropdownOpen(false);
                }}
              >
                Web links ({counts.all})
              </button>
              <button
                type="button"
                className={`${styles["wb-sidebar__dropdown-item"]} ${
                  pageTab === "notes" ? styles["is-selected"] : ""
                }`}
                onClick={() => {
                  onPageTabChange("notes");
                  setDropdownOpen(false);
                }}
              >
                Notes ({noteCount})
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className={styles["wb-sidebar__add-btn"]}
          onClick={onAddCollection}
          aria-label="New collection"
          title="Create collection"
        >
          <Plus size={16} weight="bold" />
        </button>
      </div>

      <div className={styles["wb-sidebar__nav"]}>
        <button
          type="button"
          className={`${styles["wb-sidebar__item"]} ${
            isSectionActive({ type: "all" }) ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectSection({ type: "all" })}
          aria-label={`All (${counts.all})`}
        >
          <span className={styles["wb-sidebar__item-left"]}>
            <Cloud size={16} weight="regular" />
            <span className={styles["wb-sidebar__item-label"]}>
              All bookmarks
            </span>
          </span>
          <span className={styles["wb-sidebar__item-count"]}>{counts.all}</span>
        </button>

        <button
          type="button"
          className={`${styles["wb-sidebar__item"]} ${
            isSectionActive({ type: "unsorted" }) ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectSection({ type: "unsorted" })}
        >
          <span className={styles["wb-sidebar__item-left"]}>
            <Tray size={16} weight="regular" />
            <span className={styles["wb-sidebar__item-label"]}>Unsorted</span>
          </span>
          <span className={styles["wb-sidebar__item-count"]}>
            {counts.unsorted}
          </span>
        </button>

        <button
          type="button"
          className={`${styles["wb-sidebar__item"]} ${
            isSectionActive({ type: "trash" }) ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectSection({ type: "trash" })}
        >
          <span className={styles["wb-sidebar__item-left"]}>
            <Trash size={16} weight="regular" />
            <span className={styles["wb-sidebar__item-label"]}>Trash</span>
          </span>
          <span className={styles["wb-sidebar__item-count"]}>
            {counts.trash}
          </span>
        </button>

        {counts.collections.length > 0 && (
          <div className={styles["wb-sidebar__group"]}>
            <div className={styles["wb-sidebar__group-title"]}>Collections</div>
            {counts.collections.map(([folder, count]) => (
              <button
                key={folder}
                type="button"
                className={`${styles["wb-sidebar__item"]} ${
                  isSectionActive({ type: "collection", folder })
                    ? styles["is-active"]
                    : ""
                }`}
                onClick={() => onSelectSection({ type: "collection", folder })}
                aria-label={`${folder} (${count})`}
              >
                <span className={styles["wb-sidebar__item-left"]}>
                  <FolderSimple size={16} weight="regular" />
                  <span
                    className={styles["wb-sidebar__item-label"]}
                    title={folder}
                  >
                    {folder}
                  </span>
                </span>
                <span className={styles["wb-sidebar__item-count"]}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}

        {pageTab === "links" && (
          <WebBookmarksSidebarFilters
            counts={counts}
            isSectionActive={isSectionActive}
            onSelectSection={onSelectSection}
          />
        )}
      </div>
    </aside>
  );
}

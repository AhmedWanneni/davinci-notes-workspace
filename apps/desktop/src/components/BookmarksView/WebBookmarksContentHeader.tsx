import React, { useState, useRef, useEffect } from "react";
import {
  Cloud,
  Tray,
  Trash,
  FolderSimple,
  Clock,
  List,
  GridFour,
  Rows,
  Kanban,
  DownloadSimple,
  Tag,
} from "@phosphor-icons/react";
import type {
  WebBookmarkSortOption,
  WebBookmarkViewConfig,
  WebBookmarkViewMode,
} from "../../bookmarks/bookmarkTypes";
import type { SidebarSection } from "./webBookmarkFilters";
import { WebBookmarkSortMenu } from "./WebBookmarkSortMenu";
import { WebBookmarkViewMenu } from "./WebBookmarkViewMenu";
import styles from "./WebBookmarksHeader.module.scss";

export interface WebBookmarksContentHeaderProps {
  section: SidebarSection;
  sortOption: WebBookmarkSortOption;
  onSortChange: (sort: WebBookmarkSortOption) => void;
  viewConfig: WebBookmarkViewConfig;
  onViewConfigChange: (cfg: WebBookmarkViewConfig) => void;
  onExport: () => void;
}

export function WebBookmarksContentHeader({
  section,
  sortOption,
  onSortChange,
  viewConfig,
  onViewConfigChange,
  onExport,
}: WebBookmarksContentHeaderProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) {
        setViewOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSectionTitle = (): { icon: React.ReactNode; title: string } => {
    if (section.type === "all") {
      return {
        icon: <Cloud size={20} weight="regular" />,
        title: "All bookmarks",
      };
    }
    if (section.type === "unsorted") {
      return { icon: <Tray size={20} weight="regular" />, title: "Unsorted" };
    }
    if (section.type === "trash") {
      return { icon: <Trash size={20} weight="regular" />, title: "Trash" };
    }
    if (section.type === "collection") {
      return {
        icon: <FolderSimple size={20} weight="regular" />,
        title: section.folder,
      };
    }
    if (section.type === "filter") {
      const cap =
        section.filter.charAt(0).toUpperCase() + section.filter.slice(1);
      return { icon: <Tag size={20} weight="regular" />, title: cap };
    }
    return { icon: <Cloud size={20} weight="regular" />, title: "Bookmarks" };
  };

  const getSortLabel = (): string => {
    switch (sortOption) {
      case "date-asc":
        return "By date ↑";
      case "name-asc":
      case "alpha":
        return "By name (A-Z)";
      case "name-desc":
        return "By name (Z-A)";
      case "domain-asc":
      case "domain":
        return "Sites (A-Z)";
      case "domain-desc":
        return "Sites (Z-A)";
      case "recent":
      case "date-desc":
      default:
        return "By date ↓";
    }
  };

  const getViewModeIcon = (mode: WebBookmarkViewMode) => {
    switch (mode) {
      case "cards":
        return <GridFour size={16} weight="regular" />;
      case "headlines":
        return <Rows size={16} weight="regular" />;
      case "moodboard":
        return <Kanban size={16} weight="regular" />;
      case "list":
      default:
        return <List size={16} weight="regular" />;
    }
  };

  const { icon, title } = getSectionTitle();

  return (
    <div className={styles["wb-header"]}>
      <div className={styles["wb-header__left"]}>
        <span className={styles["wb-header__title-icon"]}>{icon}</span>
        <h1 className={styles["wb-header__title"]}>{title}</h1>
      </div>

      <div className={styles["wb-header__controls"]}>
        <div ref={sortRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={styles["wb-header__btn"]}
            onClick={() => setSortOpen((p) => !p)}
            aria-expanded={sortOpen}
          >
            <Clock size={16} weight="regular" />
            <span>{getSortLabel()}</span>
          </button>
          {sortOpen && (
            <WebBookmarkSortMenu
              sortOption={sortOption}
              onSortChange={onSortChange}
              onClose={() => setSortOpen(false)}
            />
          )}
        </div>

        <div ref={viewRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={styles["wb-header__btn"]}
            onClick={() => setViewOpen((p) => !p)}
            aria-expanded={viewOpen}
          >
            {getViewModeIcon(viewConfig.mode)}
            <span style={{ textTransform: "capitalize" }}>
              {viewConfig.mode}
            </span>
          </button>
          {viewOpen && (
            <WebBookmarkViewMenu
              viewConfig={viewConfig}
              onViewConfigChange={onViewConfigChange}
              onClose={() => setViewOpen(false)}
            />
          )}
        </div>

        <button
          type="button"
          className={styles["wb-header__btn"]}
          onClick={onExport}
          title="Export Bookmarks"
        >
          <DownloadSimple size={16} weight="regular" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}

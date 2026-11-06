import React from "react";
import {
  MagnifyingGlass,
  Sliders,
  Sparkle,
  Plus,
  Globe,
  Clock,
  List,
  GridFour,
  Rows,
  Kanban,
  DownloadSimple,
  CheckSquare,
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

export interface WebBookmarksTopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAskAI: () => void;
  onOpenAdd: () => void;
  onOpenAddFromBrowser?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isOrganizingAI?: boolean;
  /** Notes page: search/filter only (no add or AI organize actions). */
  variant?: "links" | "notes";
  section: SidebarSection;
  sortOption: WebBookmarkSortOption;
  onSortChange: (sort: WebBookmarkSortOption) => void;
  viewConfig: WebBookmarkViewConfig;
  onViewConfigChange: (config: WebBookmarkViewConfig) => void;
  onExport?: () => void;
  showSelectCheckbox: boolean;
  onToggleSelectCheckbox: () => void;
}

export function WebBookmarksTopBar({
  searchQuery,
  onSearchChange,
  onAskAI,
  onOpenAdd,
  onOpenAddFromBrowser,
  searchInputRef,
  isOrganizingAI = false,
  variant = "links",
  section,
  sortOption,
  onSortChange,
  viewConfig,
  onViewConfigChange,
  onExport,
  showSelectCheckbox,
  onToggleSelectCheckbox,
}: WebBookmarksTopBarProps) {
  const isNotes = variant === "notes";
  const [sortOpen, setSortOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
      if (!viewRef.current?.contains(event.target as Node)) setViewOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);
  const sortLabel = sortOption === "date-asc" ? "Date ↑"
    : sortOption === "name-asc" || sortOption === "alpha" ? "Name A–Z"
      : sortOption === "name-desc" ? "Name Z–A"
        : sortOption === "domain-asc" || sortOption === "domain" ? "Site A–Z"
          : sortOption === "domain-desc" ? "Site Z–A" : "Date ↓";
  const viewIcon = (mode: WebBookmarkViewMode) => mode === "cards"
    ? <GridFour size={16} /> : mode === "headlines" ? <Rows size={16} />
      : mode === "moodboard" ? <Kanban size={16} /> : <List size={16} />;
  return (
    <header className={styles["wb-topbar"]}>
      <div className={styles["wb-topbar__search-wrap"]}>
        <MagnifyingGlass
          size={16}
          weight="regular"
          className={styles["wb-topbar__search-icon"]}
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          className={styles["wb-topbar__search-input"]}
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={
            isNotes ? "Search bookmarked notes" : "Search web bookmarks"
          }
        />
      </div>

      <div className={styles["wb-topbar__controls"]}>
        {section.type !== "all" && <span className={styles["wb-topbar__section"]}>{section.type === "collection" ? section.folder : section.type === "filter" ? section.filter : section.type === "trash" ? "Trash" : "Unsorted"}</span>}
        {!isNotes && <button type="button" className={`${styles["wb-topbar__control-btn"]} ${showSelectCheckbox ? styles["is-active"] : ""}`} onClick={onToggleSelectCheckbox} aria-label="Select bookmarks" aria-pressed={showSelectCheckbox}><CheckSquare size={16} /><span>Select</span></button>}
        <div className={styles["wb-topbar__menu-wrap"]} ref={sortRef}>
          <button type="button" className={styles["wb-topbar__control-btn"]} onClick={() => setSortOpen((open) => !open)} aria-expanded={sortOpen}><Clock size={16} /><span>{sortLabel}</span></button>
          {sortOpen && <WebBookmarkSortMenu sortOption={sortOption} onSortChange={onSortChange} onClose={() => setSortOpen(false)} />}
        </div>
        <div className={styles["wb-topbar__menu-wrap"]} ref={viewRef}>
          <button type="button" className={styles["wb-topbar__control-btn"]} onClick={() => setViewOpen((open) => !open)} aria-expanded={viewOpen}>{viewIcon(viewConfig.mode)}<span>{viewConfig.mode}</span></button>
          {viewOpen && <WebBookmarkViewMenu viewConfig={viewConfig} onViewConfigChange={onViewConfigChange} onClose={() => setViewOpen(false)} />}
        </div>
        {!isNotes && onExport && <button type="button" className={styles["wb-topbar__control-btn"]} onClick={onExport} title="Export Bookmarks"><DownloadSimple size={16} /><span>Export</span></button>}
      </div>

      {!isNotes && (
        <div className={styles["wb-topbar__actions"]}>
          <button
            type="button"
            className={styles["wb-topbar__control-btn"]}
            title="Filter options"
            aria-label="Filter options"
          >
            <Sliders size={16} weight="regular" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            className={styles["wb-topbar__ask-btn"]}
            onClick={onAskAI}
            disabled={isOrganizingAI}
            aria-label="Organize with AI"
            title="Organize with AI"
          >
            <Sparkle size={16} weight="regular" />
            <span>{isOrganizingAI ? "Thinking..." : "Ask"}</span>
          </button>

          {onOpenAddFromBrowser && (
            <button
              type="button"
              className={styles["wb-topbar__browser-btn"]}
              onClick={onOpenAddFromBrowser}
              aria-label="Add from browser"
            >
              <Globe size={16} weight="regular" />
              <span>Add from browser</span>
            </button>
          )}
          <button
            type="button"
            className={styles["wb-topbar__add-btn"]}
            onClick={onOpenAdd}
            aria-label="Add Link"
            title="Add Link"
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
      )}
    </header>
  );
}

import React from "react";
import {
  MagnifyingGlass,
  Sliders,
  Sparkle,
  Plus,
  Globe,
} from "@phosphor-icons/react";
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
}: WebBookmarksTopBarProps) {
  const isNotes = variant === "notes";
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
        <button
          type="button"
          className={styles["wb-topbar__filter-icon-btn"]}
          title="Filter options"
          aria-label="Filter options"
        >
          <Sliders size={14} weight="regular" />
        </button>
      </div>

      {!isNotes && (
        <div className={styles["wb-topbar__actions"]}>
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

          <button
            type="button"
            className={styles["wb-topbar__add-btn"]}
            onClick={onOpenAdd}
            aria-label="Add Link"
          >
            <Plus size={16} weight="bold" />
            <span>Add</span>
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
        </div>
      )}
    </header>
  );
}

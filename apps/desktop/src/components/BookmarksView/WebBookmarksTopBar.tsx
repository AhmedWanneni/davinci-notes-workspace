import React from "react";
import { MagnifyingGlass, Sliders, Sparkle, Plus } from "@phosphor-icons/react";
import styles from "./WebBookmarksHeader.module.scss";

export interface WebBookmarksTopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAskAI: () => void;
  onOpenAdd: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isOrganizingAI?: boolean;
}

export function WebBookmarksTopBar({
  searchQuery,
  onSearchChange,
  onAskAI,
  onOpenAdd,
  searchInputRef,
  isOrganizingAI = false,
}: WebBookmarksTopBarProps) {
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
          aria-label="Search web bookmarks"
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
      </div>
    </header>
  );
}

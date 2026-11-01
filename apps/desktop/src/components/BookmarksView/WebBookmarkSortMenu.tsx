import React from "react";
import { Clock, Globe } from "@phosphor-icons/react";
import type { WebBookmarkSortOption } from "../../bookmarks/bookmarkTypes";
import styles from "./WebBookmarksHeader.module.scss";

export interface WebBookmarkSortMenuProps {
  sortOption: WebBookmarkSortOption;
  onSortChange: (sort: WebBookmarkSortOption) => void;
  onClose: () => void;
}

const SORT_OPTIONS = [
  { id: "date-asc", label: "By date ↑", icon: <Clock size={14} /> },
  { id: "date-desc", label: "By date ↓", icon: <Clock size={14} /> },
  {
    id: "name-asc",
    label: "By name (A-Z)",
    icon: <span style={{ fontSize: 11, fontWeight: 700 }}>Az</span>,
  },
  {
    id: "name-desc",
    label: "By name (Z-A)",
    icon: <span style={{ fontSize: 11, fontWeight: 700 }}>Za</span>,
  },
  { id: "domain-asc", label: "Sites (A-Z)", icon: <Globe size={14} /> },
  { id: "domain-desc", label: "Sites (Z-A)", icon: <Globe size={14} /> },
];

export function WebBookmarkSortMenu({
  sortOption,
  onSortChange,
  onClose,
}: WebBookmarkSortMenuProps) {
  return (
    <div className={styles["wb-menu"]}>
      <div className={styles["wb-menu__heading"]}>Sort by</div>
      {SORT_OPTIONS.map((opt) => {
        const isSelected =
          sortOption === opt.id ||
          (opt.id === "date-desc" && sortOption === "recent");
        return (
          <button
            key={opt.id}
            type="button"
            className={`${styles["wb-menu__item"]} ${
              isSelected ? styles["is-selected"] : ""
            }`}
            onClick={() => {
              onSortChange(opt.id as WebBookmarkSortOption);
              onClose();
            }}
          >
            <span className={styles["wb-menu__item-left"]}>
              <span className={styles["wb-menu__radio"]}>
                {isSelected && (
                  <span className={styles["wb-menu__radio-dot"]} />
                )}
              </span>
              {opt.icon}
              <span>{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

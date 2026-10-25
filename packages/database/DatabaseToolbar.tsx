import React, { useState } from "react";
import type { DatabaseColumn } from "./databaseTypes";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsDownUpIcon,
  PlusIcon,
} from "./DatabaseIcons";
import styles from "./DatabaseToolbar.module.scss";

export interface DatabaseToolbarProps {
  columns: DatabaseColumn[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortCol: string | null;
  sortOrder: "asc" | "desc";
  onSortChange: (col: string | null, order: "asc" | "desc") => void;
  filterCol: string | null;
  filterVal: string;
  onFilterChange: (col: string | null, val: string) => void;
  onAddRow: () => void;
}

export function DatabaseToolbar({
  columns,
  searchQuery,
  onSearchChange,
  sortCol,
  sortOrder,
  onSortChange,
  filterCol,
  filterVal,
  onFilterChange,
  onAddRow,
}: DatabaseToolbarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  return (
    <div className={styles["database-toolbar"]}>
      <div className={styles["toolbar-left"]}>
        <div className={styles["search-container"]}>
          <MagnifyingGlassIcon size={14} />
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="Search rows..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles["popover-container"]}>
          <button
            type="button"
            className={`${styles["toolbar-btn"]}${sortCol ? ` ${styles["is-active"]}` : ""}`}
            onClick={() => setShowSortMenu(!showSortMenu)}
          >
            <ArrowsDownUpIcon size={14} />
            <span>Sort{sortCol ? `: ${sortCol}` : ""}</span>
          </button>

          {showSortMenu && (
            <div className={styles["popover-dropdown"]}>
              <div className={styles["popover-row"]}>
                <label>Column:</label>
                <select
                  value={sortCol || ""}
                  onChange={(e) =>
                    onSortChange(e.target.value || null, sortOrder)
                  }
                >
                  <option value="">(None)</option>
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
              {sortCol && (
                <div className={styles["popover-row"]}>
                  <label>Order:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      onSortChange(sortCol, e.target.value as "asc" | "desc")
                    }
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles["popover-container"]}>
          <button
            type="button"
            className={`${styles["toolbar-btn"]}${filterCol ? ` ${styles["is-active"]}` : ""}`}
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <FunnelIcon size={14} />
            <span>Filter{filterCol ? `: ${filterCol}` : ""}</span>
          </button>

          {showFilterMenu && (
            <div className={styles["popover-dropdown"]}>
              <div className={styles["popover-row"]}>
                <label>Column:</label>
                <select
                  value={filterCol || ""}
                  onChange={(e) =>
                    onFilterChange(e.target.value || null, filterVal)
                  }
                >
                  <option value="">(All)</option>
                  {columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
              {filterCol && (
                <div className={styles["popover-row"]}>
                  <label>Value:</label>
                  <input
                    type="text"
                    style={{
                      fontSize: 12,
                      padding: "2px 4px",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: 3,
                    }}
                    value={filterVal}
                    placeholder="Contains..."
                    onChange={(e) => onFilterChange(filterCol, e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className={styles["new-row-btn"]}
        onClick={onAddRow}
      >
        <PlusIcon size={14} />
        <span>New</span>
      </button>
    </div>
  );
}

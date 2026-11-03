import { useState, useMemo } from "react";
import { MagnifyingGlass, Plus, ArrowLeft } from "@phosphor-icons/react";
import type { WebBookmarkItem } from "../../bookmarks/bookmarkTypes";
import styles from "./WebBookmarkAddBar.module.scss";

export interface WebBookmarkBrowserListProps {
  browserName: string;
  items: readonly WebBookmarkItem[];
  onAddSingle: (item: WebBookmarkItem) => void;
  onUseInForm?: (item: WebBookmarkItem) => void;
  onAddAll?: () => void;
  onChangeBrowser: () => void;
}

export function WebBookmarkBrowserList({
  browserName,
  items,
  onAddSingle,
  onUseInForm,
  onAddAll,
  onChangeBrowser,
}: WebBookmarkBrowserListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.url.toLowerCase().includes(q) ||
        (it.folder && it.folder.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <div className={styles["browser-list-container"]} role="region" aria-label={`Bookmarks from ${browserName}`}>
      <div className={styles["browser-list-toolbar"]}>
        <button
          type="button"
          className={styles["back-btn"]}
          onClick={onChangeBrowser}
          aria-label="Choose different browser"
        >
          <ArrowLeft size={13} />
          <span>Switch browser</span>
        </button>
        <span className={styles["browser-list-summary"]}>
          {items.length} bookmark{items.length === 1 ? "" : "s"} from {browserName}
        </span>
        {onAddAll && items.length > 1 && (
          <button
            type="button"
            className={`${styles["action-btn"]} ${styles["is-primary"]}`}
            onClick={onAddAll}
          >
            Add all ({items.length})
          </button>
        )}
      </div>

      <div className={styles["search-box"]}>
        <MagnifyingGlass size={14} className={styles["search-icon"]} />
        <input
          type="search"
          className={styles["search-input"]}
          placeholder={`Search ${items.length} ${browserName} bookmarks...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${browserName} bookmarks`}
        />
      </div>

      <div className={styles["items-scroll"]} role="list" aria-label="Browser bookmarks list">
        {filtered.length === 0 ? (
          <div className={styles["empty-search"]}>No bookmarks match &ldquo;{query}&rdquo;</div>
        ) : (
          filtered.slice(0, 50).map((b) => (
            <div key={b.id || b.url} className={styles["bookmark-row"]} role="listitem">
              <div className={styles["bookmark-meta"]}>
                <span className={styles["bookmark-title"]} title={b.title}>
                  {b.title}
                </span>
                <span className={styles["bookmark-url"]} title={b.url}>
                  {b.domain || b.url}
                  {b.folder && ` • ${b.folder}`}
                </span>
              </div>
              <div className={styles["row-actions"]}>
                {onUseInForm && (
                  <button
                    type="button"
                    className={styles["action-btn-sm"]}
                    onClick={() => onUseInForm(b)}
                    title="Fill into form to edit tags or folder"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles["action-btn-sm"]} ${styles["is-primary"]}`}
                  onClick={() => onAddSingle(b)}
                  aria-label={`Add ${b.title}`}
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {filtered.length > 50 && (
        <span className={styles["more-hint"]}>
          Showing top 50 of {filtered.length} bookmarks. Type in search to narrow down.
        </span>
      )}
    </div>
  );
}

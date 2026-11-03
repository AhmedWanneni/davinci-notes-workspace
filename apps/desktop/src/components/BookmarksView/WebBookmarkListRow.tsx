import React, { useState } from "react";
import {
  FolderSimple,
  ArrowSquareOut,
  Trash,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import type {
  WebBookmarkItem,
  WebBookmarkViewConfig,
} from "../../bookmarks/bookmarkTypes";
import { WebBookmarkCover } from "./WebBookmarkCover";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarkListRowProps {
  item: WebBookmarkItem;
  viewConfig: WebBookmarkViewConfig;
  onOpenExternal: (url: string) => void;
  onEdit: (item: WebBookmarkItem) => void;
  onRemove: (id: string) => void;
  onRestore?: (id: string) => void;
  isNotes?: boolean;
  showCheckbox?: boolean;
}

function formatDate(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    const now = new Date();
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function WebBookmarkListRow({
  item,
  viewConfig,
  onOpenExternal,
  onEdit,
  onRemove,
  onRestore,
  isNotes = false,
  showCheckbox = false,
}: WebBookmarkListRowProps) {
  const [isSelected, setIsSelected] = useState(false);

  const domain =
    item.domain ||
    (() => {
      try {
        return new URL(item.url).hostname.replace(/^www\./, "");
      } catch {
        return item.url;
      }
    })();

  return (
    <div
      className={styles["wb-list-row"]}
      data-testid="web-bookmark-row"
      data-selected={isSelected || undefined}
      onClick={() => onOpenExternal(item.url)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpenExternal(item.url);
      }}
    >
      {showCheckbox && (
        <div
          className={styles["wb-list-row__checkbox-wrap"]}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => setIsSelected(e.target.checked)}
            aria-label={`Select ${item.title}`}
            className={styles["wb-list-row__checkbox"]}
          />
        </div>
      )}

      {viewConfig.showCover && (
        <div className={styles["wb-list-row__cover-wrap"]}>
          <WebBookmarkCover
            url={item.url}
            cover={item.cover}
            favicon={item.favicon}
            title={item.title}
          />
        </div>
      )}

      <div className={styles["wb-list-row__content"]}>
        {viewConfig.showTitle && (
          <div className={styles["wb-list-row__title"]} title={item.title}>
            {item.title}
          </div>
        )}

        {viewConfig.showDescription && item.description && (
          <div className={styles["wb-list-row__desc"]}>{item.description}</div>
        )}

        {viewConfig.showNote && item.note && (
          <div className={styles["wb-list-row__note"]}>{item.note}</div>
        )}

        {viewConfig.showBookmarkInfo && (
          <div className={styles["wb-list-row__meta"]}>
            <span className={styles["wb-list-row__folder"]}>
              <FolderSimple size={13} weight="regular" />
              <span>{item.folder || "Unsorted"}</span>
            </span>
            <span className={styles["wb-list-row__dot"]}>•</span>
            <span className={styles["wb-list-row__domain"]}>{domain}</span>
            {!isNotes && (
              <button
                type="button"
                className={styles["wb-link-btn"]}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExternal(item.url);
                }}
                title="Open bookmark link in browser"
                aria-label="Open bookmark link in browser"
              >
                <ArrowSquareOut size={12} />
              </button>
            )}
            <span className={styles["wb-list-row__dot"]}>•</span>
            <span className={styles["wb-list-row__date"]}>
              {formatDate(item.addedAt)}
            </span>
          </div>
        )}
      </div>

      <div
        className={styles["wb-list-row__actions"]}
        onClick={(e) => e.stopPropagation()}
      >
        {item.trashed ? (
          <>
            {onRestore && (
              <button
                type="button"
                className={styles["wb-list-row__action-btn"]}
                onClick={() => onRestore(item.id)}
                title="Restore bookmark"
              >
                <ArrowCounterClockwise size={15} />
              </button>
            )}
            <button
              type="button"
              className={styles["wb-list-row__action-btn"]}
              onClick={() => onRemove(item.id)}
              title="Delete permanently"
            >
              <Trash size={15} />
            </button>
          </>
        ) : (
          <>
            {!isNotes && (
              <>
                <button
                  type="button"
                  className={styles["wb-list-row__action-btn"]}
                  onClick={() => onOpenExternal(item.url)}
                  title="Open link in browser"
                  aria-label="Open link in browser"
                >
                  <ArrowSquareOut size={15} />
                </button>
                <button
                  type="button"
                  className={styles["wb-list-row__edit-btn"]}
                  onClick={() => onEdit(item)}
                  title="Edit bookmark"
                >
                  Edit
                </button>
              </>
            )}
            <button
              type="button"
              className={styles["wb-list-row__action-btn"]}
              onClick={() => onRemove(item.id)}
              title="Move to trash"
            >
              <Trash size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

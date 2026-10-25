import React from "react";
import { FileText, Warning, TrashSimple } from "@phosphor-icons/react";
import type { BookmarkItem } from "../../bookmarks/bookmarkTypes";
import styles from "./BookmarksView.module.scss";

export interface BookmarkRowProps {
  item: BookmarkItem;
  icon?: string;
  preview?: string;
  isSelected: boolean;
  isMissing: boolean;
  onOpen: (path: string, newTab: boolean) => void;
  onRemove: (path: string) => void;
}

function formatDate(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function BookmarkRow({
  item,
  icon,
  preview,
  isSelected,
  isMissing,
  onOpen,
  onRemove,
}: BookmarkRowProps) {
  const parts = item.path.split("/");
  const fileName = parts.pop() ?? item.path;
  const folder = parts.join("/");
  const title = fileName.replace(/\.(md|canvas)$/i, "");

  const handleClick = (e: React.MouseEvent) => {
    const isNewTab = e.metaKey || e.ctrlKey || e.button === 1;
    onOpen(item.path, isNewTab);
  };

  const handleAuxClick = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      onOpen(item.path, true);
    }
  };

  return (
    <li
      className={styles["bookmark-row"]}
      data-testid="bookmark-row"
      data-selected={isSelected || undefined}
      data-missing={isMissing || undefined}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      role="button"
      aria-selected={isSelected}
      tabIndex={-1}
    >
      <div className={styles["bookmark-row__left"]}>
        <div className={styles["bookmark-row__icon"]} aria-hidden="true">
          {icon ? (
            <span style={{ fontSize: "16px" }}>{icon}</span>
          ) : (
            <FileText size={16} weight="regular" />
          )}
        </div>

        <div className={styles["bookmark-row__body"]}>
          <div className={styles["bookmark-row__title-line"]}>
            <span className={styles["bookmark-row__title"]} title={item.path}>
              {title}
            </span>
            {folder && (
              <span className={styles["bookmark-row__folder"]} title={folder}>
                {folder}
              </span>
            )}
            {isMissing && (
              <span className={styles["bookmark-row__warning-chip"]}>
                <Warning size={12} weight="regular" />
                Missing
              </span>
            )}
          </div>

          {preview && !isMissing && (
            <div className={styles["bookmark-row__preview"]}>{preview}</div>
          )}
        </div>
      </div>

      <div className={styles["bookmark-row__right"]}>
        <span className={styles["bookmark-row__date"]}>
          {formatDate(item.addedAt)}
        </span>
        <button
          type="button"
          className={styles["bookmark-row__remove-btn"]}
          title="Remove bookmark"
          aria-label={`Remove bookmark for ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.path);
          }}
        >
          <TrashSimple size={14} weight="regular" />
        </button>
      </div>
    </li>
  );
}

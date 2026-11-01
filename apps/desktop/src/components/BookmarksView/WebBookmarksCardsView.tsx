import React from "react";
import {
  FolderSimple,
  Eye,
  Trash,
  Globe,
  PencilSimple,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import type {
  WebBookmarkItem,
  WebBookmarkViewConfig,
} from "../../bookmarks/bookmarkTypes";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarksCardsViewProps {
  items: readonly WebBookmarkItem[];
  viewConfig: WebBookmarkViewConfig;
  onOpenExternal: (url: string) => void;
  onEdit: (item: WebBookmarkItem) => void;
  onRemove: (id: string) => void;
  onRestore?: (id: string) => void;
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

export function WebBookmarksCardsView({
  items,
  viewConfig,
  onOpenExternal,
  onEdit,
  onRemove,
  onRestore,
}: WebBookmarksCardsViewProps) {
  const coverHeight = 120 + (viewConfig.coverSize - 1) * 25;

  return (
    <div className={styles["wb-cards-grid"]}>
      {items.map((item) => {
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
            key={item.id}
            className={styles["wb-card"]}
            onClick={() => onOpenExternal(item.url)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter") onOpenExternal(item.url);
            }}
          >
            {viewConfig.showCover && (
              <div
                className={styles["wb-card__cover-wrap"]}
                style={{ height: `${coverHeight}px` }}
              >
                {item.cover ? (
                  <img
                    src={item.cover}
                    alt=""
                    className={styles["wb-card__cover-img"]}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles["wb-card__cover-placeholder"]}>
                    <Globe size={32} weight="regular" />
                  </div>
                )}
                <div
                  className={styles["wb-card__hover-actions"]}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.trashed ? (
                    <>
                      {onRestore && (
                        <button
                          type="button"
                          className={styles["wb-card__icon-btn"]}
                          onClick={() => onRestore(item.id)}
                          title="Restore"
                        >
                          <ArrowCounterClockwise size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles["wb-card__icon-btn"]}
                        onClick={() => onRemove(item.id)}
                        title="Delete permanently"
                      >
                        <Trash size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles["wb-card__icon-btn"]}
                        onClick={() => onOpenExternal(item.url)}
                        title="Open link"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles["wb-card__icon-btn"]}
                        onClick={() => onEdit(item)}
                        title="Edit"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles["wb-card__icon-btn"]}
                        onClick={() => onRemove(item.id)}
                        title="Move to trash"
                      >
                        <Trash size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className={styles["wb-card__body"]}>
              {viewConfig.showTitle && (
                <div className={styles["wb-card__title"]} title={item.title}>
                  {item.title}
                </div>
              )}

              {viewConfig.showNote && item.note && (
                <div className={styles["wb-card__note"]}>{item.note}</div>
              )}

              {viewConfig.showDescription && item.description && (
                <div className={styles["wb-card__desc"]}>
                  {item.description}
                </div>
              )}

              {viewConfig.showTags && item.tags && item.tags.length > 0 && (
                <div className={styles["wb-card__tags"]}>
                  {item.tags.map((t) => (
                    <span key={t} className={styles["wb-card__tag"]}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {viewConfig.showBookmarkInfo && (
                <div className={styles["wb-card__meta"]}>
                  <span className={styles["wb-card__folder"]}>
                    <FolderSimple size={12} weight="regular" />
                    <span>{item.folder || "Unsorted"}</span>
                  </span>
                  <span className={styles["wb-card__dot"]}>•</span>
                  <span className={styles["wb-card__domain"]}>{domain}</span>
                  <span className={styles["wb-card__dot"]}>•</span>
                  <span className={styles["wb-card__date"]}>
                    {formatDate(item.addedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

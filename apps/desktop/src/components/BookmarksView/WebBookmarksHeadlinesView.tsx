import React from "react";
import {
  FolderSimple,
  ArrowSquareOut,
  Trash,
  FileText,
  PencilSimple,
} from "@phosphor-icons/react";
import type {
  WebBookmarkItem,
  WebBookmarkViewConfig,
} from "../../bookmarks/bookmarkTypes";
import { getWebsiteFaviconUrl } from "../../bookmarks/bookmarkStorage";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarksHeadlinesViewProps {
  items: readonly WebBookmarkItem[];
  viewConfig: WebBookmarkViewConfig;
  isNotes?: boolean;
  onOpenExternal: (url: string) => void;
  onEdit: (item: WebBookmarkItem) => void;
  onRemove: (id: string) => void;
}

export function WebBookmarksHeadlinesView({
  items,
  viewConfig: _viewConfig,
  isNotes = false,
  onOpenExternal,
  onEdit,
  onRemove,
}: WebBookmarksHeadlinesViewProps) {
  return (
    <div className={styles["wb-headlines-list"]}>
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
            className={styles["wb-headline-row"]}
            onClick={() => onOpenExternal(item.url)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter") onOpenExternal(item.url);
            }}
          >
            <div className={styles["wb-headline-row__icon"]}>
              {item.favicon || getWebsiteFaviconUrl(item.url) ? (
                <img
                  src={item.favicon || getWebsiteFaviconUrl(item.url)}
                  alt=""
                  style={{
                    width: "14px",
                    height: "14px",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <FileText size={14} weight="regular" />
              )}
            </div>

            <div
              className={styles["wb-headline-row__title"]}
              title={item.title}
            >
              {item.title}
            </div>

            <div className={styles["wb-headline-row__meta"]}>
              <span className={styles["wb-headline-row__folder"]}>
                <FolderSimple size={11} />
                <span>{item.folder || "Unsorted"}</span>
              </span>
              <span className={styles["wb-headline-row__domain"]}>
                {domain}
              </span>
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
            </div>

            <div
              className={styles["wb-headline-row__actions"]}
              onClick={(e) => e.stopPropagation()}
            >
              {!isNotes && (
                <>
                  <button
                    type="button"
                    className={styles["wb-card__icon-btn"]}
                    onClick={() => onOpenExternal(item.url)}
                    title="Open link in browser"
                    aria-label="Open link in browser"
                  >
                    <ArrowSquareOut size={13} />
                  </button>
                  <button
                    type="button"
                    className={styles["wb-card__icon-btn"]}
                    onClick={() => onEdit(item)}
                    title="Edit"
                  >
                    <PencilSimple size={13} />
                  </button>
                </>
              )}
              <button
                type="button"
                className={styles["wb-card__icon-btn"]}
                onClick={() => onRemove(item.id)}
                title="Delete"
              >
                <Trash size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

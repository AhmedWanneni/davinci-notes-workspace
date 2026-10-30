import React, { useState } from "react";
import {
  Globe,
  ArrowSquareOut,
  Copy,
  Check,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import type { WebBookmarkItem } from "../../bookmarks/bookmarkTypes";
import styles from "./BookmarksView.module.scss";
import webStyles from "./WebBookmarks.module.scss";

export interface WebBookmarkRowProps {
  item: WebBookmarkItem;
  isSelected: boolean;
  onOpenExternal: (url: string) => void;
  onSelectFolder: (folder: string) => void;
  onSelectTag: (tag: string) => void;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<WebBookmarkItem, "title" | "url" | "folder" | "tags" | "description">
    >,
  ) => void;
  onRemove: (id: string) => void;
}

function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function WebBookmarkRow({
  item,
  isSelected,
  onOpenExternal,
  onSelectFolder,
  onSelectTag,
  onUpdate,
  onRemove,
}: WebBookmarkRowProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [draftFolder, setDraftFolder] = useState(item.folder ?? "");
  const [draftTags, setDraftTags] = useState((item.tags ?? []).join(", "));

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard?.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const tags = draftTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    onUpdate(item.id, {
      title: draftTitle.trim() || item.title,
      folder: draftFolder.trim(),
      tags,
    });
    setEditing(false);
  };

  return (
    <li
      className={styles["bookmark-row"]}
      data-testid="web-bookmark-row"
      data-selected={isSelected || undefined}
      onClick={() => {
        if (!editing) onOpenExternal(item.url);
      }}
      role="button"
      aria-selected={isSelected}
      tabIndex={-1}
    >
      <div className={styles["bookmark-row__left"]}>
        <div className={styles["bookmark-row__icon"]} aria-hidden="true">
          <Globe size={16} weight="regular" />
        </div>

        <div className={styles["bookmark-row__body"]}>
          <div className={styles["bookmark-row__title-line"]}>
            <span className={styles["bookmark-row__title"]} title={item.url}>
              {item.title}
            </span>
            {item.domain && (
              <span className={webStyles["domain-badge"]}>{item.domain}</span>
            )}
            {item.folder && (
              <button
                type="button"
                className={webStyles["tag-chip"]}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.folder) onSelectFolder(item.folder);
                }}
                title={`Filter by folder: ${item.folder}`}
              >
                {item.folder}
              </button>
            )}
          </div>

          {item.description && (
            <div className={styles["bookmark-row__preview"]}>
              {item.description}
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className={webStyles["tag-list"]}>
              {item.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={webStyles["tag-chip"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag(tag);
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {editing && (
            <form
              className={webStyles["edit-row"]}
              onSubmit={handleSaveEdit}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                className={webStyles["text-input"]}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Title"
                aria-label="Edit bookmark title"
              />
              <input
                type="text"
                className={webStyles["text-input"]}
                value={draftFolder}
                onChange={(e) => setDraftFolder(e.target.value)}
                placeholder="Folder"
                aria-label="Edit bookmark folder"
              />
              <input
                type="text"
                className={webStyles["text-input"]}
                value={draftTags}
                onChange={(e) => setDraftTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                aria-label="Edit bookmark tags"
              />
              <button
                type="submit"
                className={`${webStyles["action-btn"]} ${webStyles["is-primary"]}`}
              >
                Save
              </button>
              <button
                type="button"
                className={webStyles["action-btn"]}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </form>
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
          title="Copy link URL"
          aria-label={`Copy URL for ${item.title}`}
          onClick={handleCopy}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button
          type="button"
          className={styles["bookmark-row__remove-btn"]}
          title="Edit bookmark"
          aria-label={`Edit ${item.title}`}
          onClick={(e) => {
            e.stopPropagation();
            setEditing((prev) => !prev);
          }}
        >
          <PencilSimple size={14} />
        </button>
        <button
          type="button"
          className={styles["bookmark-row__remove-btn"]}
          title="Open in browser"
          aria-label={`Open ${item.title} in browser`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenExternal(item.url);
          }}
        >
          <ArrowSquareOut size={14} />
        </button>
        <button
          type="button"
          className={styles["bookmark-row__remove-btn"]}
          title="Remove web bookmark"
          aria-label={`Remove bookmark for ${item.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
        >
          <TrashSimple size={14} />
        </button>
      </div>
    </li>
  );
}

import React, { useState } from "react";
import type { WebBookmarkItem } from "../../bookmarks/bookmarkTypes";
import { WindowDialog } from "../WindowDialog";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarkEditModalProps {
  item: WebBookmarkItem;
  onClose: () => void;
  onSave: (
    id: string,
    patch: Partial<
      Pick<
        WebBookmarkItem,
        | "title"
        | "url"
        | "folder"
        | "tags"
        | "description"
        | "cover"
        | "note"
        | "type"
      >
    >,
  ) => void;
}

export function WebBookmarkEditModal({
  item,
  onClose,
  onSave,
}: WebBookmarkEditModalProps) {
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url);
  const [folder, setFolder] = useState(item.folder ?? "");
  const [note, setNote] = useState(item.note ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [cover, setCover] = useState(item.cover ?? "");
  const [tagsText, setTagsText] = useState((item.tags ?? []).join(", "));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsText
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);

    onSave(item.id, {
      title: title.trim() || item.title,
      url: url.trim() || item.url,
      folder: folder.trim() || undefined,
      note: note.trim() || undefined,
      description: description.trim() || undefined,
      cover: cover.trim() || undefined,
      tags,
    });
    onClose();
  };

  return (
    <WindowDialog
      isOpen={true}
      onClose={onClose}
      title="Edit Bookmark"
      ariaLabel="Edit bookmark"
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles["wb-modal__form"]} style={{ padding: "16px 20px" }}>
          <div className={styles["wb-modal__field"]}>
            <label className={styles["wb-modal__label"]}>Title</label>
            <input
              type="text"
              className={styles["wb-modal__input"]}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles["wb-modal__field"]}>
            <label className={styles["wb-modal__label"]}>URL</label>
            <input
              type="url"
              className={styles["wb-modal__input"]}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className={styles["wb-modal__field"]}>
            <label className={styles["wb-modal__label"]}>
              Collection (Folder)
            </label>
            <input
              type="text"
              className={styles["wb-modal__input"]}
              placeholder="e.g. React, Design, Inspiration"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
          </div>

          <div className={styles["wb-modal__field"]}>
            <label className={styles["wb-modal__label"]}>Note</label>
            <textarea
              className={styles["wb-modal__textarea"]}
              placeholder="Personal notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className={styles["wb-modal__field"]}>
            <label className={styles["wb-modal__label"]}>Description</label>
            <textarea
              className={styles["wb-modal__textarea"]}
              placeholder="Excerpt or description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className={styles["wb-modal__field"]}>
            <label className={styles["wb-modal__label"]}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              className={styles["wb-modal__input"]}
              placeholder="frontend, tools, reference"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </div>

          <div className={styles["wb-modal__field"]}>
            <label className={styles["wb-modal__label"]}>Cover Image URL</label>
            <input
              type="url"
              className={styles["wb-modal__input"]}
              placeholder="https://..."
              value={cover}
              onChange={(e) => setCover(e.target.value)}
            />
          </div>

          <div className={styles["wb-modal__actions"]}>
            <button
              type="button"
              className={styles["wb-modal__btn-secondary"]}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles["wb-modal__btn-primary"]}>
              Save
            </button>
          </div>
        </form>
    </WindowDialog>
  );
}

import React, { useState } from "react";
import type { WebBookmarkInput } from "../../bookmarks/bookmarkTypes";
import styles from "./WebBookmarkAddBar.module.scss";

export interface WebBookmarkManualFormProps {
  onAdd: (input: WebBookmarkInput) => void;
  onSwitchToBrowser: () => void;
  onCancel: () => void;
  initialValues?: Partial<WebBookmarkInput>;
}

export function WebBookmarkManualForm({
  onAdd,
  onSwitchToBrowser,
  onCancel,
  initialValues,
}: WebBookmarkManualFormProps) {
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [folder, setFolder] = useState(initialValues?.folder ?? "");
  const [tagsText, setTagsText] = useState(
    initialValues?.tags ? initialValues.tags.join(", ") : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) return setError("Please enter a URL.");
    const norm = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      new URL(norm);
    } catch {
      return setError("Please enter a valid http/https URL.");
    }
    const tags = tagsText
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    onAdd({
      url: norm,
      title: title.trim() || undefined,
      folder: folder.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  return (
    <form className={styles["manual-form"]} onSubmit={handleSubmit}>
      <input
        type="text"
        className={styles["text-input"]}
        placeholder="https://example.com"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError(null);
        }}
        aria-label="Bookmark URL"
        autoFocus
      />
      <input
        type="text"
        className={styles["text-input"]}
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Bookmark Title"
      />
      <input
        type="text"
        className={styles["text-input"]}
        placeholder="Folder / Category"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        aria-label="Bookmark Folder"
      />
      <input
        type="text"
        className={styles["text-input"]}
        placeholder="Tags (comma-separated)"
        value={tagsText}
        onChange={(e) => setTagsText(e.target.value)}
        aria-label="Bookmark Tags"
      />
      <button
        type="submit"
        className={`${styles["action-btn"]} ${styles["is-primary"]}`}
      >
        Save Link
      </button>
      <button
        type="button"
        className={styles["action-btn"]}
        onClick={onSwitchToBrowser}
      >
        From browser...
      </button>
      <button type="button" className={styles["action-btn"]} onClick={onCancel}>
        Cancel
      </button>
      {error && (
        <span role="alert" style={{ fontSize: "12px", width: "100%" }}>
          {error}
        </span>
      )}
    </form>
  );
}

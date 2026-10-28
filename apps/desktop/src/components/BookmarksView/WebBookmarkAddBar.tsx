import React, { useState } from "react";
import type { WebBookmarkInput } from "../../bookmarks/bookmarkTypes";
import webStyles from "./WebBookmarks.module.scss";

export interface WebBookmarkAddBarProps {
  onAdd: (input: WebBookmarkInput) => void;
  onCancel: () => void;
}

export function WebBookmarkAddBar({ onAdd, onCancel }: WebBookmarkAddBarProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = url.trim();
    if (!rawUrl) {
      setError("Please enter a URL.");
      return;
    }
    const normalized =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`;
    try {
      new URL(normalized);
    } catch {
      setError("Please enter a valid http/https URL.");
      return;
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);

    onAdd({
      url: normalized,
      title: title.trim() || undefined,
      folder: folder.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  return (
    <form
      className={webStyles["add-bar"]}
      onSubmit={handleSubmit}
      aria-label="Add web bookmark"
    >
      <input
        type="text"
        className={webStyles["text-input"]}
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
        className={webStyles["text-input"]}
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Bookmark Title"
      />
      <input
        type="text"
        className={webStyles["text-input"]}
        placeholder="Folder / Category (e.g. Development)"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        aria-label="Bookmark Folder"
      />
      <input
        type="text"
        className={webStyles["text-input"]}
        placeholder="Tags (comma-separated, e.g. rust, docs)"
        value={tagsText}
        onChange={(e) => setTagsText(e.target.value)}
        aria-label="Bookmark Tags"
      />
      <button
        type="submit"
        className={`${webStyles["action-btn"]} ${webStyles["is-primary"]}`}
      >
        Save Link
      </button>
      <button
        type="button"
        className={webStyles["action-btn"]}
        onClick={onCancel}
      >
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

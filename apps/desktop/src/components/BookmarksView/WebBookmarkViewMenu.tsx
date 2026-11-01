import React from "react";
import { List, GridFour, Rows, Kanban } from "@phosphor-icons/react";
import type {
  WebBookmarkViewConfig,
  WebBookmarkViewMode,
} from "../../bookmarks/bookmarkTypes";
import styles from "./WebBookmarksHeader.module.scss";

export interface WebBookmarkViewMenuProps {
  viewConfig: WebBookmarkViewConfig;
  onViewConfigChange: (cfg: WebBookmarkViewConfig) => void;
  onClose: () => void;
}

const VIEW_MODES: {
  id: WebBookmarkViewMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "list", label: "List", icon: <List size={16} /> },
  { id: "cards", label: "Cards", icon: <GridFour size={16} /> },
  { id: "headlines", label: "Headlines", icon: <Rows size={16} /> },
  { id: "moodboard", label: "Moodboard", icon: <Kanban size={16} /> },
];

const SHOW_OPTIONS: { key: keyof WebBookmarkViewConfig; label: string }[] = [
  { key: "showCover", label: "Cover" },
  { key: "showTitle", label: "Title" },
  { key: "showNote", label: "Note" },
  { key: "showDescription", label: "Description" },
  { key: "showHighlights", label: "Highlights" },
  { key: "showTags", label: "Tags" },
  { key: "showBookmarkInfo", label: "Bookmark info" },
];

export function WebBookmarkViewMenu({
  viewConfig,
  onViewConfigChange,
  onClose,
}: WebBookmarkViewMenuProps) {
  return (
    <div className={`${styles["wb-menu"]} ${styles["wb-menu--view"]}`}>
      <div className={styles["wb-menu__heading"]}>View</div>
      {VIEW_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`${styles["wb-menu__item"]} ${
            viewConfig.mode === m.id ? styles["is-selected"] : ""
          }`}
          onClick={() => {
            onViewConfigChange({
              ...viewConfig,
              mode: m.id,
            });
          }}
        >
          <span className={styles["wb-menu__item-left"]}>
            <span className={styles["wb-menu__radio"]}>
              {viewConfig.mode === m.id && (
                <span className={styles["wb-menu__radio-dot"]} />
              )}
            </span>
            {m.icon}
            <span>{m.label}</span>
          </span>
        </button>
      ))}

      <button
        type="button"
        className={styles["wb-menu__apply-btn"]}
        onClick={onClose}
      >
        Apply to all
      </button>

      <div className={styles["wb-menu__divider"]} />

      <div className={styles["wb-menu__heading"]}>
        Show in{" "}
        {viewConfig.mode.charAt(0).toUpperCase() + viewConfig.mode.slice(1)}
      </div>

      {SHOW_OPTIONS.map((opt) => (
        <label key={opt.key} className={styles["wb-menu__checkbox-row"]}>
          <input
            type="checkbox"
            checked={Boolean(viewConfig[opt.key])}
            onChange={(e) =>
              onViewConfigChange({
                ...viewConfig,
                [opt.key]: e.target.checked,
              })
            }
          />
          <span>{opt.label}</span>
        </label>
      ))}

      <div className={styles["wb-menu__slider-wrap"]}>
        <div className={styles["wb-menu__slider-label"]}>Cover</div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={viewConfig.coverSize}
          onChange={(e) =>
            onViewConfigChange({
              ...viewConfig,
              coverSize: Number(e.target.value),
            })
          }
          className={styles["wb-menu__slider"]}
        />
      </div>
    </div>
  );
}

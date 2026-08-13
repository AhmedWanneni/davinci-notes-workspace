import React from "react";
import styles from "../../App.module.scss";

export interface AppTabsProps {
  openNotes: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  onSelectNote: (path: string) => void;
  onCloseNote: (path: string) => void;
}

export function AppTabs({
  openNotes,
  activeNotePath,
  dirtyNotes,
  onSelectNote,
  onCloseNote,
}: AppTabsProps) {
  return (
    <div className={styles["tabs-bar"]}>
      {openNotes.map((path) => {
        const displayTitle =
          path.replace(/\.md$/i, "").split("/").pop() ?? path;
        const isActive = activeNotePath === path;
        const isDirty = dirtyNotes.has(path);
        return (
          <div
            key={path}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            onClick={() => onSelectNote(path)}
          >
            <span>{displayTitle}</span>
            {isDirty && <span className={"dirty-dot"} />}
            <span
              className={styles["close-tab"]}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onCloseNote(path);
              }}
            >
              ✕
            </span>
          </div>
        );
      })}
    </div>
  );
}

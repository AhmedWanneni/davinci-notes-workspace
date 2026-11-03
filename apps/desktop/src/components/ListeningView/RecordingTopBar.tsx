import React from "react";
import { FunnelSimple, MagnifyingGlass, Gear } from "@phosphor-icons/react";
import styles from "./ListeningView.module.scss";

export interface RecordingTopBarProps {
  onOpenSettings?: () => void;
}

export function RecordingTopBar({ onOpenSettings }: RecordingTopBarProps) {
  return (
    <div className={styles["recording-top-action-bar"]}>
      <button type="button" className={styles["action-bar-btn"]}>
        <FunnelSimple size={14} weight="bold" />
        <span>Filters</span>
      </button>
      <div className={styles["top-bar-right-actions"]}>
        <button
          type="button"
          className={styles["action-bar-icon-btn"]}
          aria-label="Search meetings"
        >
          <MagnifyingGlass size={16} />
        </button>
        {onOpenSettings && (
          <button
            type="button"
            className={styles["action-bar-icon-btn"]}
            onClick={onOpenSettings}
            title="Recording & AI Settings"
            data-testid="record-view-settings-btn"
          >
            <Gear size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
export default RecordingTopBar;

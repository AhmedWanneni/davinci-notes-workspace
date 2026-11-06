import React from "react";
import {
  CalendarCheck,
  Record,
  Gear,
} from "@phosphor-icons/react";
import styles from "./ListeningView.module.scss";

export interface MeetingsSidebarProps {
  activeChannel?: "all-meetings" | "record";
  onSelectChannel?: (channel: "all-meetings" | "record") => void;
  onOpenSettings?: () => void;
  className?: string;
}

export function MeetingsSidebar({
  activeChannel = "all-meetings",
  onSelectChannel,
  onOpenSettings,
  className = "",
}: MeetingsSidebarProps) {
  return (
    <aside
      className={`${styles["meetings-sidebar"]} ${className}`}
      aria-label="Meetings navigation"
      data-testid="meetings-sidebar"
    >
      <nav className={styles["meetings-sidebar__nav"]}>
        <button
          type="button"
          className={`${styles["meetings-sidebar__item"]} ${
            activeChannel === "all-meetings" ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectChannel?.("all-meetings")}
          data-testid="sidebar-all-meetings-btn"
        >
          <CalendarCheck size={16} />
          <span>All Meetings</span>
        </button>

        <button
          type="button"
          className={`${styles["meetings-sidebar__item"]} ${
            activeChannel === "record" ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectChannel?.("record")}
          data-testid="sidebar-record-btn"
        >
          <Record size={16} weight="fill" />
          <span>New Recording</span>
        </button>
      </nav>

      {onOpenSettings && (
        <div className={styles["meetings-sidebar__footer"]}>
          <button
            type="button"
            className={styles["meetings-sidebar__item"]}
            onClick={onOpenSettings}
            title="AI Listening & Transcript Settings"
            data-testid="sidebar-settings-btn"
          >
            <Gear size={16} />
            <span>Settings</span>
          </button>
        </div>
      )}
    </aside>
  );
}

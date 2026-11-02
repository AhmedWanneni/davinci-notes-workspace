import React from "react";
import {
  Hash,
  CalendarCheck,
  Robot,
  UploadSimple,
  Plus,
} from "@phosphor-icons/react";
import styles from "./ListeningView.module.scss";

export interface MeetingsSidebarProps {
  activeChannel?: string;
  onSelectChannel?: (channel: string) => void;
  className?: string;
}

export function MeetingsSidebar({
  activeChannel = "voice-agent",
  onSelectChannel,
  className = "",
}: MeetingsSidebarProps) {
  return (
    <aside
      className={`${styles["meetings-sidebar"]} ${className}`}
      aria-label="Meetings navigation"
    >
      <nav className={styles["meetings-sidebar__nav"]}>
        <button
          type="button"
          className={`${styles["meetings-sidebar__item"]} ${
            activeChannel === "my-meetings" ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectChannel?.("my-meetings")}
        >
          <Hash size={16} />
          <span>My Meetings</span>
        </button>

        <button
          type="button"
          className={`${styles["meetings-sidebar__item"]} ${
            activeChannel === "all-meetings" ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectChannel?.("all-meetings")}
        >
          <CalendarCheck size={16} />
          <span>All Meetings</span>
        </button>

        <button
          type="button"
          className={`${styles["meetings-sidebar__item"]} ${styles["meetings-sidebar__item--agent"]} ${
            activeChannel === "voice-agent" ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectChannel?.("voice-agent")}
        >
          <Robot size={16} weight="fill" />
          <span>Voice Agent Meetings</span>
        </button>

        <button
          type="button"
          className={`${styles["meetings-sidebar__item"]} ${
            activeChannel === "uploads" ? styles["is-active"] : ""
          }`}
          onClick={() => onSelectChannel?.("uploads")}
        >
          <UploadSimple size={16} />
          <span>Uploads</span>
          <span className={styles["badge-new"]}>NEW</span>
        </button>
      </nav>

      <div className={styles["meetings-sidebar__channels-section"]}>
        <div className={styles["channels-header"]}>
          <span className={styles["channels-header__title"]}>All channels</span>
        </div>

        <div className={styles["channels-empty-card"]}>
          <div className={styles["channels-empty-card__icon"]}>
            <Hash size={18} />
          </div>
          <p className={styles["channels-empty-card__text"]}>
            Create channels to organize your conversations
          </p>
          <button
            type="button"
            className={styles["channels-add-btn"]}
            onClick={() => onSelectChannel?.("create-channel")}
          >
            <Plus size={14} />
            <span>Channel</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

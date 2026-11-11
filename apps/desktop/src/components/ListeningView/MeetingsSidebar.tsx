import {
  CalendarCheck,
  Record,
  Gear,
  Ear,
  SidebarSimple,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";
import styles from "./ListeningView.module.scss";

export interface MeetingsSidebarProps {
  activeChannel?: "all-meetings" | "record";
  onSelectChannel?: (channel: "all-meetings" | "record") => void;
  onOpenSettings?: () => void;
  className?: string;
  onToggleSidebar?: () => void;
  inAppSidebar?: boolean;
}

export function MeetingsSidebar({
  activeChannel = "all-meetings",
  onSelectChannel,
  onOpenSettings,
  className = "",
  onToggleSidebar,
  inAppSidebar = false,
}: MeetingsSidebarProps) {
  return (
    <aside
      className={`${styles["meetings-sidebar"]} ${
        inAppSidebar ? styles["meetings-sidebar--in-app-sidebar"] : ""
      } ${className}`}
      aria-label="Meetings navigation"
      data-testid="meetings-sidebar"
    >
      {!inAppSidebar && (
        <div className={styles["meetings-sidebar__header-bar"]}>
          <div className={styles["meetings-sidebar__header-title-group"]}>
            <Ear size={16} weight="bold" />
            <span className={styles["meetings-sidebar__header-heading"]}>Meetings</span>
          </div>
          {onToggleSidebar && (
            <Tooltip content="Collapse sidebar" contentProps={{ side: "bottom" }}>
              <button
                type="button"
                className={styles["meetings-sidebar__toggle-btn"]}
                onClick={onToggleSidebar}
                aria-label="Collapse sidebar"
              >
                <SidebarSimple size={18} weight="regular" />
              </button>
            </Tooltip>
          )}
        </div>
      )}

      <div className={styles["meetings-sidebar__scroll"]}>
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
      </div>
    </aside>
  );
}

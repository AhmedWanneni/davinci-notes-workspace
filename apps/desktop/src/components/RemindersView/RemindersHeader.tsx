import React from "react";
import {
  MagnifyingGlass, Plus, Gear, Bell, PaperPlaneRight,
} from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import styles from "./RemindersView.module.scss";

export type RemindersTabId = "reminders" | "scheduled";

export interface RemindersHeaderProps {
  activeTab: RemindersTabId;
  onTabChange: (tab: RemindersTabId) => void;
  remindersCount: number;
  scheduledCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onNewReminder: () => void;
  onNewScheduledMessage: () => void;
  onOpenSettings: () => void;
}

export function RemindersHeader({
  activeTab,
  onTabChange,
  remindersCount,
  scheduledCount,
  searchQuery,
  onSearchChange,
  searchInputRef,
  onNewReminder,
  onNewScheduledMessage,
  onOpenSettings,
}: RemindersHeaderProps) {
  return (
    <header className={styles["reminders-header"]}>
      <div className={styles["reminders-header__top"]}>
        <div className={styles["reminders-header__title-group"]}>
          <div className={styles["reminders-header__tabs"]}>
            <button
              type="button"
              className={`${styles["reminders-header__tab"]} ${
                activeTab === "reminders" ? styles["reminders-header__tab--active"] : ""
              }`}
              onClick={() => onTabChange("reminders")}
            >
              <Bell size={16} weight={activeTab === "reminders" ? "fill" : "regular"} />
              <span>Reminders</span>
              <span className={styles["reminders-header__badge"]}>{remindersCount}</span>
            </button>

            <button
              type="button"
              className={`${styles["reminders-header__tab"]} ${
                activeTab === "scheduled" ? styles["reminders-header__tab--active"] : ""
              }`}
              onClick={() => onTabChange("scheduled")}
            >
              <PaperPlaneRight
                size={16}
                weight={activeTab === "scheduled" ? "fill" : "regular"}
              />
              <span>Scheduled Messages</span>
              <span className={styles["reminders-header__badge"]}>{scheduledCount}</span>
            </button>
          </div>
        </div>

        <div className={styles["reminders-header__actions"]}>
          {activeTab === "reminders" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onNewReminder}
              aria-label="Add a reminder"
            >
              <Plus size={14} weight="bold" />
              <span>Add a reminder</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onNewScheduledMessage}
              aria-label="Schedule message"
            >
              <Plus size={14} weight="bold" />
              <span>Schedule Message</span>
            </Button>
          )}

          <button
            type="button"
            className={styles["btn--icon"]}
            onClick={onOpenSettings}
            title="Notification Settings"
            aria-label="Notification Settings"
          >
            <Gear size={16} />
          </button>
        </div>
      </div>

      <div className={styles["reminders-header__toolbar"]}>
        <div className={styles["reminders-header__search"]}>
          <MagnifyingGlass size={15} className={styles["reminders-header__search-icon"]} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles["reminders-header__search-input"]}
            placeholder={
              activeTab === "reminders"
                ? "Filter reminders by text or note... (/ to focus)"
                : "Filter messages by text or recipient..."
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}

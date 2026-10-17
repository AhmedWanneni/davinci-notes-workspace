import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@app/design-system";
import {
  Bell,
  WarningCircle,
  CalendarCheck,
  CalendarPlus,
} from "@phosphor-icons/react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { getVaultIndexDb } from "../../vault/sqliteIndex";
import {
  queryRemindersForView,
  type ReminderViewItem,
  type RemindersViewResult,
} from "../../vault/remindersViewQueries";
import {
  computeSnoozeTime,
  snoozeReminderAction,
  type SnoozePreset,
} from "../../vault/reminderSnoozeActions";
import { markReminderDoneInVault } from "../../vault/reminderTaskActions";
import { RemindersList } from "./RemindersList";
import styles from "./RemindersDialog.module.scss";

export interface RemindersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNote: (notePath: string, line?: number) => void;
}

type TabKey = "missed" | "today" | "upcoming" | "all";

export function RemindersDialog({
  isOpen,
  onOpenChange,
  onSelectNote,
}: RemindersDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [data, setData] = useState<RemindersViewResult>({
    missed: [],
    today: [],
    upcoming: [],
    all: [],
  });
  const [loading, setLoading] = useState(false);

  const vaultUpdateCounter = useWorkspaceStore(
    (state) => state.vaultUpdateCounter,
  );

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      const db = await getVaultIndexDb();
      const result = await queryRemindersForView(db, new Date());
      setData(result);
    } catch (err) {
      console.error("Failed to load reminders for view:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadReminders();
    }
  }, [isOpen, vaultUpdateCounter, loadReminders]);

  const handleToggleDone = useCallback(
    async (item: ReminderViewItem, done: boolean) => {
      await markReminderDoneInVault(
        item.notePath,
        { line: item.line, text: item.text, dueAtUtc: item.dueAtUtc },
        done,
      );
      void loadReminders();
    },
    [loadReminders],
  );

  const handleSnooze = useCallback(
    async (item: ReminderViewItem, preset: SnoozePreset) => {
      const targetTime = computeSnoozeTime(preset);
      await snoozeReminderAction(
        {
          reminderKey: item.reminderKey,
          notePath: item.notePath,
          dueAtUtc: item.dueAtUtc,
          text: item.text,
        },
        targetTime,
      );
      void loadReminders();
    },
    [loadReminders],
  );

  const handleNavigate = useCallback(
    (notePath: string, line: number) => {
      onSelectNote(notePath, line);
      onOpenChange(false);
    },
    [onSelectNote, onOpenChange],
  );

  const currentItems =
    activeTab === "all"
      ? data.all
      : activeTab === "missed"
        ? data.missed
        : activeTab === "today"
          ? data.today
          : data.upcoming;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={styles.dialog}
        title="Reminders"
        showCloseButton={true}
      >
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "missed"}
            className={`${styles.tab} ${
              data.missed.length > 0 ? styles["tab--has-missed"] : ""
            } ${activeTab === "missed" ? styles["tab--active"] : ""}`}
            onClick={() => setActiveTab("missed")}
          >
            <WarningCircle size={14} />
            <span>Overdue</span>
            <span className={styles.badge}>{data.missed.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "today"}
            className={`${styles.tab} ${
              activeTab === "today" ? styles["tab--active"] : ""
            }`}
            onClick={() => setActiveTab("today")}
          >
            <CalendarCheck size={14} />
            <span>Today</span>
            <span className={styles.badge}>{data.today.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upcoming"}
            className={`${styles.tab} ${
              activeTab === "upcoming" ? styles["tab--active"] : ""
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            <CalendarPlus size={14} />
            <span>Upcoming</span>
            <span className={styles.badge}>{data.upcoming.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`${styles.tab} ${
              activeTab === "all" ? styles["tab--active"] : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            <Bell size={14} />
            <span>All</span>
            <span className={styles.badge}>{data.all.length}</span>
          </button>
        </div>

        <div className={styles.content}>
          {loading && data.all.length === 0 ? (
            <div className={styles.empty}>Loading reminders...</div>
          ) : (
            <RemindersList
              items={currentItems}
              onNavigate={handleNavigate}
              onToggleDone={handleToggleDone}
              onSnooze={handleSnooze}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

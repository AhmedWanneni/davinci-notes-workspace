import React, { useEffect, useState, useCallback, useMemo } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogContent } from "@app/design-system";
import {
  Bell,
  WarningCircle,
  CalendarCheck,
  CalendarPlus,
  Plus,
  X,
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
import { AddReminderForm } from "./AddReminderForm";
import styles from "./RemindersDialog.module.scss";

export interface RemindersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNote: (notePath: string, line?: number) => void;
}

type TabKey = "missed" | "today" | "upcoming" | "all";

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}> = [
  { key: "missed", label: "Overdue", icon: WarningCircle },
  { key: "today", label: "Today", icon: CalendarCheck },
  { key: "upcoming", label: "Upcoming", icon: CalendarPlus },
  { key: "all", label: "All", icon: Bell },
];

export function RemindersDialog({
  isOpen,
  onOpenChange,
  onSelectNote,
}: RemindersDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [isAdding, setIsAdding] = useState(false);
  const [data, setData] = useState<RemindersViewResult>({
    missed: [],
    today: [],
    upcoming: [],
    done: [],
    all: [],
  });
  const [loading, setLoading] = useState(false);

  const activePath = useWorkspaceStore((state) => state.activePath);
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

  const currentItems = data[activeTab] ?? [];

  const footerSummary = useMemo(() => {
    const count = currentItems.length;
    if (activeTab === "missed") return `${count} overdue`;
    if (activeTab === "today") return `${count} due today`;
    if (activeTab === "upcoming") return `${count} upcoming`;
    return `${count} total reminders`;
  }, [activeTab, currentItems.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog} showCloseButton={false}>
        <DialogPrimitive.Title className={styles["dialog-title-accessible"]}>
          Reminders
        </DialogPrimitive.Title>

        <div className={styles.header}>
          <div className={styles["header-left"]}>
            <span className={styles["header-icon-wrap"]}>
              <Bell size={16} weight="bold" />
            </span>
            <h2 className={styles["header-title"]}>Reminders</h2>
            <span className={styles["header-count"]}>{data.all.length}</span>
          </div>
          <div className={styles["header-right"]}>
            <button
              type="button"
              className={styles["header-add-btn"]}
              onClick={() => setIsAdding((prev) => !prev)}
              aria-label="Add a reminder"
            >
              <Plus size={12} weight="bold" />
              <span>Add a reminder</span>
            </button>
            <button
              type="button"
              className={styles["header-close"]}
              onClick={() => onOpenChange(false)}
              aria-label="Close reminders dialog"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {isAdding && (
          <AddReminderForm
            onAdded={() => {
              setIsAdding(false);
              void loadReminders();
            }}
            onCancel={() => setIsAdding(false)}
            defaultNotePath={activePath}
          />
        )}

        <div className={styles.tabs} role="tablist">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`${styles.tab} ${
                key === "missed" && data.missed.length > 0
                  ? styles["tab--has-missed"]
                  : ""
              } ${activeTab === key ? styles["tab--active"] : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={14} />
              <span>{label}</span>
              <span className={styles.badge}>{data[key].length}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {loading && data.all.length === 0 ? (
            <div className={styles.loading}>Loading reminders...</div>
          ) : (
            <RemindersList
              items={currentItems}
              onNavigate={handleNavigate}
              onToggleDone={handleToggleDone}
              onSnooze={handleSnooze}
            />
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles["footer-summary"]}>{footerSummary}</div>
          <div className={styles["footer-hints"]}>
            <kbd className={styles.kbd}>Esc</kbd> to close
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

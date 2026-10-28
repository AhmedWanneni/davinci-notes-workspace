import React, { useState } from "react";
import { CaretDown, CaretRight, CheckCircle, Warning } from "@phosphor-icons/react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import { ReminderRow } from "./ReminderRow";
import styles from "./RemindersView.module.scss";

export interface RemindersSubViewProps {
  items: readonly ReminderViewItem[];
  selectedIndex: number;
  searchQuery: string;
  onNavigate: (notePath: string, line: number) => void;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
  onEdit: (item: ReminderViewItem) => void;
  onDelete: (item: ReminderViewItem) => void;
  onNewReminder: () => void;
}

export function RemindersSubView({
  items,
  selectedIndex,
  searchQuery,
  onNavigate,
  onToggleDone,
  onSnooze,
  onEdit,
  onDelete,
  onNewReminder,
}: RemindersSubViewProps) {
  const [doneExpanded, setDoneExpanded] = useState(false);

  const overdue = items.filter((i) => i.category === "missed" && !i.done);
  const today = items.filter((i) => i.category === "today" && !i.done);
  const upcoming = items.filter((i) => i.category === "upcoming" && !i.done);
  const done = items.filter((i) => i.done);

  if (items.length === 0) {
    return (
      <div className={styles["reminders-empty"]}>
        {searchQuery ? (
          <>
            <p className={styles["reminders-empty__title"]}>No reminders matching &ldquo;{searchQuery}&rdquo;</p>
            <p className={styles["reminders-empty__sub"]}>Try a different keyword or clear the search filter.</p>
          </>
        ) : (
          <>
            <CheckCircle size={40} className={styles["reminders-empty__icon"]} />
            <p className={styles["reminders-empty__title"]}>No reminders yet</p>
            <p className={styles["reminders-empty__sub"]}>
              Add one with the button above or write <code>- [ ] Task (@YYYY-MM-DD)</code> in any markdown note.
            </p>
            <button type="button" className={styles["btn--primary"]} onClick={onNewReminder}>
              Add Reminder
            </button>
          </>
        )}
      </div>
    );
  }

  // Flat array order for keyboard navigation indexing
  const flatItems = [...overdue, ...today, ...upcoming, ...(doneExpanded ? done : [])];

  const renderGroup = (
    title: string,
    groupItems: ReminderViewItem[],
    iconVariant?: "overdue",
  ) => {
    if (groupItems.length === 0) return null;
    return (
      <div className={styles["reminders-group"]}>
        <div className={styles["reminders-group__header"]}>
          {iconVariant === "overdue" && (
            <Warning size={14} className={styles["reminders-group__overdue-icon"]} />
          )}
          <span className={styles["reminders-group__title"]}>{title}</span>
          <span className={styles["reminders-group__count"]}>{groupItems.length}</span>
        </div>
        <div className={styles["reminders-group__list"]}>
          {groupItems.map((item) => {
            const isSelected = flatItems[selectedIndex]?.reminderKey === item.reminderKey;
            return (
              <ReminderRow
                key={item.reminderKey}
                item={item}
                isSelected={isSelected}
                onNavigate={onNavigate}
                onToggleDone={onToggleDone}
                onSnooze={onSnooze}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles["reminders-subview"]}>
      {renderGroup("Overdue", overdue, "overdue")}
      {renderGroup("Today", today)}
      {renderGroup("Upcoming", upcoming)}

      {done.length > 0 && (
        <div className={styles["reminders-group"]}>
          <button
            type="button"
            className={styles["reminders-group__toggle-btn"]}
            onClick={() => setDoneExpanded(!doneExpanded)}
          >
            {doneExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
            <span className={styles["reminders-group__title"]}>Completed</span>
            <span className={styles["reminders-group__count"]}>{done.length}</span>
          </button>
          {doneExpanded && (
            <div className={styles["reminders-group__list"]}>
              {done.map((item) => {
                const isSelected = flatItems[selectedIndex]?.reminderKey === item.reminderKey;
                return (
                  <ReminderRow
                    key={item.reminderKey}
                    item={item}
                    isSelected={isSelected}
                    onNavigate={onNavigate}
                    onToggleDone={onToggleDone}
                    onSnooze={onSnooze}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

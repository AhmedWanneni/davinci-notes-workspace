import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckCircle } from "@phosphor-icons/react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import { ReminderRowItem } from "./ReminderRowItem";
import styles from "./RemindersList.module.scss";

export interface RemindersListProps {
  items: ReminderViewItem[];
  onNavigate: (notePath: string, line: number) => void;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
}

const ROW_HEIGHT = 64;

export function RemindersList({
  items,
  onNavigate,
  onToggleDone,
  onSnooze,
}: RemindersListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    initialRect: { width: 640, height: 420 },
  });

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles["empty-icon"]}>
          <CheckCircle size={32} weight="light" />
        </div>
        <h3 className={styles["empty-title"]}>
          No reminders in this section.
        </h3>
        <p className={styles["empty-desc"]}>
          You&apos;re all caught up. Reminders scheduled for this view will appear
          here.
        </p>
      </div>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const displayRows =
    virtualRows.length > 0
      ? virtualRows.map((v) => ({
          item: items[v.index],
          start: v.start,
        }))
      : items.map((item, idx) => ({
          item,
          start: idx * ROW_HEIGHT,
        }));

  return (
    <div ref={parentRef} className={styles["virtual-list"]}>
      <div
        className={styles["virtual-inner"]}
        style={{
          height: `${rowVirtualizer.getTotalSize() || items.length * ROW_HEIGHT}px`,
        }}
      >
        {displayRows.map(({ item, start }) => (
          <div
            key={item.reminderKey}
            className={styles["virtual-row"]}
            style={{
              transform: `translateY(${start}px)`,
            }}
          >
            <ReminderRowItem
              item={item}
              onNavigate={onNavigate}
              onToggleDone={onToggleDone}
              onSnooze={onSnooze}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

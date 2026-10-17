import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import { ReminderRowItem } from "./ReminderRowItem";
import styles from "./RemindersDialog.module.scss";

export interface RemindersListProps {
  items: ReminderViewItem[];
  onNavigate: (notePath: string, line: number) => void;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
}

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
    estimateSize: () => 58,
    overscan: 5,
    initialRect: { width: 600, height: 400 },
  });

  if (items.length === 0) {
    return <div className={styles.empty}>No reminders in this section.</div>;
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
          start: idx * 58,
        }));

  return (
    <div ref={parentRef} className={styles["virtual-list"]}>
      <div
        className={styles["virtual-inner"]}
        style={{
          height: `${rowVirtualizer.getTotalSize() || items.length * 58}px`,
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

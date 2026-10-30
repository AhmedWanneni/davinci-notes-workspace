import { useEffect, useState } from "react";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";

export interface UseReminderKeyboardNavOptions {
  items: readonly ReminderViewItem[];
  enabled?: boolean;
  onNavigate: (notePath: string, line: number) => void;
  onToggleDone: (item: ReminderViewItem, done: boolean) => void;
  onSnooze: (item: ReminderViewItem, preset: SnoozePreset) => void;
  onNewReminder: () => void;
  onFocusSearch: () => void;
}

export function useReminderKeyboardNav({
  items,
  enabled = true,
  onNavigate,
  onToggleDone,
  onSnooze,
  onNewReminder,
  onFocusSearch,
}: UseReminderKeyboardNavOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input/textarea/select
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((idx) => Math.min(items.length - 1, idx + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[selectedIndex];
        if (item) onNavigate(item.notePath, item.line);
      } else if (e.key === "x") {
        e.preventDefault();
        const item = items[selectedIndex];
        if (item) onToggleDone(item, !item.done);
      } else if (e.key === "s") {
        e.preventDefault();
        const item = items[selectedIndex];
        if (item && !item.done) onSnooze(item, "1h");
      } else if (e.key === "n") {
        e.preventDefault();
        onNewReminder();
      } else if (e.key === "/") {
        e.preventDefault();
        onFocusSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, items, selectedIndex, onNavigate, onToggleDone, onSnooze, onNewReminder, onFocusSearch]);

  return { selectedIndex, setSelectedIndex };
}

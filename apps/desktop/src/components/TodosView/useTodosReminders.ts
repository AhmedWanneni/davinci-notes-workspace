import { useState, useMemo } from "react";
import { useRemindersViewData } from "../RemindersView/useRemindersViewData";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { ReminderFilter, ScheduledFilter } from "./types";

export function useTodosReminders() {
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>("all");
  const [scheduledFilter, setScheduledFilter] = useState<ScheduledFilter>("all");
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderViewItem | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const {
    reminders,
    scheduledMessages,
    handleToggleDone,
    handleSnooze,
    handleDeleteReminder,
    handleSaveReminder,
    handleSaveScheduled,
    handleCancelScheduled,
    handleSendNowScheduled,
  } = useRemindersViewData();

  const remindersCounts = useMemo(() => {
    const overdue = reminders.filter((r) => r.category === "missed" && !r.done).length;
    const today = reminders.filter((r) => r.category === "today" && !r.done).length;
    const upcoming = reminders.filter((r) => r.category === "upcoming" && !r.done).length;
    const completed = reminders.filter((r) => r.done).length;
    return { all: reminders.length, overdue, today, upcoming, completed };
  }, [reminders]);

  const scheduledCounts = useMemo(() => {
    const scheduled = scheduledMessages.filter((s) => s.status === "scheduled").length;
    const needsSend = scheduledMessages.filter((s) => s.status === "needs_manual_send").length;
    const missed = scheduledMessages.filter((s) => s.status === "missed" || s.status === "failed").length;
    const sent = scheduledMessages.filter((s) => s.status === "sent").length;
    return { all: scheduledMessages.length, scheduled, needsSend, missed, sent };
  }, [scheduledMessages]);

  const handleQuickAddReminder = async (text: string, date: string, notePath: string) => {
    await handleSaveReminder(
      { text, date, time: "09:00", notePath, channels: ["desktop"] },
      null,
    );
  };

  return {
    reminders,
    scheduledMessages,
    reminderFilter,
    setReminderFilter,
    scheduledFilter,
    setScheduledFilter,
    isReminderModalOpen,
    setIsReminderModalOpen,
    editingReminder,
    setEditingReminder,
    isComposerOpen,
    setIsComposerOpen,
    remindersCounts,
    scheduledCounts,
    handleToggleDone,
    handleSnooze,
    handleDeleteReminder,
    handleSaveReminder,
    handleSaveScheduled,
    handleCancelScheduled,
    handleSendNowScheduled,
    handleQuickAddReminder,
  };
}

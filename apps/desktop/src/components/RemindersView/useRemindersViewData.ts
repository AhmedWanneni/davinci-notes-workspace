import { useState, useEffect, useCallback } from "react";
import {
  queryRemindersForView,
  upsertReminderChannelState,
  type ReminderViewItem,
} from "../../vault/remindersViewQueries";
import {
  snoozeReminderAction,
  computeSnoozeTime,
  type SnoozePreset,
} from "../../vault/reminderSnoozeActions";
import {
  markReminderDoneInVault,
  deleteReminderInVault,
  editReminderInVault,
  addReminderToVaultNote,
} from "../../vault/reminderTaskActions";
import {
  listScheduledMessages,
  createScheduledMessage,
  cancelScheduledMessage,
  markScheduledMessageSent,
  markScheduledMessageFailed,
  type ScheduledMessageRecord,
  type CreateScheduledMessageInput,
} from "../../reminders/scheduledMessagesStore";
import { notify } from "../../notifications/notifyDispatcher";
import type { ReminderFormData } from "./ReminderFormModal";

export function useRemindersViewData() {
  const [reminders, setReminders] = useState<ReminderViewItem[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessageRecord[]>([]);

  const loadData = useCallback(async () => {
    try {
      const res = await queryRemindersForView();
      setReminders(res.all);
    } catch {
      // Indexer not ready or non-tauri env
    }
    try {
      const msgs = await listScheduledMessages();
      setScheduledMessages(msgs);
    } catch {
      // Table not ready or non-tauri env
    }
  }, []);

  useEffect(() => {
    void loadData();
    const handleUpdate = () => void loadData();
    window.addEventListener("davinci-reminders-updated", handleUpdate);
    window.addEventListener("davinci-reminders-due", handleUpdate);
    window.addEventListener("davinci-scheduled-messages-updated", handleUpdate);
    return () => {
      window.removeEventListener("davinci-reminders-updated", handleUpdate);
      window.removeEventListener("davinci-reminders-due", handleUpdate);
      window.removeEventListener("davinci-scheduled-messages-updated", handleUpdate);
    };
  }, [loadData]);

  const handleToggleDone = async (item: ReminderViewItem, done: boolean) => {
    await markReminderDoneInVault(item.notePath, { line: item.line, text: item.text }, done);
    window.dispatchEvent(new Event("davinci-reminders-updated"));
    void loadData();
  };

  const handleSnooze = async (item: ReminderViewItem, preset: SnoozePreset) => {
    const snoozeUntilUtc = computeSnoozeTime(preset);
    await snoozeReminderAction(
      {
        reminderKey: item.reminderKey,
        notePath: item.notePath,
        dueAtUtc: item.dueAtUtc,
        text: item.text,
      },
      snoozeUntilUtc,
    );
    window.dispatchEvent(new Event("davinci-reminders-updated"));
    void loadData();
  };

  const handleDeleteReminder = async (item: ReminderViewItem) => {
    await deleteReminderInVault(item.notePath, { line: item.line, text: item.text });
    window.dispatchEvent(new Event("davinci-reminders-updated"));
    void loadData();
  };

  const handleSaveReminder = async (
    data: ReminderFormData,
    editingReminder: ReminderViewItem | null,
  ) => {
    const timeToken = data.time ? ` ${data.time}` : "";
    const recToken = data.recurrence ? ` /${data.recurrence}` : "";
    const dueToken = `@${data.date}${timeToken}${recToken}`;

    if (editingReminder) {
      await editReminderInVault(
        editingReminder.notePath,
        { line: editingReminder.line, text: editingReminder.text },
        { text: data.text, dueToken },
      );
      await upsertReminderChannelState(null, {
        reminderKey: editingReminder.reminderKey,
        notePath: editingReminder.notePath,
        dueAtUtc: editingReminder.dueAtUtc,
        text: data.text,
        channels: data.channels,
      }).catch(() => {});
    } else {
      await addReminderToVaultNote(data.notePath, { text: data.text, dueToken });
    }
    window.dispatchEvent(new Event("davinci-reminders-updated"));
    void loadData();
  };

  const handleSaveScheduled = async (input: CreateScheduledMessageInput) => {
    await createScheduledMessage(input);
    window.dispatchEvent(new Event("davinci-scheduled-messages-updated"));
    void loadData();
  };

  const handleCancelScheduled = async (id: string) => {
    await cancelScheduledMessage(id);
    window.dispatchEvent(new Event("davinci-scheduled-messages-updated"));
    void loadData();
  };

  const handleSendNowScheduled = async (item: ScheduledMessageRecord) => {
    const result = await notify(item.channelKind, {
      title: "Scheduled Message",
      body: item.messageText,
      recipient: item.recipientLabel,
      allowChannelMentions: item.allowMentions,
    });
    if (result.ok || result.success) {
      await markScheduledMessageSent(item.id);
    } else {
      await markScheduledMessageFailed(item.id, result.error ?? "Failed to send");
    }
    window.dispatchEvent(new Event("davinci-scheduled-messages-updated"));
    void loadData();
  };

  return {
    reminders,
    scheduledMessages,
    loadData,
    handleToggleDone,
    handleSnooze,
    handleDeleteReminder,
    handleSaveReminder,
    handleSaveScheduled,
    handleCancelScheduled,
    handleSendNowScheduled,
  };
}

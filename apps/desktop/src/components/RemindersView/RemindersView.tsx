import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import {
  queryRemindersForView, upsertReminderChannelState, type ReminderViewItem,
} from "../../vault/remindersViewQueries";
import {
  snoozeReminderAction, computeSnoozeTime, type SnoozePreset,
} from "../../vault/reminderSnoozeActions";
import {
  markReminderDoneInVault, deleteReminderInVault,
  editReminderInVault, addReminderToVaultNote,
} from "../../vault/reminderTaskActions";
import {
  listScheduledMessages, createScheduledMessage, cancelScheduledMessage,
  markScheduledMessageSent, markScheduledMessageFailed,
  type ScheduledMessageRecord, type CreateScheduledMessageInput,
} from "../../reminders/scheduledMessagesStore";
import { notify } from "../../notifications/notifyDispatcher";
import type { DeliveryChannel } from "../../notifications/channelTypes";
import { RemindersHeader, type RemindersTabId } from "./RemindersHeader";
import { RemindersSubView } from "./RemindersSubView";
import { ScheduledMessagesSubView } from "./ScheduledMessagesSubView";
import { ReminderFormModal, type ReminderFormData } from "./ReminderFormModal";
import { ScheduledMessageComposerModal } from "./ScheduledMessageComposerModal";
import { useReminderKeyboardNav } from "./useReminderKeyboardNav";
import styles from "./RemindersView.module.scss";

export interface RemindersViewProps {
  onOpenNote: (path: string, line?: number) => void;
  onOpenSettings: () => void;
}

export function RemindersView({ onOpenNote, onOpenSettings }: RemindersViewProps) {
  const [activeTab, setActiveTab] = useState<RemindersTabId>("reminders");
  const [reminders, setReminders] = useState<ReminderViewItem[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderViewItem | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allNotePaths = useWorkspaceStore((s) => s.allNotePaths);

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

  const handleSaveReminder = async (data: ReminderFormData) => {
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

  const filteredReminders = reminders.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.text.toLowerCase().includes(q) || r.notePath.toLowerCase().includes(q);
  });

  const { selectedIndex } = useReminderKeyboardNav({
    items: filteredReminders,
    enabled: activeTab === "reminders" && !isReminderModalOpen && !isComposerOpen,
    onNavigate: (path, line) => onOpenNote(path, line),
    onToggleDone: handleToggleDone,
    onSnooze: handleSnooze,
    onNewReminder: () => {
      setEditingReminder(null);
      setIsReminderModalOpen(true);
    },
    onFocusSearch: () => searchInputRef.current?.focus(),
  });

  return (
    <div className={styles["reminders-view"]}>
      <RemindersHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        remindersCount={reminders.filter((r) => !r.done).length}
        scheduledCount={scheduledMessages.filter((s) => s.status === "scheduled").length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        onNewReminder={() => {
          setEditingReminder(null);
          setIsReminderModalOpen(true);
        }}
        onNewScheduledMessage={() => setIsComposerOpen(true)}
        onOpenSettings={onOpenSettings}
      />

      {activeTab === "reminders" ? (
        <RemindersSubView
          items={filteredReminders}
          selectedIndex={selectedIndex}
          searchQuery={searchQuery}
          onNavigate={(path, line) => onOpenNote(path, line)}
          onToggleDone={handleToggleDone}
          onSnooze={handleSnooze}
          onEdit={(item) => {
            setEditingReminder(item);
            setIsReminderModalOpen(true);
          }}
          onDelete={handleDeleteReminder}
          onNewReminder={() => {
            setEditingReminder(null);
            setIsReminderModalOpen(true);
          }}
        />
      ) : (
        <ScheduledMessagesSubView
          items={scheduledMessages}
          searchQuery={searchQuery}
          onSendNow={handleSendNowScheduled}
          onCancel={handleCancelScheduled}
          onEdit={() => {}}
          onNewMessage={() => setIsComposerOpen(true)}
        />
      )}

      <ReminderFormModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        availableNotes={allNotePaths}
        initialData={
          editingReminder
            ? {
                notePath: editingReminder.notePath,
                text: editingReminder.text,
                date: editingReminder.dueAtUtc.slice(0, 10),
                time: editingReminder.dueAtUtc.slice(11, 16),
                channels: (editingReminder.channels as DeliveryChannel[]) ?? ["desktop"],
              }
            : null
        }
      />

      <ScheduledMessageComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSave={handleSaveScheduled}
      />
    </div>
  );
}

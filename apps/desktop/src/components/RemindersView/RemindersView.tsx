import React, { useState, useRef, useMemo } from "react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { DeliveryChannel } from "../../notifications/channelTypes";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import { AddReminderForm } from "../RemindersDialog";
import { RemindersHeader, type RemindersTabId } from "./RemindersHeader";
import { RemindersSubView } from "./RemindersSubView";
import { ScheduledMessagesSubView } from "./ScheduledMessagesSubView";
import { ReminderFormModal, type ReminderFormData } from "./ReminderFormModal";
import { ScheduledMessageComposerModal } from "./ScheduledMessageComposerModal";
import { useReminderKeyboardNav } from "./useReminderKeyboardNav";
import { useRemindersViewData } from "./useRemindersViewData";
import styles from "./RemindersView.module.scss";

export interface RemindersViewProps {
  onOpenNote: (path: string, line?: number) => void;
  onOpenSettings: () => void;
}

export function RemindersView({ onOpenNote, onOpenSettings }: RemindersViewProps) {
  const [activeTab, setActiveTab] = useState<RemindersTabId>("reminders");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderViewItem | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allNotePaths = useWorkspaceStore((s) => s.allNotePaths);
  const openNotes = useWorkspaceStore((s) => s.openNotes);

  const defaultTargetNote = useMemo(() => {
    return (
      openNotes.find((p) => !p.startsWith("davinci://")) ??
      allNotePaths[0] ??
      "Reminders.md"
    );
  }, [openNotes, allNotePaths]);

  const {
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
  } = useRemindersViewData();

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
    onNewReminder: () => setIsAdding(true),
    onFocusSearch: () => searchInputRef.current?.focus(),
  });

  const handleModalSave = async (data: ReminderFormData) => {
    await handleSaveReminder(data, editingReminder);
  };

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
        onNewReminder={() => setIsAdding((prev) => !prev)}
        onNewScheduledMessage={() => setIsComposerOpen(true)}
        onOpenSettings={onOpenSettings}
      />

      {activeTab === "reminders" && isAdding && (
        <AddReminderForm
          onAdded={() => {
            setIsAdding(false);
            window.dispatchEvent(new Event("davinci-reminders-updated"));
            void loadData();
          }}
          onCancel={() => setIsAdding(false)}
          defaultNotePath={defaultTargetNote}
        />
      )}

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
          onNewReminder={() => setIsAdding(true)}
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
        onSave={handleModalSave}
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

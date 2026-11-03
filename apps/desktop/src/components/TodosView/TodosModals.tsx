import type { JSX } from "react";
import { TodoFocusView } from "./TodoFocusView";
import { ReminderFormModal, type ReminderFormData } from "../RemindersView/ReminderFormModal";
import { ScheduledMessageComposerModal } from "../RemindersView/ScheduledMessageComposerModal";
import type { CreateScheduledMessageInput } from "../../reminders/scheduledMessagesStore";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { DeliveryChannel } from "../../notifications/channelTypes";
import type { TodoItem, TodoProject, TodoSection } from "./types";

export interface TodosModalsProps {
  isFocusMode: boolean;
  onCloseFocus: () => void;
  activeProject: TodoProject | null;
  focusSections: TodoSection[];
  onToggleTodo: (todo: TodoItem) => void;
  onAddTodoToSection: (sectionName: string, text: string) => void;
  isReminderModalOpen: boolean;
  onCloseReminderModal: () => void;
  onSaveReminder: (data: ReminderFormData) => Promise<void>;
  editingReminder: ReminderViewItem | null;
  allNotePaths: readonly string[];
  isComposerOpen: boolean;
  onCloseComposer: () => void;
  onSaveScheduled: (data: CreateScheduledMessageInput) => Promise<void>;
}

export function TodosModals({
  isFocusMode,
  onCloseFocus,
  activeProject,
  focusSections,
  onToggleTodo,
  onAddTodoToSection,
  isReminderModalOpen,
  onCloseReminderModal,
  onSaveReminder,
  editingReminder,
  allNotePaths,
  isComposerOpen,
  onCloseComposer,
  onSaveScheduled,
}: TodosModalsProps): JSX.Element {
  return (
    <>
      {isFocusMode && (
        <TodoFocusView
          project={activeProject}
          sections={focusSections}
          onClose={onCloseFocus}
          onToggleTodo={onToggleTodo}
          onAddTodo={onAddTodoToSection}
        />
      )}

      <ReminderFormModal
        isOpen={isReminderModalOpen}
        onClose={onCloseReminderModal}
        onSave={onSaveReminder}
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
        onClose={onCloseComposer}
        onSave={onSaveScheduled}
      />
    </>
  );
}

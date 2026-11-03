import type { JSX } from "react";
import { TodosMotherboard } from "./TodosMotherboard";
import { TodosProjectContent } from "./TodosProjectContent";
import { TodosRemindersContent } from "./TodosRemindersContent";
import { TodosScheduledContent } from "./TodosScheduledContent";
import type { DeliveryChannel } from "../../notifications/channelTypes";
import type { ReminderViewItem } from "../../vault/remindersViewQueries";
import type { SnoozePreset } from "../../vault/reminderSnoozeActions";
import type { ScheduledMessageRecord } from "../../reminders/scheduledMessagesStore";
import type { MotherboardLayout, ReminderFilter, ScheduledFilter, TodoItem, TodoProject, TodoSection, TodoViewMode } from "./types";

export interface TodosMainContentProps {
  viewMode: TodoViewMode;
  reminders: readonly ReminderViewItem[];
  scheduledMessages: readonly ScheduledMessageRecord[];
  searchQuery: string;
  reminderFilter: ReminderFilter;
  scheduledFilter: ScheduledFilter;
  filteredAllTodos: TodoItem[];
  motherboardLayout: MotherboardLayout;
  activeProject: TodoProject | null;
  filteredSections: TodoSection[];
  allNotePaths: string[];
  currentNotePath: string;
  onToggleTodo: (todo: TodoItem) => void;
  onUpdateText: (todo: TodoItem, newText: string) => void;
  onAddLink: (todo: TodoItem, noteName: string) => void;
  onAddReminder: (todo: TodoItem, dateStr: string) => void;
  onOpenNote?: (path: string, line?: number) => void;
  onSelectProject: (projectId: string) => void;
  onEnterFocus: (todo?: TodoItem) => void;
  onToggleReminderDone: (item: ReminderViewItem, done: boolean) => void;
  onSaveReminder: (data: { text: string; date: string; time: string; notePath: string; channels: DeliveryChannel[] }, item: ReminderViewItem | null) => Promise<void>;
  onSnoozeReminder: (item: ReminderViewItem, preset: SnoozePreset) => void;
  onEditReminder: (item: ReminderViewItem) => void;
  onDeleteReminder: (item: ReminderViewItem) => void;
  onOpenFullReminderModal: () => void;
  onAddQuickReminder: (text: string, date: string, notePath: string) => Promise<void>;
  onSendNowScheduled: (item: ScheduledMessageRecord) => void;
  onCancelScheduled: (id: string) => void;
  onNewScheduledMessage: () => void;
  onAddTodoToSection: (notePath: string, sectionName: string, text: string) => Promise<void>;
  onCreateTodoNote: (folderPath: string, name: string) => Promise<void>;
}

export function TodosMainContent({
  viewMode,
  reminders,
  scheduledMessages,
  searchQuery,
  reminderFilter,
  scheduledFilter,
  filteredAllTodos,
  motherboardLayout,
  activeProject,
  filteredSections,
  allNotePaths,
  currentNotePath,
  onToggleTodo,
  onUpdateText,
  onAddLink,
  onAddReminder,
  onOpenNote,
  onSelectProject,
  onEnterFocus,
  onToggleReminderDone,
  onSaveReminder,
  onSnoozeReminder,
  onEditReminder,
  onDeleteReminder,
  onOpenFullReminderModal,
  onAddQuickReminder,
  onSendNowScheduled,
  onCancelScheduled,
  onNewScheduledMessage,
  onAddTodoToSection,
  onCreateTodoNote,
}: TodosMainContentProps): JSX.Element {
  if (viewMode === "reminders") {
    return (
      <TodosRemindersContent
        reminders={reminders}
        searchQuery={searchQuery}
        filter={reminderFilter}
        onToggleDone={onToggleReminderDone}
        onUpdateText={async (item, newText) => {
          await onSaveReminder(
            {
              text: newText,
              date: item.dueAtUtc.slice(0, 10),
              time: item.dueAtUtc.slice(11, 16),
              notePath: item.notePath,
              channels: (item.channels as DeliveryChannel[]) ?? ["desktop"],
            },
            item,
          );
        }}
        onSnooze={onSnoozeReminder}
        onEdit={onEditReminder}
        onDelete={onDeleteReminder}
        onOpenNote={onOpenNote}
        onOpenFullModal={onOpenFullReminderModal}
        onAddQuickReminder={onAddQuickReminder}
        availableNotes={allNotePaths}
        defaultNotePath={currentNotePath || allNotePaths[0]}
      />
    );
  }

  if (viewMode === "scheduled") {
    return (
      <TodosScheduledContent
        items={scheduledMessages}
        searchQuery={searchQuery}
        filter={scheduledFilter}
        onSendNow={onSendNowScheduled}
        onCancel={onCancelScheduled}
        onNewMessage={onNewScheduledMessage}
      />
    );
  }

  if (viewMode === "motherboard") {
    return (
      <TodosMotherboard
        todos={filteredAllTodos}
        layout={motherboardLayout}
        onToggleTodo={onToggleTodo}
        onUpdateText={onUpdateText}
        onAddLink={onAddLink}
        onAddReminder={onAddReminder}
        onOpenNote={onOpenNote}
        onSelectProject={onSelectProject}
        onEnterFocus={onEnterFocus}
        allNotePaths={allNotePaths}
      />
    );
  }

  return (
    <TodosProjectContent
      activeProject={activeProject}
      filteredSections={filteredSections}
      searchQuery={searchQuery}
      allNotePaths={allNotePaths}
      currentNotePath={currentNotePath}
      onToggleTodo={onToggleTodo}
      onUpdateText={onUpdateText}
      onAddLink={onAddLink}
      onAddReminder={onAddReminder}
      onOpenNote={onOpenNote}
      onEnterFocus={() => onEnterFocus()}
      onAddTodoToSection={onAddTodoToSection}
      onCreateTodoNote={onCreateTodoNote}
    />
  );
}

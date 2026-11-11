import { useEffect, useState, type JSX } from "react";
import { TooltipProvider } from "@app/design-system";
import { TodosSidebar } from "./TodosSidebar";
import { TodosHeader } from "./TodosHeader";
import { TodosMainContent } from "./TodosMainContent";
import { TodosModals } from "./TodosModals";
import { useFilteredTodos } from "./useFilteredTodos";
import { useTodosReminders } from "./useTodosReminders";
import { useTodosData } from "./useTodosData";
import { useTodosUIStore } from "./useTodosUIStore";
import {
  useTodosSidebarNav,
  useTodosHeaderInfo,
  useTodosSidebarToggle,
} from "./useTodosSidebarNav";
import type { TodoViewMode } from "./types";
import styles from "./TodosView.module.scss";

export interface TodosViewProps {
  initialView?: TodoViewMode;
  onOpenNote?: (path: string, line?: number) => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
  defaultSidebarOpen?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  showSidebar?: boolean;
}

export function TodosView({
  initialView,
  onOpenNote,
  defaultSidebarOpen,
  isSidebarOpen: propIsSidebarOpen,
  onToggleSidebar: propOnToggleSidebar,
  showSidebar = true,
}: TodosViewProps): JSX.Element {
  const viewMode = useTodosUIStore((s) => s.viewMode);
  const setViewMode = useTodosUIStore((s) => s.setViewMode);

  useEffect(() => {
    if (initialView) setViewMode(initialView);
  }, [initialView, setViewMode]);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTargetProject, setFocusTargetProject] = useState<string | null>(null);
  const { isSidebarOpen: internalSidebarOpen, toggleSidebar: internalToggleSidebar } =
    useTodosSidebarToggle(defaultSidebarOpen);

  const isSidebarOpen = propIsSidebarOpen !== undefined ? propIsSidebarOpen : internalSidebarOpen;
  const toggleSidebar = propOnToggleSidebar ?? internalToggleSidebar;

  const {
    projects, activeProject, activeNote, allTodos, monthsMap, searchQuery, setSearchQuery,
    selectedMonth, setSelectedMonth, statusFilter, setStatusFilter, motherboardLayout,
    setMotherboardLayout, selectedProjectId, setSelectedProjectId, selectedNotePath,
    setSelectedNotePath, setIsMotherboard, toggleTodo, updateTodoText, addLinkToTodo,
    addReminderToTodo, addTodoToSection, createProject, createTodoNote, deleteProject,
    deleteTodoNote, allNotePaths,
  } = useTodosData();

  const sidebarNav = useTodosSidebarNav({
    projects, setViewMode, setIsMotherboard, setSelectedProjectId, setSelectedNotePath,
    createProject, createTodoNote, deleteProject, deleteTodoNote,
  });

  const {
    reminders, scheduledMessages, reminderFilter, setReminderFilter, scheduledFilter,
    setScheduledFilter, isReminderModalOpen, setIsReminderModalOpen, editingReminder,
    setEditingReminder, isComposerOpen, setIsComposerOpen, remindersCounts, scheduledCounts,
    handleToggleDone, handleSnooze, handleDeleteReminder, handleSaveReminder,
    handleSaveScheduled, handleCancelScheduled, handleSendNowScheduled, handleQuickAddReminder,
  } = useTodosReminders();

  const { filteredAllTodos, filteredSections, focusSections } = useFilteredTodos(
    allTodos, activeNote, activeProject, searchQuery, selectedMonth, statusFilter,
    focusTargetProject, projects,
  );

  const currentNotePath = activeNote?.notePath ?? activeProject?.notePath ?? "";
  const { headerTitle, headerSubtitle } = useTodosHeaderInfo(viewMode, activeNote, activeProject);

  const handleSelectProject = (path: string) => {
    setViewMode("project");
    setIsMotherboard(false);
    setSelectedProjectId(path);
  };

  const handleEnterFocus = (todo?: { notePath?: string }) => {
    setFocusTargetProject(todo?.notePath ?? activeProject?.id ?? null);
    setIsFocusMode(true);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={styles["todos-view"]} data-testid="todos-view">
        {showSidebar && isSidebarOpen && (
          <TodosSidebar
            projects={projects}
            selectedProjectId={selectedProjectId}
            selectedNotePath={selectedNotePath}
            viewMode={viewMode}
            isMotherboard={viewMode === "motherboard"}
            totalTodosCount={allTodos.length}
            remindersCount={remindersCounts.overdue + remindersCounts.today + remindersCounts.upcoming}
            overdueCount={remindersCounts.overdue}
            scheduledCount={scheduledCounts.scheduled + scheduledCounts.needsSend}
            onToggleSidebar={toggleSidebar}
            {...sidebarNav}
          />
        )}

        <div className={styles["todos-view__main"]}>
          <TodosHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            reminderFilter={reminderFilter}
            onSelectReminderFilter={setReminderFilter}
            scheduledFilter={scheduledFilter}
            onSelectScheduledFilter={setScheduledFilter}
            onNewReminder={() => { setEditingReminder(null); setIsReminderModalOpen(true); }}
            onNewScheduledMessage={() => setIsComposerOpen(true)}
            remindersCounts={remindersCounts}
            scheduledCounts={scheduledCounts}
            monthsMap={monthsMap}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            statusFilter={statusFilter}
            onSelectStatus={setStatusFilter}
            layout={motherboardLayout}
            onSelectLayout={setMotherboardLayout}
            isMotherboard={viewMode === "motherboard"}
            totalTodos={filteredAllTodos.length}
            onOpenFocusMode={() => { setFocusTargetProject(null); setIsFocusMode(true); }}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          <TodosMainContent
            viewMode={viewMode}
            reminders={reminders}
            scheduledMessages={scheduledMessages}
            searchQuery={searchQuery}
            reminderFilter={reminderFilter}
            scheduledFilter={scheduledFilter}
            filteredAllTodos={filteredAllTodos}
            motherboardLayout={motherboardLayout}
            activeProject={activeProject}
            filteredSections={filteredSections}
            allNotePaths={allNotePaths}
            currentNotePath={currentNotePath}
            onToggleTodo={(t) => void toggleTodo(t.notePath, t.line, !t.done)}
            onUpdateText={(t, text) => void updateTodoText(t.notePath, t.line, text)}
            onAddLink={(t, name) => void addLinkToTodo(t.notePath, t.line, name)}
            onAddReminder={(t, date) => void addReminderToTodo(t.notePath, t.line, date)}
            onOpenNote={onOpenNote}
            onSelectProject={handleSelectProject}
            onEnterFocus={handleEnterFocus}
            onToggleReminderDone={handleToggleDone}
            onSaveReminder={handleSaveReminder}
            onSnoozeReminder={handleSnooze}
            onEditReminder={(item) => { setEditingReminder(item); setIsReminderModalOpen(true); }}
            onDeleteReminder={handleDeleteReminder}
            onOpenFullReminderModal={() => { setEditingReminder(null); setIsReminderModalOpen(true); }}
            onAddQuickReminder={handleQuickAddReminder}
            onSendNowScheduled={handleSendNowScheduled}
            onCancelScheduled={handleCancelScheduled}
            onNewScheduledMessage={() => setIsComposerOpen(true)}
            onAddTodoToSection={addTodoToSection}
            onCreateTodoNote={createTodoNote}
          />
        </div>

        <TodosModals
          isFocusMode={isFocusMode}
          onCloseFocus={() => { setIsFocusMode(false); setFocusTargetProject(null); }}
          activeProject={activeProject}
          focusSections={focusSections}
          onToggleTodo={toggleTodo}
          onAddTodoToSection={(sName, text) => {
            if (currentNotePath) void addTodoToSection(currentNotePath, sName, text);
          }}
          isReminderModalOpen={isReminderModalOpen}
          onCloseReminderModal={() => { setIsReminderModalOpen(false); setEditingReminder(null); }}
          onSaveReminder={async (data) => { await handleSaveReminder(data, editingReminder); }}
          editingReminder={editingReminder}
          allNotePaths={allNotePaths}
          isComposerOpen={isComposerOpen}
          onCloseComposer={() => setIsComposerOpen(false)}
          onSaveScheduled={handleSaveScheduled}
        />
      </div>
    </TooltipProvider>
  );
}

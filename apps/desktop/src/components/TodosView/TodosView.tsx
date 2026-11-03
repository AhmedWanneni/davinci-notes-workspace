import { useState, useMemo, type JSX } from "react";
import { TodosSidebar } from "./TodosSidebar";
import { TodosHeader } from "./TodosHeader";
import { TodosMainContent } from "./TodosMainContent";
import { TodosModals } from "./TodosModals";
import { useFilteredTodos } from "./useFilteredTodos";
import { useTodosReminders } from "./useTodosReminders";
import { useTodosData } from "./useTodosData";
import type { TodoViewMode } from "./types";
import styles from "./TodosView.module.scss";

export interface TodosViewProps {
  initialView?: TodoViewMode;
  onOpenNote?: (path: string, line?: number) => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export function TodosView({
  initialView = "project",
  onOpenNote,
}: TodosViewProps): JSX.Element {
  const [viewMode, setViewMode] = useState<TodoViewMode>(initialView);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTargetProject, setFocusTargetProject] = useState<string | null>(null);

  const {
    projects,
    activeProject,
    activeNote,
    allTodos,
    monthsMap,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    statusFilter,
    setStatusFilter,
    motherboardLayout,
    setMotherboardLayout,
    selectedProjectId,
    setSelectedProjectId,
    selectedNotePath,
    setSelectedNotePath,
    setIsMotherboard,
    toggleTodo,
    updateTodoText,
    addLinkToTodo,
    addReminderToTodo,
    addTodoToSection,
    createProject,
    createTodoNote,
    deleteProject,
    deleteTodoNote,
    allNotePaths,
  } = useTodosData();

  const {
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
  } = useTodosReminders();

  const { filteredAllTodos, filteredSections, focusSections } = useFilteredTodos(
    allTodos,
    activeNote,
    activeProject,
    searchQuery,
    selectedMonth,
    statusFilter,
    focusTargetProject,
    projects,
  );

  const currentNotePath = activeNote?.notePath ?? activeProject?.notePath ?? "";

  const headerTitle = useMemo(() => {
    if (viewMode === "reminders") return "Reminders";
    if (viewMode === "scheduled") return "Scheduled Messages";
    if (viewMode === "motherboard") return "Motherboard";
    return activeNote?.name ?? activeProject?.name ?? "Tasks";
  }, [viewMode, activeNote, activeProject]);

  const headerSubtitle = useMemo(() => {
    if (viewMode === "reminders") return "Task reminders & alerts across your notes";
    if (viewMode === "scheduled") return "Automated & scheduled messages to external channels";
    if (viewMode === "motherboard") return "All tasks across projects";
    return activeProject?.name;
  }, [viewMode, activeProject]);

  return (
    <div className={styles["todos-view"]} data-testid="todos-view">
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
        onSelectMotherboard={() => { setViewMode("motherboard"); setIsMotherboard(true); }}
        onSelectReminders={() => { setViewMode("reminders"); setIsMotherboard(false); }}
        onSelectScheduled={() => { setViewMode("scheduled"); setIsMotherboard(false); }}
        onSelectProject={(id) => {
          setViewMode("project");
          setIsMotherboard(false);
          setSelectedProjectId(id);
          const p = projects.find((x) => x.id === id);
          if (p && p.notes.length > 0) setSelectedNotePath(p.notes[0].notePath);
        }}
        onSelectNote={(projId, notePath) => {
          setViewMode("project");
          setIsMotherboard(false);
          setSelectedProjectId(projId);
          setSelectedNotePath(notePath);
        }}
        onCreateProject={(name) => void createProject(name)}
        onCreateTodoNote={(fPath, name) => void createTodoNote(fPath, name)}
        onDeleteProject={(id) => void deleteProject(id)}
        onDeleteNote={(path) => void deleteTodoNote(path)}
      />

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
          onToggleTodo={toggleTodo}
          onUpdateText={updateTodoText}
          onAddLink={addLinkToTodo}
          onAddReminder={addReminderToTodo}
          onOpenNote={onOpenNote}
          onSelectProject={(path) => {
            setViewMode("project");
            setIsMotherboard(false);
            setSelectedProjectId(path);
          }}
          onEnterFocus={(todo) => {
            setFocusTargetProject(todo?.notePath ?? activeProject?.id ?? null);
            setIsFocusMode(true);
          }}
          onToggleReminderDone={handleToggleDone}
          onSaveReminder={handleSaveReminder}
          onSnoozeReminder={handleSnooze}
          onEditReminder={(item) => {
            setEditingReminder(item);
            setIsReminderModalOpen(true);
          }}
          onDeleteReminder={handleDeleteReminder}
          onOpenFullReminderModal={() => {
            setEditingReminder(null);
            setIsReminderModalOpen(true);
          }}
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
        onCloseFocus={() => {
          setIsFocusMode(false);
          setFocusTargetProject(null);
        }}
        activeProject={activeProject}
        focusSections={focusSections}
        onToggleTodo={toggleTodo}
        onAddTodoToSection={(sName, text) => {
          if (currentNotePath) void addTodoToSection(currentNotePath, sName, text);
        }}
        isReminderModalOpen={isReminderModalOpen}
        onCloseReminderModal={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        onSaveReminder={async (data) => {
          await handleSaveReminder(data, editingReminder);
        }}
        editingReminder={editingReminder}
        allNotePaths={allNotePaths}
        isComposerOpen={isComposerOpen}
        onCloseComposer={() => setIsComposerOpen(false)}
        onSaveScheduled={handleSaveScheduled}
      />
    </div>
  );
}

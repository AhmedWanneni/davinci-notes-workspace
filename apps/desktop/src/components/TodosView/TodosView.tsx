import { useState, useMemo, useCallback, type JSX } from "react";
import { TodosSidebar } from "./TodosSidebar";
import { TodosHeader } from "./TodosHeader";
import { TodosMotherboard } from "./TodosMotherboard";
import { TodoSectionBlock } from "./TodoSectionBlock";
import { TodoFocusView } from "./TodoFocusView";
import { useTodosData } from "./useTodosData";
import type { TodoItem, TodoSection } from "./types";
import styles from "./TodosView.module.scss";

export interface TodosViewProps {
  onOpenNote?: (path: string) => void;
  onClose?: () => void;
}

export function TodosView({ onOpenNote }: TodosViewProps): JSX.Element {
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
    isMotherboard,
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

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTargetProject, setFocusTargetProject] = useState<string | null>(
    null,
  );

  const matchesFilter = useCallback(
    (todo: TodoItem) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = todo.text.toLowerCase().includes(q);
        const linkMatch = todo.linkedNotePath?.toLowerCase().includes(q);
        if (!textMatch && !linkMatch) return false;
      }
      if (selectedMonth !== "all" && todo.month !== selectedMonth) return false;
      if (statusFilter === "pending" && todo.completed) return false;
      if (statusFilter === "completed" && !todo.completed) return false;
      if (statusFilter === "dated" && !todo.dueDate) return false;
      return true;
    },
    [searchQuery, selectedMonth, statusFilter],
  );

  const filteredAllTodos = useMemo(
    () => allTodos.filter(matchesFilter),
    [allTodos, matchesFilter],
  );

  const currentSections = useMemo(() => {
    if (activeNote) return activeNote.sections;
    if (activeProject) return activeProject.sections;
    return [];
  }, [activeNote, activeProject]);

  const filteredSections: TodoSection[] = useMemo(() => {
    return currentSections
      .map((section) => ({
        ...section,
        todos: section.todos.filter(matchesFilter),
      }))
      .filter((s) => s.todos.length > 0 || !searchQuery.trim());
  }, [currentSections, matchesFilter, searchQuery]);

  const focusSections: TodoSection[] = useMemo(() => {
    if (focusTargetProject) {
      const p = projects.find((x) => x.id === focusTargetProject);
      if (p) return p.sections;
    }
    if (activeNote) return activeNote.sections;
    if (activeProject) return activeProject.sections;
    const map = new Map<string, TodoItem[]>();
    for (const t of allTodos) {
      const groupName = t.project ?? t.section ?? "General";
      const existing = map.get(groupName) ?? [];
      existing.push(t);
      map.set(groupName, existing);
    }
    return Array.from(map.entries()).map(([name, todos]) => ({ name, todos }));
  }, [activeNote, activeProject, allTodos, focusTargetProject, projects]);

  const currentNotePath = activeNote?.notePath ?? activeProject?.notePath ?? "";

  return (
    <div className={styles["todos-view"]} data-testid="todos-view">
      <TodosSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        selectedNotePath={selectedNotePath}
        isMotherboard={isMotherboard}
        totalTodosCount={allTodos.length}
        onSelectProject={(id) => {
          setIsMotherboard(false);
          setSelectedProjectId(id);
          const p = projects.find((x) => x.id === id);
          if (p && p.notes.length > 0) setSelectedNotePath(p.notes[0].notePath);
        }}
        onSelectNote={(projId, notePath) => {
          setIsMotherboard(false);
          setSelectedProjectId(projId);
          setSelectedNotePath(notePath);
        }}
        onSelectMotherboard={() => setIsMotherboard(true)}
        onCreateProject={(name) => void createProject(name)}
        onCreateTodoNote={(fPath, name) => void createTodoNote(fPath, name)}
        onDeleteProject={(id) => void deleteProject(id)}
        onDeleteNote={(path) => void deleteTodoNote(path)}
      />

      <div className={styles["todos-view__main"]}>
        <TodosHeader
          title={
            isMotherboard
              ? "Motherboard"
              : (activeNote?.name ?? activeProject?.name ?? "Tasks")
          }
          subtitle={
            isMotherboard ? "All tasks across projects" : activeProject?.name
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          monthsMap={monthsMap}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          statusFilter={statusFilter}
          onSelectStatus={setStatusFilter}
          layout={motherboardLayout}
          onSelectLayout={setMotherboardLayout}
          isMotherboard={isMotherboard}
          totalTodos={isMotherboard ? filteredAllTodos.length : allTodos.length}
          onOpenFocusMode={() => {
            setFocusTargetProject(null);
            setIsFocusMode(true);
          }}
        />

        {isMotherboard ? (
          <TodosMotherboard
            todos={filteredAllTodos}
            layout={motherboardLayout}
            onToggleTodo={toggleTodo}
            onUpdateText={updateTodoText}
            onAddLink={addLinkToTodo}
            onAddReminder={addReminderToTodo}
            onOpenNote={onOpenNote}
            onSelectProject={(path) => {
              setIsMotherboard(false);
              setSelectedProjectId(path);
            }}
            onEnterFocus={(todo) => {
              setFocusTargetProject(todo?.notePath ?? null);
              setIsFocusMode(true);
            }}
            allNotePaths={allNotePaths}
          />
        ) : (
          <main className={styles["todos-view__content"]}>
            {filteredSections.length === 0 ? (
              <div className={styles["todos-view__empty"]}>
                <span>
                  {activeProject && activeProject.notes.length === 0
                    ? `Project "${activeProject.name}" is empty`
                    : "No tasks found matching your filter"}
                </span>
                {activeProject && activeProject.notes.length === 0 && (
                  <button
                    type="button"
                    className={styles["todos-view__empty-action"]}
                    onClick={() =>
                      void createTodoNote(activeProject.folderPath, "Tasks")
                    }
                  >
                    + Add first todo note
                  </button>
                )}
              </div>
            ) : (
              filteredSections.map((section) => (
                <TodoSectionBlock
                  key={section.name}
                  section={section}
                  onToggle={toggleTodo}
                  onUpdateText={updateTodoText}
                  onAddLink={addLinkToTodo}
                  onAddReminder={addReminderToTodo}
                  onOpenNote={onOpenNote}
                  onEnterFocus={() => {
                    setFocusTargetProject(activeProject?.id ?? null);
                    setIsFocusMode(true);
                  }}
                  allNotePaths={allNotePaths}
                  onAddTodo={async (secName, text) => {
                    if (currentNotePath)
                      await addTodoToSection(currentNotePath, secName, text);
                  }}
                />
              ))
            )}
          </main>
        )}
      </div>

      {isFocusMode && (
        <TodoFocusView
          project={activeProject}
          sections={focusSections}
          onClose={() => {
            setIsFocusMode(false);
            setFocusTargetProject(null);
          }}
          onToggleTodo={toggleTodo}
          onAddTodo={(sName, text) => {
            if (currentNotePath)
              void addTodoToSection(currentNotePath, sName, text);
          }}
        />
      )}
    </div>
  );
}

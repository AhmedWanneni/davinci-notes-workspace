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
    isMotherboard,
    setIsMotherboard,
    toggleTodo,
    updateTodoText,
    addLinkToTodo,
    addReminderToTodo,
    addTodoToSection,
    createProject,
    createFolder,
    allNotePaths,
  } = useTodosData();

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTargetProject, setFocusTargetProject] = useState<string | null>(null);

  const matchesFilter = useCallback(
    (todo: TodoItem) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = todo.text.toLowerCase().includes(q);
        const linkMatch = todo.linkedNotePath?.toLowerCase().includes(q);
        if (!textMatch && !linkMatch) return false;
      }
      if (selectedMonth !== "all" && todo.month !== selectedMonth) {
        return false;
      }
      if (statusFilter === "pending" && todo.completed) return false;
      if (statusFilter === "completed" && !todo.completed) return false;
      if (statusFilter === "dated" && !todo.dueDate) return false;
      return true;
    },
    [searchQuery, selectedMonth, statusFilter],
  );

  const filteredAllTodos = useMemo(() => {
    return allTodos.filter(matchesFilter);
  }, [allTodos, matchesFilter]);

  const filteredSections: TodoSection[] = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.sections
      .map((section) => ({
        ...section,
        todos: section.todos.filter(matchesFilter),
      }))
      .filter((s) => s.todos.length > 0 || !searchQuery.trim());
  }, [activeProject, matchesFilter, searchQuery]);

  const focusSections: TodoSection[] = useMemo(() => {
    if (focusTargetProject) {
      const p = projects.find((x) => x.id === focusTargetProject);
      if (p) return p.sections;
    }
    if (activeProject) return activeProject.sections;
    const map = new Map<string, TodoItem[]>();
    for (const t of allTodos) {
      const groupName = t.project ?? t.section ?? "General";
      const existing = map.get(groupName) ?? [];
      existing.push(t);
      map.set(groupName, existing);
    }
    return Array.from(map.entries()).map(([name, todos]) => ({ name, todos }));
  }, [activeProject, allTodos, focusTargetProject, projects]);

  return (
    <div className={styles["todos-view"]} data-testid="todos-view">
      <TodosSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        isMotherboard={isMotherboard}
        totalTodosCount={allTodos.length}
        onSelectProject={(id) => {
          setIsMotherboard(false);
          setSelectedProjectId(id);
        }}
        onSelectMotherboard={() => setIsMotherboard(true)}
        onCreateProject={(name) => void createProject(name)}
        onCreateFolder={(name) => void createFolder(name)}
      />

      <div className={styles["todos-view__main"]}>
        <TodosHeader
          title={isMotherboard ? "Motherboard" : (activeProject?.name ?? "Tasks")}
          subtitle={isMotherboard ? "All tasks across projects" : activeProject?.folder}
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
                <span>No tasks found matching your filter</span>
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
                    if (activeProject) await addTodoToSection(activeProject.notePath, secName, text);
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
            if (activeProject) void addTodoToSection(activeProject.notePath, sName, text);
          }}
        />
      )}
    </div>
  );
}

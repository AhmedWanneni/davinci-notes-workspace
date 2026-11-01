import { useState, useMemo, useCallback, type JSX } from "react";
import { Calendar, DotsThree, Plus } from "@phosphor-icons/react";
import { useTodosData } from "./useTodosData";
import { TodosSidebar } from "./TodosSidebar";
import { TodosHeader } from "./TodosHeader";
import { TodoItemRow } from "./TodoItemRow";
import { TodoFocusView } from "./TodoFocusView";
import type { TodoSection } from "./types";
import styles from "./TodosView.module.scss";

export interface TodosViewProps {
  onOpenNote?: (path: string) => void;
  onClose?: () => void;
}

export function TodosView({ onOpenNote }: TodosViewProps): JSX.Element {
  const {
    workspaces,
    activeProject,
    allTodos,
    monthsMap,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    selectedWorkspaceName,
    setSelectedWorkspaceName,
    selectedProjectId,
    setSelectedProjectId,
    toggleTodo,
    updateTodoText,
    addLinkToTodo,
    addReminderToTodo,
    addTodoToSection,
    createProject,
    allNotePaths,
  } = useTodosData();

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [addingSectionName, setAddingSectionName] = useState<string | null>(null);
  const [draftTaskText, setDraftTaskText] = useState("");

  const filteredSections: TodoSection[] = useMemo(() => {
    if (!activeProject) return [];

    return activeProject.sections
      .map((section) => {
        const filtered = section.todos.filter((t) => {
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesText = t.text.toLowerCase().includes(q);
            const matchesSection = t.section.toLowerCase().includes(q);
            if (!matchesText && !matchesSection) return false;
          }

          if (selectedMonth !== "all" && t.month !== selectedMonth) {
            return false;
          }

          return true;
        });

        return { ...section, todos: filtered };
      })
      .filter((s) => s.todos.length > 0 || !searchQuery.trim());
  }, [activeProject, searchQuery, selectedMonth]);

  const handleCreateTodo = useCallback(
    (sectionName: string) => {
      if (!draftTaskText.trim() || !activeProject) return;
      void addTodoToSection(activeProject.notePath, sectionName, draftTaskText.trim());
      setDraftTaskText("");
      setAddingSectionName(null);
    },
    [activeProject, addTodoToSection, draftTaskText],
  );

  return (
    <div className={styles["todos-view"]} data-testid="todos-view">
      <TodosSidebar
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspaceName}
        selectedProjectId={selectedProjectId}
        onSelectProject={(ws, pid) => {
          setSelectedWorkspaceName(ws);
          setSelectedProjectId(pid);
        }}
        onCreateProject={(ws, name) => void createProject(ws, name)}
      />

      <div className={styles["todos-view__main"]}>
        <TodosHeader
          title={activeProject?.name ?? "Tasks"}
          subtitle={`${selectedWorkspaceName} workspace • ${activeProject?.name ?? "All"}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          monthsMap={monthsMap}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          totalTodos={allTodos.length}
          onOpenFocusMode={() => setIsFocusMode(true)}
        />

        <main className={styles["todos-view__content"]}>
          {filteredSections.length === 0 ? (
            <div className={styles["todos-view__empty"]}>
              <span>No tasks found matching your filter</span>
            </div>
          ) : (
            filteredSections.map((section) => (
              <section key={section.name} className={styles["todos-view__section"]}>
                <div className={styles["todos-view__section-header"]}>
                  <h2 className={styles["todos-view__section-title"]}>{section.name}</h2>
                  <div className={styles["todos-view__section-actions"]}>
                    <button type="button" className={styles["todos-view__icon-btn"]} title="Calendar">
                      <Calendar size={16} />
                    </button>
                    <button type="button" className={styles["todos-view__icon-btn"]} title="More actions">
                      <DotsThree size={18} weight="bold" />
                    </button>
                  </div>
                </div>

                <div className={styles["todos-view__list"]}>
                  {section.todos.map((todo) => (
                    <TodoItemRow
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onUpdateText={updateTodoText}
                      onAddLink={addLinkToTodo}
                      onAddReminder={addReminderToTodo}
                      onOpenNote={onOpenNote}
                      onEnterFocus={() => setIsFocusMode(true)}
                      allNotePaths={allNotePaths}
                    />
                  ))}

                  {addingSectionName === section.name ? (
                    <div className={styles["todos-view__add-row"]}>
                      <input
                        type="text"
                        placeholder="Add task... (Enter to save)"
                        value={draftTaskText}
                        onChange={(e) => setDraftTaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateTodo(section.name);
                          if (e.key === "Escape") setAddingSectionName(null);
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "none",
                        border: "none",
                        color: "var(--color-text-muted)",
                        fontSize: 12,
                        cursor: "pointer",
                        padding: "6px 10px",
                      }}
                      onClick={() => {
                        setAddingSectionName(section.name);
                        setDraftTaskText("");
                      }}
                    >
                      <Plus size={14} />
                      <span>Add task</span>
                    </button>
                  )}
                </div>
              </section>
            ))
          )}
        </main>
      </div>

      {isFocusMode && (
        <TodoFocusView
          project={activeProject}
          sections={activeProject?.sections ?? []}
          onClose={() => setIsFocusMode(false)}
          onToggleTodo={toggleTodo}
          onAddTodo={(sName, text) => {
            if (activeProject) void addTodoToSection(activeProject.notePath, sName, text);
          }}
        />
      )}
    </div>
  );
}

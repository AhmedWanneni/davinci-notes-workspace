import type { JSX } from "react";
import type { TodoItem, TodoProject, TodoSection } from "./types";
import { TodoSectionBlock } from "./TodoSectionBlock";
import styles from "./TodosView.module.scss";

export interface TodosProjectContentProps {
  activeProject: TodoProject | null;
  filteredSections: TodoSection[];
  searchQuery?: string;
  allNotePaths: string[];
  currentNotePath: string;
  onToggleTodo: (todo: TodoItem) => void;
  onUpdateText: (todo: TodoItem, newText: string) => void;
  onAddLink: (todo: TodoItem, noteName: string) => void;
  onAddReminder: (todo: TodoItem, dateStr: string) => void;
  onOpenNote?: (path: string, line?: number) => void;
  onEnterFocus: () => void;
  onAddTodoToSection: (notePath: string, sectionName: string, text: string) => Promise<void>;
  onCreateTodoNote: (folderPath: string, name: string) => Promise<void>;
}

export function TodosProjectContent({
  activeProject,
  filteredSections,
  searchQuery: _searchQuery,
  allNotePaths,
  currentNotePath,
  onToggleTodo,
  onUpdateText,
  onAddLink,
  onAddReminder,
  onOpenNote,
  onEnterFocus,
  onAddTodoToSection,
  onCreateTodoNote,
}: TodosProjectContentProps): JSX.Element {
  return (
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
              onClick={() => void onCreateTodoNote(activeProject.folderPath, "Tasks")}
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
            onToggle={onToggleTodo}
            onUpdateText={onUpdateText}
            onAddLink={onAddLink}
            onAddReminder={onAddReminder}
            onOpenNote={onOpenNote}
            onEnterFocus={onEnterFocus}
            allNotePaths={allNotePaths}
            onAddTodo={async (secName, text) => {
              if (currentNotePath) await onAddTodoToSection(currentNotePath, secName, text);
            }}
          />
        ))
      )}
    </main>
  );
}

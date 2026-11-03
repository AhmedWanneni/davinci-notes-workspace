import type { JSX } from "react";
import {
  Bell,
  Layout,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { TodoProject, TodoViewMode } from "./types";
import { TodosSidebarProjects } from "./TodosSidebarProjects";
import styles from "./TodosSidebar.module.scss";

export interface TodosSidebarProps {
  projects: TodoProject[];
  selectedProjectId: string;
  selectedNotePath?: string;
  isMotherboard?: boolean;
  viewMode?: TodoViewMode;
  totalTodosCount: number;
  remindersCount?: number;
  overdueCount?: number;
  scheduledCount?: number;
  onSelectProject: (projectId: string) => void;
  onSelectNote?: (projectId: string, notePath: string) => void;
  onSelectMotherboard: () => void;
  onSelectReminders?: () => void;
  onSelectScheduled?: () => void;
  onCreateProject: (name: string) => void;
  onCreateTodoNote?: (projectFolderPath: string, name: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDeleteNote?: (notePath: string) => void;
}

export function TodosSidebar({
  projects,
  selectedProjectId,
  selectedNotePath,
  isMotherboard,
  viewMode = isMotherboard ? "motherboard" : "project",
  totalTodosCount,
  remindersCount = 0,
  overdueCount = 0,
  scheduledCount = 0,
  onSelectProject,
  onSelectNote,
  onSelectMotherboard,
  onSelectReminders,
  onSelectScheduled,
  onCreateProject,
  onCreateTodoNote,
  onDeleteProject,
  onDeleteNote,
}: TodosSidebarProps): JSX.Element {
  return (
    <aside className={styles["todos-sidebar"]} data-testid="todos-sidebar">
      <div className={styles["todos-sidebar__top-nav"]}>
        <button
          type="button"
          className={`${styles["todos-sidebar__item"]} ${viewMode === "motherboard" ? styles["is-active"] : ""}`}
          onClick={onSelectMotherboard}
        >
          <Layout size={16} weight={viewMode === "motherboard" ? "fill" : "regular"} />
          <span style={{ flex: 1, fontWeight: 600 }}>Motherboard</span>
          <span className={styles["todos-sidebar__count"]}>{totalTodosCount}</span>
        </button>

        {onSelectReminders && (
          <button
            type="button"
            className={`${styles["todos-sidebar__item"]} ${viewMode === "reminders" ? styles["is-active"] : ""}`}
            onClick={onSelectReminders}
          >
            <Bell size={16} weight={viewMode === "reminders" ? "fill" : "regular"} />
            <span style={{ flex: 1, fontWeight: 600 }}>Reminders</span>
            {remindersCount > 0 && (
              <span
                className={`${styles["todos-sidebar__count"]} ${overdueCount > 0 ? styles["is-overdue"] : ""}`}
              >
                {remindersCount}
              </span>
            )}
          </button>
        )}

        {onSelectScheduled && (
          <button
            type="button"
            className={`${styles["todos-sidebar__item"]} ${viewMode === "scheduled" ? styles["is-active"] : ""}`}
            onClick={onSelectScheduled}
          >
            <PaperPlaneTilt size={16} weight={viewMode === "scheduled" ? "fill" : "regular"} />
            <span style={{ flex: 1, fontWeight: 600 }}>Scheduled Messages</span>
            {scheduledCount > 0 && (
              <span className={styles["todos-sidebar__count"]}>{scheduledCount}</span>
            )}
          </button>
        )}
      </div>

      <TodosSidebarProjects
        projects={projects}
        selectedProjectId={selectedProjectId}
        selectedNotePath={selectedNotePath}
        viewMode={viewMode}
        onSelectProject={onSelectProject}
        onSelectNote={onSelectNote}
        onCreateProject={onCreateProject}
        onCreateTodoNote={onCreateTodoNote}
        onDeleteProject={onDeleteProject}
        onDeleteNote={onDeleteNote}
      />
    </aside>
  );
}

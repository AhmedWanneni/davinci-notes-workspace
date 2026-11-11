import type { JSX } from "react";
import {
  Bell,
  CheckSquareOffset,
  Layout,
  PaperPlaneTilt,
  SidebarSimple,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";
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
  onToggleSidebar?: () => void;
  inAppSidebar?: boolean;
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
  onToggleSidebar,
  inAppSidebar = false,
}: TodosSidebarProps): JSX.Element {
  return (
    <aside
      className={`${styles["todos-sidebar"]} ${
        inAppSidebar ? styles["todos-sidebar--in-app-sidebar"] : ""
      }`}
      data-testid="todos-sidebar"
    >
      {!inAppSidebar && (
        <div className={styles["todos-sidebar__header-bar"]}>
          <div className={styles["todos-sidebar__header-title-group"]}>
            <CheckSquareOffset size={16} weight="bold" />
            <span className={styles["todos-sidebar__header-heading"]}>Todos</span>
          </div>
          {onToggleSidebar && (
            <Tooltip content="Collapse sidebar" contentProps={{ side: "bottom" }}>
              <button
                type="button"
                className={styles["todos-sidebar__toggle-btn"]}
                onClick={onToggleSidebar}
                aria-label="Collapse sidebar"
              >
                <SidebarSimple size={18} weight="regular" />
              </button>
            </Tooltip>
          )}
        </div>
      )}

      <div className={styles["todos-sidebar__scroll"]}>
        <div className={styles["todos-sidebar__top-nav"]}>
          <button
            type="button"
            className={`${styles["todos-sidebar__item"]} ${viewMode === "motherboard" ? styles["is-active"] : ""}`}
            onClick={onSelectMotherboard}
          >
            <Layout size={16} weight={viewMode === "motherboard" ? "fill" : "regular"} />
            <span className={styles["todos-sidebar__label"]}>Motherboard</span>
            <span className={styles["todos-sidebar__count"]}>{totalTodosCount}</span>
          </button>

          {onSelectReminders && (
            <button
              type="button"
              className={`${styles["todos-sidebar__item"]} ${viewMode === "reminders" ? styles["is-active"] : ""}`}
              onClick={onSelectReminders}
            >
              <Bell size={16} weight={viewMode === "reminders" ? "fill" : "regular"} />
              <span className={styles["todos-sidebar__label"]}>Reminders</span>
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
              <span className={styles["todos-sidebar__label"]}>Scheduled Messages</span>
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
      </div>
    </aside>
  );
}

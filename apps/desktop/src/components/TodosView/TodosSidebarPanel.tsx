import type { JSX } from "react";
import { useTodosData } from "./useTodosData";
import { useTodosUIStore } from "./useTodosUIStore";
import { useTodosSidebarNav } from "./useTodosSidebarNav";
import { useTodosReminders } from "./useTodosReminders";
import { TodosSidebar } from "./TodosSidebar";

export function TodosSidebarPanel(): JSX.Element {
  const {
    projects,
    selectedProjectId,
    selectedNotePath,
    allTodos,
    setIsMotherboard,
    setSelectedProjectId,
    setSelectedNotePath,
    createProject,
    createTodoNote,
    deleteProject,
    deleteTodoNote,
  } = useTodosData();

  const viewMode = useTodosUIStore((s) => s.viewMode);
  const setViewMode = useTodosUIStore((s) => s.setViewMode);

  const sidebarNav = useTodosSidebarNav({
    projects,
    setViewMode,
    setIsMotherboard,
    setSelectedProjectId,
    setSelectedNotePath,
    createProject,
    createTodoNote,
    deleteProject,
    deleteTodoNote,
  });

  const { remindersCounts, scheduledCounts } = useTodosReminders();

  return (
    <TodosSidebar
      inAppSidebar={true}
      projects={projects}
      selectedProjectId={selectedProjectId}
      selectedNotePath={selectedNotePath}
      viewMode={viewMode}
      isMotherboard={viewMode === "motherboard"}
      totalTodosCount={allTodos.length}
      remindersCount={
        remindersCounts.overdue + remindersCounts.today + remindersCounts.upcoming
      }
      overdueCount={remindersCounts.overdue}
      scheduledCount={scheduledCounts.scheduled + scheduledCounts.needsSend}
      {...sidebarNav}
    />
  );
}

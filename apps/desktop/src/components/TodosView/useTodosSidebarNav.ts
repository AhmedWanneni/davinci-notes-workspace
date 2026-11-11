import { useState, useMemo, useCallback } from "react";
import type { TodoNote, TodoProject, TodoViewMode } from "./types";

interface UseTodosSidebarNavParams {
  projects: TodoProject[];
  setViewMode: (mode: TodoViewMode) => void;
  setIsMotherboard: (val: boolean) => void;
  setSelectedProjectId: (id: string) => void;
  setSelectedNotePath: (path: string) => void;
  createProject: (name: string) => void | Promise<unknown>;
  createTodoNote: (folderPath: string, name: string) => void | Promise<unknown>;
  deleteProject: (id: string) => void | Promise<unknown>;
  deleteTodoNote: (path: string) => void | Promise<unknown>;
}

export function useTodosSidebarNav({
  projects,
  setViewMode,
  setIsMotherboard,
  setSelectedProjectId,
  setSelectedNotePath,
  createProject,
  createTodoNote,
  deleteProject,
  deleteTodoNote,
}: UseTodosSidebarNavParams) {
  const onSelectMotherboard = useCallback(() => {
    setViewMode("motherboard");
    setIsMotherboard(true);
  }, [setViewMode, setIsMotherboard]);

  const onSelectReminders = useCallback(() => {
    setViewMode("reminders");
    setIsMotherboard(false);
  }, [setViewMode, setIsMotherboard]);

  const onSelectScheduled = useCallback(() => {
    setViewMode("scheduled");
    setIsMotherboard(false);
  }, [setViewMode, setIsMotherboard]);

  const onSelectProject = useCallback(
    (id: string) => {
      setViewMode("project");
      setIsMotherboard(false);
      setSelectedProjectId(id);
      const p = projects.find((x) => x.id === id);
      if (p && p.notes.length > 0) setSelectedNotePath(p.notes[0].notePath);
    },
    [projects, setViewMode, setIsMotherboard, setSelectedProjectId, setSelectedNotePath],
  );

  const onSelectNote = useCallback(
    (projId: string, notePath: string) => {
      setViewMode("project");
      setIsMotherboard(false);
      setSelectedProjectId(projId);
      setSelectedNotePath(notePath);
    },
    [setViewMode, setIsMotherboard, setSelectedProjectId, setSelectedNotePath],
  );

  return {
    onSelectMotherboard,
    onSelectReminders,
    onSelectScheduled,
    onSelectProject,
    onSelectNote,
    onCreateProject: (name: string) => void createProject(name),
    onCreateTodoNote: (fPath: string, name: string) => void createTodoNote(fPath, name),
    onDeleteProject: (id: string) => void deleteProject(id),
    onDeleteNote: (path: string) => void deleteTodoNote(path),
  };
}

export function useTodosHeaderInfo(
  viewMode: TodoViewMode,
  activeNote: TodoNote | null,
  activeProject: TodoProject | null,
) {
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

  return { headerTitle, headerSubtitle };
}

export function useTodosSidebarToggle(defaultOpen?: boolean) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (defaultOpen !== undefined) return defaultOpen;
    try {
      return localStorage.getItem("sophia:todos-sidebar-open") !== "false";
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sophia:todos-sidebar-open", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { isSidebarOpen, toggleSidebar };
}

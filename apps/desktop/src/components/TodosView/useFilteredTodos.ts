import { useMemo, useCallback } from "react";
import type { TodoItem, TodoNote, TodoProject, TodoSection, TodoStatusFilter } from "./types";

export function useFilteredTodos(
  allTodos: TodoItem[],
  activeNote: TodoNote | null,
  activeProject: TodoProject | null,
  searchQuery: string,
  selectedMonth: string,
  statusFilter: TodoStatusFilter,
  focusTargetProject: string | null,
  projects: TodoProject[],
) {
  const matchesFilter = useCallback(
    (todo: TodoItem) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!todo.text.toLowerCase().includes(q) && !todo.linkedNotePath?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedMonth !== "all" && todo.month !== selectedMonth) return false;
      if (statusFilter === "pending" && todo.completed) return false;
      if (statusFilter === "completed" && !todo.completed) return false;
      if (statusFilter === "dated" && !todo.dueDate) return false;
      return true;
    },
    [searchQuery, selectedMonth, statusFilter],
  );

  const filteredAllTodos = useMemo(() => allTodos.filter(matchesFilter), [allTodos, matchesFilter]);

  const currentSections = useMemo(() => {
    if (activeNote) return activeNote.sections;
    if (activeProject) return activeProject.sections;
    return [];
  }, [activeNote, activeProject]);

  const filteredSections: TodoSection[] = useMemo(() => {
    return currentSections
      .map((section) => ({ ...section, todos: section.todos.filter(matchesFilter) }))
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

  return { filteredAllTodos, filteredSections, focusSections };
}

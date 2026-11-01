import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { createNoteInVault, writeNote } from "../../vault";
import {
  addLinkToTodoInContent,
  addReminderToTodoInContent,
  appendTodoToSectionInContent,
  parseNoteTodos,
  toggleTodoInContent,
  updateTodoTextInContent,
} from "./todoParser";
import { SAMPLE_ADMIN_DASHBOARD, SAMPLE_DAILY_ROUTINE } from "./sampleTodos";
import type { TodoItem, TodoProject, TodoWorkspace } from "./types";

export function useTodosData() {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const notesContent = useWorkspaceStore((state) => state.notesContent);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string>("Design");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const todoPaths = useMemo(() => {
    return allNotePaths.filter((p) => p.toLowerCase().startsWith("todos/"));
  }, [allNotePaths]);

  // Seed initial sample todos if todos folder is empty
  useEffect(() => {
    if (todoPaths.length === 0) {
      void createNoteInVault("todos/Design/Admin Dashboard.md", SAMPLE_ADMIN_DASHBOARD);
      void createNoteInVault("todos/Routines/Daily Focus.md", SAMPLE_DAILY_ROUTINE);
    }
  }, [todoPaths.length]);

  const workspaces: TodoWorkspace[] = useMemo(() => {
    const wsMap = new Map<string, TodoProject[]>();

    for (const path of todoPaths) {
      const parts = path.replace(/^todos\//i, "").split("/");
      const workspace = parts.length > 1 ? parts[0] : "General";
      const fileName = parts[parts.length - 1].replace(/\.md$/, "");
      const content = notesContent[path] ?? "";
      const sections = parseNoteTodos(content, path, workspace, fileName);

      const project: TodoProject = {
        id: path,
        name: fileName,
        notePath: path,
        workspace,
        sections,
      };

      const existing = wsMap.get(workspace) ?? [];
      existing.push(project);
      wsMap.set(workspace, existing);
    }

    return Array.from(wsMap.entries()).map(([name, projects]) => ({
      name,
      projects,
    }));
  }, [notesContent, todoPaths]);

  const activeProject = useMemo(() => {
    for (const ws of workspaces) {
      for (const p of ws.projects) {
        if (p.id === selectedProjectId || (!selectedProjectId && ws.name === selectedWorkspaceName)) {
          return p;
        }
      }
    }
    return workspaces[0]?.projects[0] ?? null;
  }, [selectedProjectId, selectedWorkspaceName, workspaces]);

  const allTodos = useMemo(() => {
    const list: TodoItem[] = [];
    for (const ws of workspaces) {
      for (const p of ws.projects) {
        for (const s of p.sections) {
          list.push(...s.todos);
        }
      }
    }
    return list;
  }, [workspaces]);

  const monthsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const todo of allTodos) {
      if (todo.month) {
        map.set(todo.month, (map.get(todo.month) ?? 0) + 1);
      }
    }
    return map;
  }, [allTodos]);

  const saveContent = useCallback(
    async (path: string, newContent: string) => {
      useWorkspaceStore.setState((s) => ({
        notesContent: { ...s.notesContent, [path]: newContent },
      }));
      await writeNote(path, newContent);
    },
    [],
  );

  const toggleTodo = useCallback(
    async (todo: TodoItem) => {
      const current = notesContent[todo.notePath] ?? "";
      const updated = toggleTodoInContent(current, todo.lineIndex, !todo.completed);
      await saveContent(todo.notePath, updated);
    },
    [notesContent, saveContent],
  );

  const updateTodoText = useCallback(
    async (todo: TodoItem, newText: string) => {
      const current = notesContent[todo.notePath] ?? "";
      const updated = updateTodoTextInContent(current, todo.lineIndex, newText);
      await saveContent(todo.notePath, updated);
    },
    [notesContent, saveContent],
  );

  const addLinkToTodo = useCallback(
    async (todo: TodoItem, noteName: string) => {
      const current = notesContent[todo.notePath] ?? "";
      const updated = addLinkToTodoInContent(current, todo.lineIndex, noteName);
      await saveContent(todo.notePath, updated);
    },
    [notesContent, saveContent],
  );

  const addReminderToTodo = useCallback(
    async (todo: TodoItem, dateStr: string) => {
      const current = notesContent[todo.notePath] ?? "";
      const updated = addReminderToTodoInContent(current, todo.lineIndex, dateStr);
      await saveContent(todo.notePath, updated);
    },
    [notesContent, saveContent],
  );

  const addTodoToSection = useCallback(
    async (notePath: string, sectionName: string, text: string) => {
      const current = notesContent[notePath] ?? "";
      const updated = appendTodoToSectionInContent(current, sectionName, text);
      await saveContent(notePath, updated);
    },
    [notesContent, saveContent],
  );

  const createProject = useCallback(async (workspace: string, projectName: string) => {
    const cleanWs = workspace.trim() || "General";
    const cleanName = projectName.trim() || "New Project";
    const targetPath = `todos/${cleanWs}/${cleanName}.md`;
    const defaultContent = `# ${cleanName}\n\n## Tasks\n- [ ] First task\n`;
    await createNoteInVault(targetPath, defaultContent);
    setSelectedWorkspaceName(cleanWs);
    setSelectedProjectId(targetPath);
  }, []);

  return {
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
  };
}

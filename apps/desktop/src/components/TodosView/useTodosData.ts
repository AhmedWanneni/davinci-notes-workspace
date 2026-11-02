import { useCallback, useMemo, useState } from "react";
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
import type { TodoFolder, TodoItem, TodoProject, TodoStatusFilter } from "./types";

export function useTodosData() {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const allFolderPaths = useWorkspaceStore((state) => state.allFolderPaths);
  const notesContent = useWorkspaceStore((state) => state.notesContent);
  const vaultPath = useWorkspaceStore((state) => state.vaultPath);

  const vaultName = useMemo(() => {
    if (!vaultPath) return "Vault";
    return vaultPath.split(/[/\\]/).pop() || "Vault";
  }, [vaultPath]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isMotherboard, setIsMotherboard] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>("all");
  const [motherboardLayout, setMotherboardLayout] = useState<"cards" | "list">("cards");

  const todoPaths = useMemo(() => {
    return allNotePaths.filter((p) => p.toLowerCase().startsWith("todos/"));
  }, [allNotePaths]);

  const projects: TodoProject[] = useMemo(() => {
    return todoPaths.map((path) => {
      const rel = path.replace(/^todos\//i, "");
      const parts = rel.split("/");
      const fileName = parts[parts.length - 1].replace(/\.md$/, "");
      const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : vaultName;
      const content = notesContent[path] ?? "";
      const sections = parseNoteTodos(content, path, folder, fileName);

      return {
        id: path,
        name: fileName,
        notePath: path,
        folder,
        sections,
      };
    });
  }, [notesContent, todoPaths, vaultName]);

  const folders: TodoFolder[] = useMemo(() => {
    const map = new Map<string, TodoProject[]>();
    for (const p of projects) {
      const fName = p.folder ?? vaultName;
      const existing = map.get(fName) ?? [];
      existing.push(p);
      map.set(fName, existing);
    }
    return Array.from(map.entries()).map(([name, pList]) => ({
      name,
      projects: pList,
    }));
  }, [projects, vaultName]);

  const activeProject = useMemo(() => {
    if (isMotherboard) return null;
    if (selectedProjectId) {
      const found = projects.find((p) => p.id === selectedProjectId);
      if (found) return found;
    }
    return projects[0] ?? null;
  }, [isMotherboard, projects, selectedProjectId]);

  const allTodos = useMemo(() => {
    const list: TodoItem[] = [];
    for (const p of projects) {
      for (const s of p.sections) {
        list.push(...s.todos);
      }
    }
    return list;
  }, [projects]);

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

  const createProject = useCallback(async (projectName: string, parentFolder?: string) => {
    const cleanName = projectName.trim() || "New Project";
    const dir = parentFolder ? `todos/${parentFolder}` : "todos";
    const targetPath = `${dir}/${cleanName}.md`;
    const defaultContent = `# ${cleanName}\n\n## Tasks\n- [ ] First task\n`;
    await createNoteInVault(targetPath, defaultContent);
    setIsMotherboard(false);
    setSelectedProjectId(targetPath);
  }, []);

  return {
    vaultName,
    projects,
    folders,
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
    allNotePaths,
    allFolderPaths,
  };
}

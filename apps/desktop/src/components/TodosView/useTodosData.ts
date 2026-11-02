import { useCallback, useMemo, useState } from "react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import {
  createFolder,
  createNoteInVault,
  deleteFolderInVault,
  deleteNoteInVault,
  writeNote,
} from "../../vault";
import {
  addLinkToTodoInContent,
  addReminderToTodoInContent,
  appendTodoToSectionInContent,
  parseNoteTodos,
  toggleTodoInContent,
  updateTodoTextInContent,
} from "./todoParser";
import type {
  TodoItem,
  TodoNote,
  TodoProject,
  TodoSection,
  TodoStatusFilter,
} from "./types";

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
  const [selectedNotePath, setSelectedNotePath] = useState<string>("");
  const [isMotherboard, setIsMotherboard] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>("all");
  const [motherboardLayout, setMotherboardLayout] = useState<"cards" | "list">(
    "cards",
  );

  const todoPaths = useMemo(() => {
    return allNotePaths.filter((p) => p.toLowerCase().startsWith("todos/"));
  }, [allNotePaths]);

  const projects: TodoProject[] = useMemo(() => {
    const folderMap = new Map<string, { name: string; folderPath: string }>();

    for (const f of allFolderPaths) {
      const norm = f.replace(/\\/g, "/").replace(/\/+$/, "");
      const parts = norm.split("/");
      if (parts.length === 2 && parts[0].toLowerCase() === "todos") {
        folderMap.set(norm, { name: parts[1], folderPath: norm });
      }
    }

    for (const p of todoPaths) {
      const norm = p.replace(/\\/g, "/");
      const parts = norm.split("/");
      if (parts.length >= 3 && parts[0].toLowerCase() === "todos") {
        const key = `todos/${parts[1]}`;
        if (!folderMap.has(key)) {
          folderMap.set(key, { name: parts[1], folderPath: key });
        }
      } else if (parts.length === 2 && parts[0].toLowerCase() === "todos") {
        if (!folderMap.has("todos")) {
          folderMap.set("todos", { name: "General", folderPath: "todos" });
        }
      }
    }

    const result: TodoProject[] = [];
    for (const { name, folderPath } of folderMap.values()) {
      const childNotes: TodoNote[] = [];
      const prefix = folderPath === "todos" ? "todos/" : `${folderPath}/`;

      for (const notePath of todoPaths) {
        const norm = notePath.replace(/\\/g, "/");
        const isDirect =
          folderPath === "todos"
            ? norm.startsWith("todos/") && norm.split("/").length === 2
            : norm.startsWith(prefix);

        if (isDirect) {
          const parts = norm.split("/");
          const fileName = parts[parts.length - 1].replace(/\.md$/, "");
          const content = notesContent[notePath] ?? "";
          const sections = parseNoteTodos(content, notePath, name, fileName);
          childNotes.push({ id: notePath, name: fileName, notePath, sections });
        }
      }

      const allSections: TodoSection[] = childNotes.flatMap((n) => n.sections);
      result.push({
        id: folderPath,
        name,
        folderPath,
        notePath: childNotes[0]?.notePath ?? "",
        notes: childNotes,
        folder: name,
        sections: allSections,
      });
    }

    return result;
  }, [allFolderPaths, notesContent, todoPaths]);

  const activeProject = useMemo(() => {
    if (isMotherboard) return null;
    if (selectedProjectId) {
      const found = projects.find((p) => p.id === selectedProjectId);
      if (found) return found;
    }
    return projects[0] ?? null;
  }, [isMotherboard, projects, selectedProjectId]);

  const activeNote = useMemo(() => {
    if (!activeProject) return null;
    if (selectedNotePath) {
      const note = activeProject.notes.find(
        (n) => n.notePath === selectedNotePath,
      );
      if (note) return note;
    }
    return activeProject.notes[0] ?? null;
  }, [activeProject, selectedNotePath]);

  const allTodos = useMemo(() => {
    return projects.flatMap((p) => p.sections.flatMap((s) => s.todos));
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

  const saveContent = useCallback(async (path: string, newContent: string) => {
    useWorkspaceStore.setState((s) => ({
      notesContent: { ...s.notesContent, [path]: newContent },
    }));
    await writeNote(path, newContent);
  }, []);

  const toggleTodo = useCallback(
    async (todo: TodoItem) => {
      const current = notesContent[todo.notePath] ?? "";
      const updated = toggleTodoInContent(
        current,
        todo.lineIndex,
        !todo.completed,
      );
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
      const updated = addReminderToTodoInContent(
        current,
        todo.lineIndex,
        dateStr,
      );
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

  const createProject = useCallback(async (projectName: string) => {
    const cleanName = projectName.trim() || "New Project";
    const folderPath = `todos/${cleanName}`;
    await createFolder(folderPath);
    const store = useWorkspaceStore.getState();
    if (!store.allFolderPaths.includes(folderPath)) {
      store.updateAllFolderPaths([...store.allFolderPaths, folderPath].sort());
    }
    const starterNotePath = `${folderPath}/${cleanName}.md`;
    await createNoteInVault(
      starterNotePath,
      `# ${cleanName}\n\n## Tasks\n- [ ] First task\n`,
    );
    setIsMotherboard(false);
    setSelectedProjectId(folderPath);
    setSelectedNotePath(starterNotePath);
  }, []);

  const createTodoNote = useCallback(
    async (projectFolderPath: string, todoName: string) => {
      const cleanTitle = todoName.trim() || "New Todo";
      const notePath = `${projectFolderPath}/${cleanTitle}.md`;
      await createNoteInVault(
        notePath,
        `# ${cleanTitle}\n\n## Tasks\n- [ ] First task\n`,
      );
      setSelectedNotePath(notePath);
    },
    [],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      if (project.folderPath !== "todos") {
        await deleteFolderInVault(project.folderPath);
      } else {
        for (const n of project.notes) {
          await deleteNoteInVault(n.notePath);
        }
      }
      if (selectedProjectId === projectId) {
        setSelectedProjectId("");
        setSelectedNotePath("");
      }
    },
    [projects, selectedProjectId],
  );

  const deleteTodoNote = useCallback(
    async (notePath: string) => {
      await deleteNoteInVault(notePath);
      if (selectedNotePath === notePath) {
        setSelectedNotePath("");
      }
    },
    [selectedNotePath],
  );

  return {
    vaultName,
    projects,
    activeProject,
    activeNote,
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
    selectedNotePath,
    setSelectedNotePath,
    isMotherboard,
    setIsMotherboard,
    toggleTodo,
    updateTodoText,
    addLinkToTodo,
    addReminderToTodo,
    addTodoToSection,
    createProject,
    createTodoNote,
    deleteProject,
    deleteTodoNote,
    allNotePaths,
  };
}

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import {
  createFolder,
  createNoteInVault,
  deleteFolderInVault,
  deleteNoteInVault,
} from "../../vault";
import {
  addLinkToTodoInContent,
  addReminderToTodoInContent,
  appendTodoToSectionInContent,
  toggleTodoInContent,
  updateTodoTextInContent,
} from "./todoParser";
import { buildTodoProjects } from "./buildTodoProjects";
import { useTodosUIStore } from "./useTodosUIStore";
import type { TodoProject } from "./types";

export function useTodosData() {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const allFolderPaths = useWorkspaceStore((state) => state.allFolderPaths);
  const todoNotesContent = useWorkspaceStore(
    useShallow((state) => {
      const subset: Record<string, string> = {};
      for (const [k, v] of Object.entries(state.notesContent)) {
        if (k.toLowerCase().startsWith("todos/")) {
          subset[k] = v;
        }
      }
      return subset;
    }),
  );
  const vaultPath = useWorkspaceStore((state) => state.vaultPath);

  const vaultName = useMemo(() => {
    if (!vaultPath) return "Vault";
    return vaultPath.split(/[/\\]/).pop() || "Vault";
  }, [vaultPath]);

  const {
    selectedProjectId, setSelectedProjectId,
    selectedNotePath, setSelectedNotePath,
    isMotherboard, setIsMotherboard,
    searchQuery, setSearchQuery,
    selectedMonth, setSelectedMonth,
    statusFilter, setStatusFilter,
    motherboardLayout, setMotherboardLayout,
  } = useTodosUIStore();

  const todoPaths = useMemo(
    () => allNotePaths.filter((p) => p.toLowerCase().startsWith("todos/")),
    [allNotePaths],
  );

  const projects: TodoProject[] = useMemo(
    () => buildTodoProjects(allFolderPaths, todoPaths, todoNotesContent),
    [allFolderPaths, todoPaths, todoNotesContent],
  );

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
      const note = activeProject.notes.find((n) => n.notePath === selectedNotePath);
      if (note) return note;
    }
    return activeProject.notes[0] ?? null;
  }, [activeProject, selectedNotePath]);

  const allTodos = useMemo(
    () => projects.flatMap((p) => p.sections.flatMap((s) => s.todos)),
    [projects],
  );

  const monthsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const todo of allTodos) {
      if (todo.month) map.set(todo.month, (map.get(todo.month) ?? 0) + 1);
    }
    return map;
  }, [allTodos]);

  const saveContent = useCallback(async (path: string, newContent: string) => {
    useWorkspaceStore.setState((s) => ({
      notesContent: { ...s.notesContent, [path]: newContent },
    }));
    await import("../../vault").then((v) => v.writeNote(path, newContent));
  }, []);

  const toggleTodo = useCallback(
    async (notePath: string, line: number, done: boolean) => {
      const current = useWorkspaceStore.getState().notesContent[notePath] ?? "";
      await saveContent(notePath, toggleTodoInContent(current, line, done));
    },
    [saveContent],
  );

  const updateTodoText = useCallback(
    async (notePath: string, line: number, text: string) => {
      const current = useWorkspaceStore.getState().notesContent[notePath] ?? "";
      await saveContent(notePath, updateTodoTextInContent(current, line, text));
    },
    [saveContent],
  );

  const addLinkToTodo = useCallback(
    async (notePath: string, line: number, linkedPath: string) => {
      const current = useWorkspaceStore.getState().notesContent[notePath] ?? "";
      await saveContent(notePath, addLinkToTodoInContent(current, line, linkedPath));
    },
    [saveContent],
  );

  const addReminderToTodo = useCallback(
    async (notePath: string, line: number, reminder: string) => {
      const current = useWorkspaceStore.getState().notesContent[notePath] ?? "";
      await saveContent(notePath, addReminderToTodoInContent(current, line, reminder));
    },
    [saveContent],
  );

  const addTodoToSection = useCallback(
    async (notePath: string, sectionName: string, text: string) => {
      const current = useWorkspaceStore.getState().notesContent[notePath] ?? "";
      await saveContent(notePath, appendTodoToSectionInContent(current, sectionName, text));
    },
    [saveContent],
  );

  const createProject = useCallback(async (projectName: string) => {
    const cleanName = projectName.trim() || "New Project";
    const folderPath = `todos/${cleanName}`;
    await createFolder(folderPath);
    const store = useWorkspaceStore.getState();
    if (!store.allFolderPaths.includes(folderPath)) {
      store.updateAllFolderPaths([...store.allFolderPaths, folderPath].sort());
    }
    setIsMotherboard(false);
    setSelectedProjectId(folderPath);
    setSelectedNotePath("");
  }, [setIsMotherboard, setSelectedNotePath, setSelectedProjectId]);

  const createTodoNote = useCallback(
    async (projectFolderPath: string, todoName: string) => {
      const cleanTitle = todoName.trim() || "New Todo";
      const notePath = `${projectFolderPath}/${cleanTitle}.md`;
      await createNoteInVault(notePath, `# ${cleanTitle}\n\n## Tasks\n- [ ] First task\n`);
      setSelectedNotePath(notePath);
    },
    [setSelectedNotePath],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      if (project.folderPath !== "todos") {
        await deleteFolderInVault(project.folderPath);
      } else {
        for (const n of project.notes) await deleteNoteInVault(n.notePath);
      }
      if (selectedProjectId === projectId) {
        setSelectedProjectId("");
        setSelectedNotePath("");
      }
    },
    [projects, selectedProjectId, setSelectedNotePath, setSelectedProjectId],
  );

  const deleteTodoNote = useCallback(
    async (notePath: string) => {
      await deleteNoteInVault(notePath);
      if (selectedNotePath === notePath) setSelectedNotePath("");
    },
    [selectedNotePath, setSelectedNotePath],
  );

  return {
    vaultName, projects, activeProject, activeNote, allTodos, monthsMap,
    searchQuery, setSearchQuery, selectedMonth, setSelectedMonth,
    statusFilter, setStatusFilter, motherboardLayout, setMotherboardLayout,
    selectedProjectId, setSelectedProjectId, selectedNotePath, setSelectedNotePath,
    isMotherboard, setIsMotherboard, toggleTodo, updateTodoText, addLinkToTodo,
    addReminderToTodo, addTodoToSection, createProject, createTodoNote,
    deleteProject, deleteTodoNote, allNotePaths,
  };
}

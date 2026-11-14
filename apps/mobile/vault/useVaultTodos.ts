import { useState, useCallback, useEffect, useRef } from "react";
import { defaultVaultManager } from "./vaultManager";
import { atomicWriteNote } from "./atomicNoteWriter";
import { defaultVaultIndexer } from "../indexer";
import {
  parseTodosFromMarkdown,
  toggleTodoInMarkdown,
  removeTodoFromMarkdown,
  appendTodoToMarkdown,
} from "../components/todos/todoParser";
import { scheduleTodoReminder } from "../notifications/todoNotifications";
import type { MobileTodoItem, MobileTodoProject, MobileTodoList } from "../components/todos/types";

export interface UseVaultTodosResult {
  todos: MobileTodoItem[];
  projects: MobileTodoProject[];
  openedTodoPath: string;
  setOpenedTodoPath: (path: string) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
  toggleTodo: (notePath: string, lineIndex: number, nextDone: boolean) => Promise<void>;
  deleteTodo: (notePath: string, lineIndex: number) => Promise<void>;
  addTodoItem: (notePath: string, text: string, duration?: string, reminder?: string) => Promise<void>;
  createProject: (projectName: string) => Promise<void>;
  createTodoList: (projectName: string, listName: string) => Promise<string>;
  deleteProject: (projectName: string) => Promise<void>;
  deleteTodoList: (notePath: string) => Promise<void>;
}

const DEFAULT_DAILY_PATH = "Todos/Daily/Today.md";
let lastOpenedTodoPath = DEFAULT_DAILY_PATH;
const INITIAL_DAILY_CONTENT = `## Daily routine
- [x] Drink a glass of water [5 min]
- [x] Meditate to relax [15 min]
- [ ] Stretch for 10 minutes [10 min]
- [ ] Go for a short walk [20 min]
`;

export function useVaultTodos(): UseVaultTodosResult {
  const [todos, setTodos] = useState<MobileTodoItem[]>([]);
  const [projects, setProjects] = useState<MobileTodoProject[]>([]);
  const [openedTodoPath, setOpenedTodoPathState] = useState<string>(lastOpenedTodoPath);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const setOpenedTodoPath = useCallback((path: string) => {
    lastOpenedTodoPath = path;
    setOpenedTodoPathState(path);
  }, []);

  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) {
        setTodos([]);
        setProjects([]);
        return;
      }

      if (!(await adapter.statFile("Todos/Daily")).exists) await adapter.createFolder("Todos/Daily");
      if (!(await adapter.statFile(DEFAULT_DAILY_PATH)).exists) {
        await atomicWriteNote(adapter, DEFAULT_DAILY_PATH, INITIAL_DAILY_CONTENT);
      }

      const scan = await adapter.scanVault();
      const projMap = new Map<string, { folderPath: string; todoLists: MobileTodoList[]; todoCount: number }>();
      projMap.set("Daily", { folderPath: "Todos/Daily", todoLists: [], todoCount: 0 });

      for (const f of scan.folders) {
        const parts = f.replace(/\\/g, "/").replace(/\/+$/, "").split("/");
        if (parts.length === 2 && parts[0].toLowerCase() === "todos" && !projMap.has(parts[1])) {
          projMap.set(parts[1], { folderPath: `Todos/${parts[1]}`, todoLists: [], todoCount: 0 });
        }
      }

      const todoNotes = scan.notes.filter((p) => /todos[/$\\]/i.test(p));
      const allItems: MobileTodoItem[] = [];

      for (const notePath of todoNotes) {
        try {
          const file = await adapter.readNote(notePath);
          cacheRef.current.set(notePath, file.content);
          const parts = notePath.replace(/\.md$/i, "").split("/");
          const pName = parts.length >= 3 && parts[0].toLowerCase() === "todos" ? parts[1] : "Daily";
          const listName = parts[parts.length - 1];
          const sections = parseTodosFromMarkdown(file.content, notePath, pName);
          let noteTodoCount = 0;
          for (const s of sections) {
            for (const t of s.todos) {
              allItems.push(t);
              noteTodoCount += 1;
            }
          }
          const curProj = projMap.get(pName) ?? { folderPath: `Todos/${pName}`, todoLists: [], todoCount: 0 };
          curProj.todoLists.push({ id: notePath, name: listName, notePath, projectName: pName, todoCount: noteTodoCount });
          curProj.todoCount += noteTodoCount;
          projMap.set(pName, curProj);
        } catch {
          // Skip unreadable note
        }
      }

      const derivedProjects: MobileTodoProject[] = Array.from(projMap.entries()).map(([name, data]) => ({
        id: name.toLowerCase(),
        name,
        folderPath: data.folderPath,
        todoLists: data.todoLists,
        noteCount: data.todoLists.length,
        todoCount: data.todoCount,
      }));

      derivedProjects.sort((a, b) => (a.name === "Daily" ? -1 : b.name === "Daily" ? 1 : a.name.localeCompare(b.name)));
      setTodos(allItems);
      setProjects(derivedProjects);
    } catch (err) {
      console.warn("[useVaultTodos] Error loading vault todos:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleTodo = useCallback(async (notePath: string, lineIndex: number, nextDone: boolean) => {
    const { adapter } = await defaultVaultManager.getActiveAdapter();
    if (!adapter) return;
    const current = cacheRef.current.get(notePath) ?? (await adapter.readNote(notePath)).content;
    const updated = toggleTodoInMarkdown(current, lineIndex, nextDone);
    cacheRef.current.set(notePath, updated);
    await atomicWriteNote(adapter, notePath, updated);
    void defaultVaultIndexer.indexVault(adapter, false);
    setTodos((prev) => prev.map((t) => (t.notePath === notePath && t.lineIndex === lineIndex ? { ...t, completed: nextDone } : t)));
  }, []);

  const deleteTodo = useCallback(async (notePath: string, lineIndex: number) => {
    const { adapter } = await defaultVaultManager.getActiveAdapter();
    if (!adapter) return;
    const current = cacheRef.current.get(notePath) ?? (await adapter.readNote(notePath)).content;
    const updated = removeTodoFromMarkdown(current, lineIndex);
    cacheRef.current.set(notePath, updated);
    await atomicWriteNote(adapter, notePath, updated);
    void defaultVaultIndexer.indexVault(adapter, false);
    await loadTodos();
  }, [loadTodos]);

  const addTodoItem = useCallback(
    async (notePath: string, text: string, duration?: string, reminder?: string) => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      let current = "";
      try {
        current = (await adapter.readNote(notePath)).content;
      } catch {
        current = "## Tasks\n";
      }
      const updated = appendTodoToMarkdown(current, "Tasks", text, duration, reminder);
      cacheRef.current.set(notePath, updated);
      await atomicWriteNote(adapter, notePath, updated);
      void defaultVaultIndexer.indexVault(adapter, false);
      if (reminder) void scheduleTodoReminder(text, reminder, notePath.split("/").pop());
      await loadTodos();
    },
    [loadTodos],
  );

  const createProject = useCallback(
    async (projectName: string) => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      const clean = projectName.trim();
      if (!adapter || !clean) return;
      const folderPath = `Todos/${clean}`;
      await adapter.createFolder(folderPath);
      const notePath = `${folderPath}/Tasks.md`;
      await atomicWriteNote(adapter, notePath, "## Tasks\n- [ ] First task\n");
      void defaultVaultIndexer.indexVault(adapter, false);
      setOpenedTodoPath(notePath);
      await loadTodos();
    },
    [loadTodos],
  );

  const createTodoList = useCallback(
    async (projectName: string, listName: string): Promise<string> => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      const pClean = projectName.trim() || "Daily";
      const lClean = listName.trim();
      const notePath = `Todos/${pClean}/${lClean}.md`;
      if (!adapter || !lClean) return notePath;
      await adapter.createFolder(`Todos/${pClean}`);
      await atomicWriteNote(adapter, notePath, `## ${lClean}\n- [ ] First task\n`);
      void defaultVaultIndexer.indexVault(adapter, false);
      setOpenedTodoPath(notePath);
      await loadTodos();
      return notePath;
    },
    [loadTodos],
  );

  const deleteProject = useCallback(
    async (projectName: string) => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      const clean = projectName.trim();
      if (!adapter || !clean || clean.toLowerCase() === "daily") return;
      await adapter.deleteNote(`Todos/${clean}`);
      void defaultVaultIndexer.indexVault(adapter, false);
      if (openedTodoPath.toLowerCase().startsWith(`todos/${clean.toLowerCase()}/`)) {
        setOpenedTodoPath(DEFAULT_DAILY_PATH);
      }
      await loadTodos();
    },
    [openedTodoPath, loadTodos],
  );

  const deleteTodoList = useCallback(
    async (notePath: string) => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter || !notePath) return;
      await adapter.deleteNote(notePath);
      void defaultVaultIndexer.indexVault(adapter, false);
      if (openedTodoPath === notePath) {
        setOpenedTodoPath(DEFAULT_DAILY_PATH);
      }
      await loadTodos();
    },
    [openedTodoPath, loadTodos],
  );

  useEffect(() => { void loadTodos(); }, [loadTodos]);

  return {
    todos, projects, openedTodoPath, setOpenedTodoPath, isLoading,
    refresh: loadTodos, toggleTodo, deleteTodo, addTodoItem, createProject, createTodoList,
    deleteProject, deleteTodoList,
  };
}

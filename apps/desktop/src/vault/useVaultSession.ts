import { useState, useRef, useEffect, useCallback } from "react";
import type { GraphIndex, TagIndex } from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import {
  getVaultIndexDb,
  openAndIndexVault,
  openAndIndexVaultFromPicker,
  reconcileVaultChanges,
  subscribeVaultChanges,
  vaultWatchCoordinator,
  listNotes,
  writeNote,
  queryFullGraphIndex,
  withVaultWatchSuppressed,
  listFolders,
  readNote,
  withDbLock,
  retryOnSqliteBusy,
} from "./index";
import { clearSaveTimer } from "../state/saveTimers";
import { createNoteInVault } from "./createNoteInVault";
import { createFolderInVault } from "./createFolderInVault";
import { initialNoteContent } from "./initialNoteContent";
import { resolveUniqueNotePath } from "./resolveUniqueNotePath";

function resolveUniqueCanvasPath(existingPaths: readonly string[]): string {
  const stem = "Untitled";
  const candidate = `${stem}.canvas`;
  if (!existingPaths.includes(candidate)) return candidate;
  let counter = 1;
  while (existingPaths.includes(`${stem} ${counter}.canvas`)) {
    counter += 1;
  }
  return `${stem} ${counter}.canvas`;
}

const FIXTURE_VAULT = __FIXTURE_VAULT_PATH__;
const LARGE_FIXTURE_VAULT = __LARGE_FIXTURE_VAULT_PATH__;

export function useVaultSession() {
  const [log, setLog] = useState<string[]>([]);
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [graph, setGraph] = useState<GraphIndex | null>(null);
  const reconcileCount = useRef(0);
  const noteCreationQueue = useRef<Promise<void>>(Promise.resolve());

  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const initializeVault = useWorkspaceStore((state) => state.initializeVault);
  const updateAllPaths = useWorkspaceStore((state) => state.updateAllPaths);
  const updateAllFolderPaths = useWorkspaceStore(
    (state) => state.updateAllFolderPaths,
  );
  const incrementVaultUpdateCounter = useWorkspaceStore(
    (state) => state.incrementVaultUpdateCounter,
  );
  const openNote = useWorkspaceStore((state) => state.openNote);

  const append = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-12), line]);
    console.info(`[vault] ${line}`);
  }, []);

  const handleVaultLoaded = useCallback(
    async (
      path: string,
      count: number,
      elapsed: number,
      tagIndex: TagIndex,
    ) => {
      setVaultPath(path);
      useWorkspaceStore.getState().setVaultPath(path);
      append(`indexed ${count} notes in ${elapsed} ms (${path})`);
      const paths = await listNotes();
      const folders = await listFolders();
      let fullGraph = { nodes: [], edges: [] } as GraphIndex;
      try {
        const db = await getVaultIndexDb();
        fullGraph = await withDbLock(() => queryFullGraphIndex(db));
        setGraph(fullGraph);
      } catch (graphError) {
        console.warn("[vault] Failed to load full graph index:", graphError);
      }
      await initializeVault(paths, folders, fullGraph, tagIndex);
    },
    [append, initializeVault],
  );

  const loadVaultByMethod = useCallback(
    async (
      loader: () => Promise<{
        vaultPath: string;
        noteCount: number;
        elapsedMs: number;
        tagIndex: TagIndex;
      }>,
    ) => {
      setIsLoadingVault(true);
      setVaultError(null);
      try {
        const result = await loader();
        await handleVaultLoaded(
          result.vaultPath,
          result.noteCount,
          result.elapsedMs,
          result.tagIndex,
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        append(msg);
        setVaultError(msg);
      } finally {
        setIsLoadingVault(false);
      }
    },
    [append, handleVaultLoaded],
  );

  const createNewNote = useCallback(
    (title?: string, parentFolder = "") => {
      const create = async () => {
        const workspace = useWorkspaceStore.getState();
        const currentPaths = Array.from(
          new Set([...workspace.allNotePaths, ...workspace.openNotes]),
        );
        const cleanTitle = title?.trim();
        const prefix = parentFolder
          ? `${parentFolder.replace(/\/+$/, "")}/`
          : "";
        const preferredPath = cleanTitle
          ? cleanTitle.endsWith(".md")
            ? `${prefix}${cleanTitle}`
            : `${prefix}${cleanTitle}.md`
          : `${prefix}Untitled.md`;
        const newPath = resolveUniqueNotePath(currentPaths, preferredPath);

        if (currentPaths.includes(newPath)) {
          append(`Note already exists: ${newPath}`);
          await openNote(newPath);
          return newPath;
        }

        const defaultContent = initialNoteContent(newPath);

        try {
          await createNoteInVault(newPath, defaultContent);
          useWorkspaceStore.setState((state) => ({
            allNotePaths: Array.from(
              new Set([...state.allNotePaths, ...currentPaths, newPath]),
            ),
            notesContent: { ...state.notesContent, [newPath]: defaultContent },
          }));
          await openNote(newPath);
          append(`Created new note: ${newPath}`);
          return newPath;
        } catch (e) {
          append(
            `Error creating note: ${e instanceof Error ? e.message : String(e)}`,
          );
          return null;
        }
      };

      const result = noteCreationQueue.current.then(create);
      noteCreationQueue.current = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
    [append, openNote],
  );

  const createNewFolder = useCallback(
    async (parentFolder = "") => {
      try {
        const folderPath = await createFolderInVault(parentFolder);
        append(`Created folder: ${folderPath}`);
        return folderPath;
      } catch (e) {
        append(
          `Error creating folder: ${e instanceof Error ? e.message : String(e)}`,
        );
        return null;
      }
    },
    [append],
  );

  const createNewCanvas = useCallback(
    async (title?: string) => {
      const currentPaths = useWorkspaceStore.getState().allNotePaths;
      const cleanTitle = title?.trim();
      const newPath = cleanTitle
        ? cleanTitle.endsWith(".canvas")
          ? cleanTitle
          : `${cleanTitle}.canvas`
        : resolveUniqueCanvasPath(currentPaths);

      if (currentPaths.includes(newPath)) {
        append(`Canvas already exists: ${newPath}`);
        await openNote(newPath);
        return;
      }

      const defaultContent = JSON.stringify({ nodes: [], edges: [] }, null, 2);
      try {
        await withVaultWatchSuppressed(async () => {
          await writeNote(newPath, defaultContent);
          updateAllPaths([...currentPaths, newPath]);
          useWorkspaceStore.setState((state) => ({
            notesContent: { ...state.notesContent, [newPath]: defaultContent },
          }));
          await openNote(newPath);
        });
        append(`Created new canvas: ${newPath}`);
      } catch (e) {
        append(
          `Error creating canvas: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
    [append, openNote, updateAllPaths],
  );

  const handleLinkClick = useCallback(
    async (targetRaw: string) => {
      const targetLower = targetRaw.toLowerCase();
      const foundPath = allNotePaths.find((path) => {
        const stem =
          path
            .replace(/\.(md|canvas)$/i, "")
            .split("/")
            .pop() ?? path;
        return stem.toLowerCase() === targetLower;
      });
      if (foundPath) {
        await openNote(foundPath);
      } else {
        await createNewNote(targetRaw);
      }
    },
    [allNotePaths, createNewNote, openNote],
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    subscribeVaultChanges(async (batch) => {
      try {
        if (!vaultWatchCoordinator.shouldProcessBatch()) return;
        reconcileCount.current += 1;
        append(
          `watcher batch #${reconcileCount.current}: +${batch.changed.length} ~${batch.removed.length} removed`,
        );
        const { tagIndex } = useWorkspaceStore.getState();
        const { updated, removed } = await retryOnSqliteBusy(() =>
          reconcileVaultChanges(batch, undefined, tagIndex ?? undefined),
        );
        append(`reconciled ${updated} path(s) in SQLite`);
        const paths = await listNotes();
        const folders = await listFolders();
        const state = useWorkspaceStore.getState();
        const removedPaths = new Set(removed);
        const renamed = batch.renamed.filter(
          ({ from, to }) => paths.includes(to) && removedPaths.has(from),
        );
        const renamedFrom = new Set(renamed.map(({ from }) => from));
        const renamedTo = new Map(renamed.map(({ from, to }) => [from, to]));
        const conflictPaths: string[] = [];

        for (const path of batch.changed) {
          if (!state.openNotes.includes(path) || state.dirtyNotes.has(path)) {
            if (state.dirtyNotes.has(path)) conflictPaths.push(path);
            continue;
          }
          try {
            const file = await readNote(path);
            useWorkspaceStore
              .getState()
              .replaceLoadedNoteContent(path, file.content);
          } catch {
            // Reconciliation already treats a disappearing file as removed.
          }
        }

        useWorkspaceStore.setState((current) => {
          const nextContent = { ...current.notesContent };
          const nextDirty = new Set(current.dirtyNotes);
          const nextOpen = current.openNotes
            .filter((path) => !removedPaths.has(path) || renamedFrom.has(path))
            .map((path) => renamedTo.get(path) ?? path);
          for (const path of removedPaths) {
            clearSaveTimer(path);
            if (!renamedFrom.has(path)) {
              delete nextContent[path];
              nextDirty.delete(path);
            }
          }
          for (const { from, to } of renamed) {
            if (nextContent[from] !== undefined) {
              nextContent[to] = nextContent[from];
              delete nextContent[from];
            }
            if (nextDirty.delete(from)) nextDirty.add(to);
          }
          return {
            openNotes: nextOpen,
            activeNotePath: current.activeNotePath
              ? (renamedTo.get(current.activeNotePath) ??
                (removedPaths.has(current.activeNotePath)
                  ? (nextOpen.at(-1) ?? null)
                  : current.activeNotePath))
              : null,
            notesContent: nextContent,
            dirtyNotes: nextDirty,
          };
        });
        updateAllPaths(paths);
        updateAllFolderPaths(folders);
        incrementVaultUpdateCounter();
        try {
          const db = await getVaultIndexDb();
          const fullGraph = await withDbLock(() => queryFullGraphIndex(db));
          setGraph(fullGraph);
        } catch (graphError) {
          console.warn("[vault] Failed to refresh graph index:", graphError);
        }
        if (conflictPaths.length > 0) {
          setVaultError(
            `External changes were detected while editing: ${conflictPaths.join(", ")}. Your unsaved editor content was kept.`,
          );
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        append(`watcher batch error: ${msg}`);
        console.error("[vault] Watcher reconciliation error:", error);
      }
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch((err) => {
        console.error("[vault] Failed to subscribe to vault changes:", err);
      });
    return () => {
      unlisten?.();
    };
  }, [
    updateAllPaths,
    incrementVaultUpdateCounter,
    append,
    updateAllFolderPaths,
    setVaultError,
  ]);

  return {
    log,
    vaultPath,
    setVaultPath,
    isLoadingVault,
    vaultError,
    setVaultError,
    graph,
    loadVaultByMethod,
    createNewNote,
    createNewFolder,
    createNewCanvas,
    handleLinkClick,
    openFixture: () =>
      void loadVaultByMethod(() => openAndIndexVault(FIXTURE_VAULT)),
    openLargeFixture: () =>
      void loadVaultByMethod(() => openAndIndexVault(LARGE_FIXTURE_VAULT)),
    openPicker: () => void loadVaultByMethod(openAndIndexVaultFromPicker),
  };
}

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
} from "./index";
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

  const openNotes = useWorkspaceStore((state) => state.openNotes);
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
  const closeNote = useWorkspaceStore((state) => state.closeNote);

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
      const db = await getVaultIndexDb();
      const fullGraph = await queryFullGraphIndex(db);
      setGraph(fullGraph);
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
    async (title?: string, parentFolder = "") => {
      const currentPaths = useWorkspaceStore.getState().allNotePaths;
      const cleanTitle = title?.trim();
      const prefix = parentFolder ? `${parentFolder.replace(/\/+$/, "")}/` : "";
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
      if (!vaultWatchCoordinator.shouldProcessBatch()) return;
      reconcileCount.current += 1;
      append(
        `watcher batch #${reconcileCount.current}: +${batch.changed.length} ~${batch.removed.length} removed`,
      );
      const { tagIndex } = useWorkspaceStore.getState();
      const { updated } = await reconcileVaultChanges(
        batch,
        undefined,
        tagIndex ?? undefined,
      );
      append(`reconciled ${updated} path(s) in SQLite`);
      const paths = await listNotes();
      const folders = await listFolders();
      updateAllPaths(paths);
      updateAllFolderPaths(folders);
      incrementVaultUpdateCounter();
      const db = await getVaultIndexDb();
      const fullGraph = await queryFullGraphIndex(db);
      setGraph(fullGraph);
      for (const removed of batch.removed) {
        if (openNotes.includes(removed)) await closeNote(removed);
      }
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [
    openNotes,
    closeNote,
    updateAllPaths,
    incrementVaultUpdateCounter,
    append,
    updateAllFolderPaths,
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

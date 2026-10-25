import { useEffect, useRef } from "react";
import type { GraphIndex } from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import {
  getVaultIndexDb,
  reconcileVaultChanges,
  subscribeVaultChanges,
  vaultWatchCoordinator,
  listNotes,
  listFolders,
  readNote,
  withDbLock,
  retryOnSqliteBusy,
  diskStateTracker,
  classifyDiskChange,
  queryFullGraphIndex,
} from "./index";
import { clearSaveTimer } from "../state/saveTimers";
import {
  BOOKMARKS_JSON_PATH,
  parseBookmarks,
  useBookmarkStore,
} from "../bookmarks";

export interface VaultWatcherSubscriptionOptions {
  append: (line: string) => void;
  setGraph: (graph: GraphIndex) => void;
  setVaultError: (error: string | null) => void;
}

export function useVaultWatcherSubscription({
  append,
  setGraph,
  setVaultError,
}: VaultWatcherSubscriptionOptions): void {
  const reconcileCount = useRef(0);
  const updateAllPaths = useWorkspaceStore((state) => state.updateAllPaths);
  const updateAllFolderPaths = useWorkspaceStore(
    (state) => state.updateAllFolderPaths,
  );
  const incrementVaultUpdateCounter = useWorkspaceStore(
    (state) => state.incrementVaultUpdateCounter,
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
          if (!state.openNotes.includes(path)) continue;
          if (!state.dirtyNotes.has(path)) {
            try {
              const file = await readNote(path);
              diskStateTracker.set(path, {
                mtime: file.mtime,
                size: file.size,
                content: file.content,
              });
              useWorkspaceStore
                .getState()
                .replaceLoadedNoteContent(path, file.content);
            } catch {
              // Disappearing file treated as removed
            }
            continue;
          }

          try {
            const file = await readNote(path);
            const lastKnown = diskStateTracker.get(path);
            const classification = classifyDiskChange(
              lastKnown ? lastKnown.content : "",
              file.content,
            );

            if (classification.type === "pure_append") {
              const currentContent =
                useWorkspaceStore.getState().notesContent[path] ?? "";
              const merged = currentContent + classification.tail;
              diskStateTracker.set(path, {
                mtime: file.mtime,
                size: file.size,
                content: file.content,
              });
              useWorkspaceStore
                .getState()
                .replaceLoadedNoteContent(path, merged);
            } else if (classification.type === "touched_only") {
              diskStateTracker.set(path, {
                mtime: file.mtime,
                size: file.size,
                content: file.content,
              });
            } else {
              clearSaveTimer(path);
              useWorkspaceStore.setState((current) => {
                const next = new Map(current.conflictNotes);
                next.set(path, file.content);
                return { conflictNotes: next };
              });
              conflictPaths.push(path);
            }
          } catch {
            // Error reading file
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
            diskStateTracker.remove(path);
            if (!renamedFrom.has(path)) {
              delete nextContent[path];
              nextDirty.delete(path);
            }
          }
          for (const { from, to } of renamed) {
            const lastKnown = diskStateTracker.get(from);
            if (lastKnown) {
              diskStateTracker.remove(from);
              diskStateTracker.set(to, lastKnown);
            }
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

        if (batch.changed.includes(BOOKMARKS_JSON_PATH)) {
          try {
            const bFile = await readNote(BOOKMARKS_JSON_PATH);
            const parsed = parseBookmarks(bFile.content);
            useBookmarkStore.getState().mergeExternalBookmarks(parsed.bookmarks);
          } catch {
            // Ignore missing/unreadable file
          }
        }
        for (const { from, to } of renamed) {
          useBookmarkStore.getState().remapPath(from, to);
        }
        for (const path of removedPaths) {
          if (!renamedFrom.has(path)) {
            useBookmarkStore.getState().markMissing(path);
          }
        }
        for (const path of batch.changed) {
          useBookmarkStore.getState().clearMissing(path);
        }
        try {
          const db = await getVaultIndexDb();
          const fullGraph = await withDbLock(() => queryFullGraphIndex(db));
          setGraph(fullGraph);
        } catch (graphError) {
          console.warn("[vault] Failed to refresh graph index:", graphError);
        }
        if (conflictPaths.length > 0) {
          setVaultError(
            `External changes were detected while editing: ${conflictPaths.join(", ")}. Please resolve the conflict in the editor.`,
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
    setGraph,
  ]);
}

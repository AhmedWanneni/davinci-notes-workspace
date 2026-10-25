import { removeNoteFromTagIndex } from "@app/indexer";
import { isHiddenOrSystemPath } from "../components/FileTree/getDropEffect";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { clearSaveTimer } from "../state/saveTimers";
import { clearH1RenameTimer } from "./h1DrivenRename";
import { removeNoteFromGraph } from "./removeNoteFromGraph";
import {
  getVaultIndexDb,
  removeNotesBatch,
  withDbLock,
  withDbTransaction,
} from "./sqliteIndex";
import { deleteFolder } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { useBookmarkStore } from "../bookmarks/bookmarkStore";

export type DeleteFolderResult =
  | { ok: true }
  | { ok: false; reason: "cannot-delete-root" | "hidden-path" | "missing" };

/** Canonical folder delete: disk removal, child note index cleanup, workspace tab cleanup. */
export async function deleteFolderInVault(
  folderPath: string,
): Promise<DeleteFolderResult> {
  const normalized = folderPath.trim().replace(/\/+$/, "");
  if (!normalized || normalized === "." || normalized === "/") {
    return { ok: false, reason: "cannot-delete-root" };
  }

  if (isHiddenOrSystemPath(normalized)) {
    return { ok: false, reason: "hidden-path" };
  }

  const state = useWorkspaceStore.getState();
  if (!state.allFolderPaths.includes(normalized)) {
    return { ok: false, reason: "missing" };
  }

  const prefix = `${normalized}/`;
  const deletedFolderPaths = new Set(
    state.allFolderPaths.filter(
      (p) => p === normalized || p.startsWith(prefix),
    ),
  );
  const deletedNotePaths = state.allNotePaths.filter((p) =>
    p.startsWith(prefix),
  );

  return withVaultWatchSuppressed(async () => {
    await deleteFolder(normalized);

    const updatedFolders = state.allFolderPaths.filter(
      (p) => !deletedFolderPaths.has(p),
    );
    const updatedNotes = state.allNotePaths.filter(
      (p) => !p.startsWith(prefix),
    );
    const remainingOpenNotes = state.openNotes.filter(
      (p) => !p.startsWith(prefix),
    );
    const nextActiveNote =
      state.activeNotePath && state.activeNotePath.startsWith(prefix)
        ? (remainingOpenNotes[0] ?? null)
        : state.activeNotePath;
    const nextNotesContent = { ...state.notesContent };
    const nextDirtyNotes = new Set(state.dirtyNotes);
    for (const notePath of deletedNotePaths) {
      delete nextNotesContent[notePath];
      nextDirtyNotes.delete(notePath);
    }

    // The disk operation has succeeded, so remove it from the rendered tree
    // before the potentially large serialized SQLite cleanup completes.
    useWorkspaceStore.setState((current) => ({
      allFolderPaths: updatedFolders,
      allNotePaths: updatedNotes,
      openNotes: remainingOpenNotes,
      activeNotePath: nextActiveNote,
      notesContent: nextNotesContent,
      dirtyNotes: nextDirtyNotes,
      vaultUpdateCounter: current.vaultUpdateCounter + 1,
    }));

    const db = await getVaultIndexDb();
    const tagIndex = useWorkspaceStore.getState().tagIndex;

    await withDbLock(async () => {
      await withDbTransaction(db, async () => {
        if (deletedNotePaths.length > 0) {
          await removeNotesBatch(db, deletedNotePaths);
          for (const notePath of deletedNotePaths) {
            if (tagIndex) removeNoteFromTagIndex(tagIndex, notePath);
          }
        }
      });
    });

    let currentGraph = state.graph;
    if (currentGraph) {
      for (const notePath of deletedNotePaths) {
        currentGraph = removeNoteFromGraph(currentGraph, notePath);
      }
    }

    for (const notePath of deletedNotePaths) {
      clearSaveTimer(notePath);
      clearH1RenameTimer(notePath);
    }

    useWorkspaceStore.setState({
      graph: currentGraph,
    });

    useBookmarkStore.getState().markFolderMissing(normalized);

    return { ok: true };
  });
}

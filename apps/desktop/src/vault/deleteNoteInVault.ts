import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { saveTimers } from "../state/saveTimers";
import { clearH1RenameTimer } from "./h1DrivenRename";
import {
  getVaultIndexDb,
  removeNoteFromIndex,
  withDbLock,
} from "./sqliteIndex";
import { deleteNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { removeNoteFromGraph } from "./removeNoteFromGraph";
import { removeNoteFromTagIndex } from "@app/indexer";

export type DeleteNoteResult =
  | { ok: true; path: string }
  | { ok: false; reason: "missing" | "not-markdown" };

/** Canonical note delete: disk, SQLite, graph, timers, and workspace state. */
export async function deleteNoteInVault(
  path: string,
): Promise<DeleteNoteResult> {
  if (!path.endsWith(".md")) {
    return { ok: false, reason: "not-markdown" };
  }

  const state = useWorkspaceStore.getState();
  if (!state.allNotePaths.includes(path)) {
    return { ok: false, reason: "missing" };
  }

  return withVaultWatchSuppressed(async () => {
    if (saveTimers[path]) {
      clearTimeout(saveTimers[path]);
      delete saveTimers[path];
    }
    clearH1RenameTimer(path);

    await deleteNote(path);

    const db = await getVaultIndexDb();
    await withDbLock(async () => {
      await removeNoteFromIndex(db, path);
      await db.execute(
        "DELETE FROM links WHERE source_path = $1 OR target_path = $1",
        [path],
      );
    });

    useWorkspaceStore.setState((current) => {
      if (current.tagIndex) removeNoteFromTagIndex(current.tagIndex, path);
      const openNotes = current.openNotes.filter(
        (openPath) => openPath !== path,
      );
      const activeNotePath =
        current.activeNotePath === path
          ? (openNotes[openNotes.length - 1] ?? null)
          : current.activeNotePath;
      const notesContent = { ...current.notesContent };
      delete notesContent[path];
      const dirtyNotes = new Set(current.dirtyNotes);
      dirtyNotes.delete(path);

      return {
        openNotes,
        activeNotePath,
        notesContent,
        dirtyNotes,
        allNotePaths: current.allNotePaths.filter(
          (notePath) => notePath !== path,
        ),
        graph: removeNoteFromGraph(current.graph, path),
        vaultUpdateCounter: current.vaultUpdateCounter + 1,
      };
    });

    return { ok: true, path };
  });
}

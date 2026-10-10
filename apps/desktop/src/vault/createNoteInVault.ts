import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { initialNoteContent } from "./initialNoteContent";
import { noteFromMarkdown } from "./noteFromMarkdown";
import { retryOnSqliteBusy } from "./retryOnSqliteBusy";
import {
  getVaultIndexDb,
  persistNote,
  withDbLock,
  withDbTransaction,
} from "./sqliteIndex";
import { writeNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { updateTagIndexForNote } from "@app/indexer";

/** Write a markdown note to disk, index it, and refresh `allNotePaths`. */
export async function createNoteInVault(
  path: string,
  content?: string,
): Promise<string> {
  const noteContent = content ?? initialNoteContent(path);
  return withVaultWatchSuppressed(async () => {
    await writeNote(path, noteContent);
    const currentPaths = useWorkspaceStore.getState().allNotePaths;
    const updatedPaths = currentPaths.includes(path)
      ? currentPaths
      : [...currentPaths, path];
    useWorkspaceStore.getState().updateAllPaths(updatedPaths);
    useWorkspaceStore.setState((state) => ({
      notesContent: { ...state.notesContent, [path]: noteContent },
    }));

    // Asynchronously index in background with retry on SQLITE_BUSY (capped backoff)
    void retryOnSqliteBusy(async () => {
      const db = await getVaultIndexDb();
      const note = noteFromMarkdown(
        path,
        noteContent,
        Date.now(),
        updatedPaths,
      );
      await withDbLock(() =>
        withDbTransaction(db, async () => {
          await persistNote(db, note);
        }),
      );
      const tagIndex = useWorkspaceStore.getState().tagIndex;
      if (tagIndex) updateTagIndexForNote(tagIndex, note);
    }).catch((err) => {
      console.warn(`[vault] Background indexing deferred for ${path}:`, err);
    });

    return path;
  });
}

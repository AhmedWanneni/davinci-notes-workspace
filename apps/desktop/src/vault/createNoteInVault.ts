import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { noteFromMarkdown } from "./noteFromMarkdown";
import { getVaultIndexDb, persistNote } from "./sqliteIndex";
import { writeNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";

/** Write a markdown note to disk, index it, and refresh `allNotePaths`. */
export async function createNoteInVault(
  path: string,
  content: string,
): Promise<string> {
  return withVaultWatchSuppressed(async () => {
    await writeNote(path, content);
    const db = await getVaultIndexDb();
    const currentPaths = useWorkspaceStore.getState().allNotePaths;
    const updatedPaths = currentPaths.includes(path)
      ? currentPaths
      : [...currentPaths, path];
    const note = noteFromMarkdown(path, content, Date.now(), updatedPaths);
    await persistNote(db, note);
    useWorkspaceStore.getState().updateAllPaths(updatedPaths);
    return path;
  });
}

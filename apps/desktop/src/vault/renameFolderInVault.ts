import { noteFromMarkdown } from "./noteFromMarkdown";
import { replaceVaultPathPrefix } from "./replaceVaultPathPrefix";
import { folderNameFromPath } from "./resolveUniqueFolderPath";
import { sanitizeFilenameStem } from "./sanitizeFilenameStem";
import { getVaultIndexDb, persistNote, withDbLock } from "./sqliteIndex";
import { renameFolder } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { useWorkspaceStore } from "../state/useWorkspaceStore";

function remapPath(
  path: string | null,
  oldPrefix: string,
  newPrefix: string,
): string | null {
  if (!path) {
    return null;
  }
  if (path === oldPrefix) {
    return newPrefix;
  }
  if (path.startsWith(`${oldPrefix}/`)) {
    return `${newPrefix}${path.slice(oldPrefix.length)}`;
  }
  return path;
}

export type RenameFolderResult =
  | { ok: true; newPath: string }
  | { ok: false; reason: "collision" | "invalid" | "missing" };

/** Canonical folder rename: disk, child path prefix updates, note re-index. */
export async function renameFolderInVault(
  oldPath: string,
  newName: string,
): Promise<RenameFolderResult> {
  const stem = sanitizeFilenameStem(newName);
  if (!stem) {
    return { ok: false, reason: "invalid" };
  }

  const parent = oldPath.includes("/")
    ? oldPath.slice(0, oldPath.lastIndexOf("/"))
    : "";
  const newPath = parent ? `${parent}/${stem}` : stem;

  if (oldPath === newPath) {
    return { ok: true, newPath };
  }

  const state = useWorkspaceStore.getState();
  if (!state.allFolderPaths.includes(oldPath)) {
    return { ok: false, reason: "missing" };
  }
  if (state.allFolderPaths.includes(newPath)) {
    return { ok: false, reason: "collision" };
  }

  return withVaultWatchSuppressed(async () => {
    await renameFolder(oldPath, newPath);

    const updatedFolders = replaceVaultPathPrefix(
      state.allFolderPaths,
      oldPath,
      newPath,
    ).sort();
    const updatedNotes = replaceVaultPathPrefix(
      state.allNotePaths,
      oldPath,
      newPath,
    ).sort();

    const db = await getVaultIndexDb();
    const noteUpdates = new Map<string, string>();
    for (const path of updatedNotes) {
      const content = state.notesContent[path];
      if (content !== undefined) {
        noteUpdates.set(path, content);
      }
    }

    await withDbLock(async () => {
      for (const [path, content] of noteUpdates) {
        const note = noteFromMarkdown(path, content, Date.now(), updatedNotes);
        await persistNote(db, note);
      }
    });

    useWorkspaceStore.setState((prev) => ({
      allFolderPaths: updatedFolders,
      allNotePaths: updatedNotes,
      openNotes: replaceVaultPathPrefix(prev.openNotes, oldPath, newPath),
      activeNotePath: remapPath(prev.activeNotePath, oldPath, newPath),
      notesContent: Object.fromEntries(
        Object.entries(prev.notesContent).map(([path, content]) => [
          replaceVaultPathPrefix([path], oldPath, newPath)[0],
          content,
        ]),
      ),
      dirtyNotes: new Set(
        replaceVaultPathPrefix(Array.from(prev.dirtyNotes), oldPath, newPath),
      ),
      vaultUpdateCounter: prev.vaultUpdateCounter + 1,
    }));

    return { ok: true, newPath };
  });
}

export { folderNameFromPath };

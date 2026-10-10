import {
  removeNoteFromTagIndex,
  updateGraphForNote,
  updateTagIndexForNote,
} from "@app/indexer";
import { noteFromMarkdown } from "./noteFromMarkdown";
import { replaceVaultPathPrefix } from "./replaceVaultPathPrefix";
import { folderNameFromPath } from "./resolveUniqueFolderPath";
import { sanitizeFilenameStem } from "./sanitizeFilenameStem";
import {
  getVaultIndexDb,
  persistNotesBatch,
  removeNotesBatch,
  withDbLock,
  withDbTransaction,
} from "./sqliteIndex";
import { readNote, renameFolder } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { migrateSaveTimer } from "../state/saveTimers";
import { clearH1RenameTimer } from "./h1DrivenRename";
import { useWorkspaceStore } from "../state/useWorkspaceStore";

function remapPath(
  path: string | null,
  oldPrefix: string,
  newPrefix: string,
): string | null {
  if (!path) return null;
  if (path === oldPrefix) return newPrefix;
  if (path.startsWith(`${oldPrefix}/`)) {
    return `${newPrefix}${path.slice(oldPrefix.length)}`;
  }
  return path;
}

export type RenameFolderResult =
  | { ok: true; newPath: string }
  | { ok: false; reason: "collision" | "invalid" | "missing" };

/** Canonical folder rename: disk, child path prefix updates, note re-index in batched transaction. */
export async function renameFolderInVault(
  oldPath: string,
  newName: string,
): Promise<RenameFolderResult> {
  if (/[\\/:*?"<>|]/.test(newName)) {
    return { ok: false, reason: "invalid" };
  }
  const stem = sanitizeFilenameStem(newName);
  if (!stem) return { ok: false, reason: "invalid" };

  const parent = oldPath.includes("/")
    ? oldPath.slice(0, oldPath.lastIndexOf("/"))
    : "";
  const newPath = parent ? `${parent}/${stem}` : stem;

  if (oldPath === newPath) return { ok: true, newPath };

  const state = useWorkspaceStore.getState();
  if (!state.allFolderPaths.includes(oldPath)) {
    return { ok: false, reason: "missing" };
  }
  if (state.allFolderPaths.includes(newPath)) {
    return { ok: false, reason: "collision" };
  }

  const oldChildNotePaths = state.allNotePaths.filter((p) =>
    p.startsWith(`${oldPath}/`),
  );
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

  const noteContents = new Map<string, string>();
  for (const oldChildPath of oldChildNotePaths) {
    const newChildPath = remapPath(oldChildPath, oldPath, newPath)!;
    const cached = state.notesContent[oldChildPath];
    if (cached !== undefined) {
      noteContents.set(newChildPath, cached);
      continue;
    }
    const file = await readNote(oldChildPath);
    noteContents.set(newChildPath, file.content);
  }

  return withVaultWatchSuppressed(async () => {
    await renameFolder(oldPath, newPath);

    for (const oldChildPath of oldChildNotePaths) {
      const newChildPath = remapPath(oldChildPath, oldPath, newPath)!;
      migrateSaveTimer(oldChildPath, newChildPath);
      clearH1RenameTimer(oldChildPath);
    }

    // Keep rendered paths aligned with the completed filesystem rename while
    // potentially large descendant indexing continues in the queued batch.
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

    const db = await getVaultIndexDb();
    const tagIndex = useWorkspaceStore.getState().tagIndex;

    await withDbLock(async () => {
      await withDbTransaction(db, async () => {
        if (oldChildNotePaths.length > 0) {
          await removeNotesBatch(db, oldChildNotePaths);
          for (const oldChildPath of oldChildNotePaths) {
            if (tagIndex) removeNoteFromTagIndex(tagIndex, oldChildPath);
          }
        }

        const notesToPersist: import("@app/core-types").Note[] = [];
        for (const [childPath, content] of noteContents) {
          const note = noteFromMarkdown(
            childPath,
            content,
            Date.now(),
            updatedNotes,
          );
          notesToPersist.push(note);
          if (tagIndex) updateTagIndexForNote(tagIndex, note);
        }
        if (notesToPersist.length > 0) {
          await persistNotesBatch(db, notesToPersist);
        }
      });
    });

    let currentGraph = state.graph;
    if (currentGraph) {
      for (const [childPath, content] of noteContents) {
        const note = noteFromMarkdown(
          childPath,
          content,
          Date.now(),
          updatedNotes,
        );
        currentGraph = updateGraphForNote(currentGraph, note);
      }
    }

    useWorkspaceStore.setState({ graph: currentGraph });

    return { ok: true, newPath };
  });
}

export { folderNameFromPath };

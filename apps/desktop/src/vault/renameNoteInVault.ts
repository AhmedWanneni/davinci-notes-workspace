import {
  removeNoteFromTagIndex,
  updateGraphForNote,
  updateTagIndexForNote,
} from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { migrateSaveTimer } from "../state/saveTimers";
import { applyNoteRenameState } from "./applyNoteRenameState";
import { clearH1RenameTimer } from "./h1DrivenRename";
import { noteFromMarkdown } from "./noteFromMarkdown";
import {
  getVaultIndexDb,
  persistNote,
  removeNoteFromIndex,
  withDbLock,
} from "./sqliteIndex";
import { noteTitleFromPath } from "./initialNoteContent";
import { readNote, renameNote, writeNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { syncH1ToFilename } from "./syncH1ToFilename";
import { updateWikilinksForRename } from "./updateWikilinksForRename";

export type RenameNoteResult =
  | { ok: true; newPath: string }
  | { ok: false; reason: "collision" | "not-markdown" | "missing" };

export interface RenameNoteOptions {
  /** Rewrite the renamed note's first H1 to match the new filename stem. */
  syncH1FromFilename?: boolean;
}

async function loadNoteContent(
  path: string,
  cache: Record<string, string>,
): Promise<string | null> {
  if (cache[path] !== undefined) {
    return cache[path];
  }
  try {
    const file = await readNote(path);
    return file.content;
  } catch {
    return null;
  }
}

/** Canonical vault rename: disk, wikilink propagation, SQLite, workspace state. */
export async function renameNoteInVault(
  oldPath: string,
  newPath: string,
  options: RenameNoteOptions = {},
): Promise<RenameNoteResult> {
  if (!oldPath.endsWith(".md") || !newPath.endsWith(".md")) {
    return { ok: false, reason: "not-markdown" };
  }
  if (oldPath === newPath) {
    return { ok: true, newPath };
  }

  const state = useWorkspaceStore.getState();
  if (!state.allNotePaths.includes(oldPath)) {
    return { ok: false, reason: "missing" };
  }
  if (state.allNotePaths.includes(newPath)) {
    return { ok: false, reason: "collision" };
  }

  const oldStem = noteTitleFromPath(oldPath);
  const newStem = noteTitleFromPath(newPath);
  const contentCache = { ...state.notesContent };

  const renamedRaw = await loadNoteContent(oldPath, contentCache);
  if (renamedRaw === null) {
    return { ok: false, reason: "missing" };
  }

  let renamedContent = renamedRaw;
  if (options.syncH1FromFilename) {
    renamedContent = syncH1ToFilename(renamedContent, newStem);
  }

  const contentUpdates = new Map<string, string>();
  if (renamedContent !== renamedRaw) {
    contentUpdates.set(newPath, renamedContent);
  }

  for (const path of state.allNotePaths) {
    const raw =
      path === oldPath
        ? renamedContent
        : await loadNoteContent(path, contentCache);
    if (raw === null) {
      continue;
    }
    const updated = updateWikilinksForRename(raw, oldStem, newStem);
    const targetPath = path === oldPath ? newPath : path;
    if (updated !== raw) {
      contentUpdates.set(targetPath, updated);
    }
  }

  if (!contentUpdates.has(newPath)) {
    contentUpdates.set(newPath, renamedContent);
  }

  return withVaultWatchSuppressed(async () => {
    try {
      await renameNote(oldPath, newPath);
    } catch (error) {
      if (
        error instanceof Error &&
        /destination already exists/i.test(error.message)
      ) {
        return { ok: false, reason: "collision" };
      }
      throw error;
    }

    for (const [path, content] of contentUpdates) {
      await writeNote(path, content);
    }

    const updatedPaths = state.allNotePaths.map((path) =>
      path === oldPath ? newPath : path,
    );

    const db = await getVaultIndexDb();
    await withDbLock(async () => {
      await removeNoteFromIndex(db, oldPath);
      const tagIndex = useWorkspaceStore.getState().tagIndex;
      if (tagIndex) removeNoteFromTagIndex(tagIndex, oldPath);
      await db.execute("DELETE FROM links WHERE target_path = $1", [oldPath]);

      for (const [path, content] of contentUpdates) {
        const note = noteFromMarkdown(path, content, Date.now(), updatedPaths);
        await persistNote(db, note);
        const tagIndex = useWorkspaceStore.getState().tagIndex;
        if (tagIndex) updateTagIndexForNote(tagIndex, note);
      }
    });

    const graph = state.graph;
    const nextGraph = graph
      ? updateGraphForNote(
          graph,
          noteFromMarkdown(
            newPath,
            contentUpdates.get(newPath) ?? renamedContent,
            Date.now(),
            updatedPaths,
          ),
        )
      : null;

    useWorkspaceStore.setState((state) =>
      applyNoteRenameState(state, {
        oldPath,
        newPath,
        contentUpdates,
        allNotePaths: updatedPaths,
        graph: nextGraph,
      }),
    );

    migrateSaveTimer(oldPath, newPath);
    clearH1RenameTimer(oldPath);

    return { ok: true, newPath };
  });
}

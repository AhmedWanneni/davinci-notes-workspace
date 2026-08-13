import type { Note } from "@app/core-types";
import { updateGraphForNote, type GraphIndex } from "@app/indexer";

import { noteFromMarkdown } from "./noteFromMarkdown";
import {
  clearVaultIndex,
  getVaultIndexDb,
  persistNotesBatch,
  removeNoteFromIndex,
} from "./sqliteIndex";
import {
  listNotes,
  openVault,
  readNote,
  type VaultChangeBatch,
} from "./vaultCommands";
import {
  activateVaultWatcher,
  withVaultWatchSuppressed,
} from "./vaultWatchSession";

async function loadNotesFromPaths(paths: readonly string[]): Promise<Note[]> {
  const notes: Note[] = [];
  for (const path of paths) {
    const file = await readNote(path);
    notes.push(noteFromMarkdown(path, file.content, file.mtime, paths));
  }
  return notes;
}

/** Full vault scan + SQLite populate (vault open). Watcher starts after indexing. */
export async function indexVaultFull(): Promise<{
  noteCount: number;
  elapsedMs: number;
}> {
  const started = performance.now();
  let noteCount = 0;

  await withVaultWatchSuppressed(async () => {
    const paths = await listNotes();
    const notes = await loadNotesFromPaths(paths);
    const db = await getVaultIndexDb();

    await db.execute("BEGIN IMMEDIATE");
    try {
      await clearVaultIndex(db);
      await persistNotesBatch(db, notes);
      await db.execute("COMMIT");
    } catch (error) {
      await db.execute("ROLLBACK");
      throw error;
    }

    noteCount = notes.length;
  });

  await activateVaultWatcher();

  return {
    noteCount,
    elapsedMs: Math.round(performance.now() - started),
  };
}

/** Incremental reconcile after debounced watcher batch (not a full reindex). */
export async function reconcileVaultChanges(
  batch: VaultChangeBatch,
  graph?: GraphIndex,
): Promise<{ graph: GraphIndex | undefined; updated: number }> {
  return withVaultWatchSuppressed(async () => {
    const allPaths = await listNotes();
    const pathSet = new Set(allPaths);
    const db = await getVaultIndexDb();
    let updated = 0;

    await db.execute("BEGIN IMMEDIATE");
    try {
      for (const removed of batch.removed) {
        await removeNoteFromIndex(db, removed);
        updated += 1;
      }

      const changedNotes: Note[] = [];
      for (const changedPath of batch.changed) {
        if (!pathSet.has(changedPath)) {
          await removeNoteFromIndex(db, changedPath);
          updated += 1;
          continue;
        }

        const file = await readNote(changedPath);
        const note = noteFromMarkdown(
          changedPath,
          file.content,
          file.mtime,
          allPaths,
        );
        changedNotes.push(note);
        updated += 1;

        if (graph) {
          updateGraphForNote(graph, note);
        }
      }

      if (changedNotes.length > 0) {
        await persistNotesBatch(db, changedNotes);
      }

      await db.execute("COMMIT");
    } catch (error) {
      await db.execute("ROLLBACK");
      throw error;
    }

    return { graph, updated };
  });
}

export async function openAndIndexVault(path: string): Promise<{
  vaultPath: string;
  noteCount: number;
  elapsedMs: number;
}> {
  const vaultPath = await openVault(path);
  const { noteCount, elapsedMs } = await indexVaultFull();
  return { vaultPath, noteCount, elapsedMs };
}

/** Folder picker (non-blocking) + full index. */
export async function openAndIndexVaultFromPicker(): Promise<{
  vaultPath: string;
  noteCount: number;
  elapsedMs: number;
}> {
  const { openVaultFromPicker } = await import("./vaultCommands");
  const vaultPath = await openVaultFromPicker();
  const { noteCount, elapsedMs } = await indexVaultFull();
  return { vaultPath, noteCount, elapsedMs };
}

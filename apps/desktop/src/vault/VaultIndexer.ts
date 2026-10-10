import type { Note } from "@app/core-types";
import {
  buildTagIndex,
  createEmptyTagIndex,
  removeNoteFromTagIndex,
  updateTagIndexForNote,
  updateGraphForNote,
  type GraphIndex,
  type TagIndex,
} from "@app/indexer";

import { noteFromMarkdown } from "./noteFromMarkdown";
import {
  clearVaultIndex,
  getVaultIndexDb,
  listIndexedNotePaths,
  persistNotesBatch,
  removeNotesBatch,
  withDbLock,
  withDbTransaction,
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

function isIndexedNotePath(path: string): boolean {
  return /\.(md|canvas)$/i.test(path);
}

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
  tagIndex: TagIndex;
}> {
  const started = performance.now();
  let noteCount = 0;
  let indexedTagIndex: TagIndex | undefined;

  await withVaultWatchSuppressed(async () => {
    const paths = await listNotes();
    const notes = await loadNotesFromPaths(paths.filter(isIndexedNotePath));
    const tagIndex = notes.every((note) => note.tags)
      ? buildTagIndex(notes)
      : createEmptyTagIndex();
    const db = await getVaultIndexDb();

    await withDbLock(() =>
      withDbTransaction(db, async () => {
        await clearVaultIndex(db);
        await persistNotesBatch(db, notes);
      }),
    );

    noteCount = notes.length;
    indexedTagIndex = tagIndex;
  });

  await activateVaultWatcher();

  return {
    noteCount,
    elapsedMs: Math.round(performance.now() - started),
    tagIndex: indexedTagIndex!,
  };
}

/** Incremental reconcile after debounced watcher batch (not a full reindex). */
export async function reconcileVaultChanges(
  batch: VaultChangeBatch,
  graph?: GraphIndex,
  tagIndex?: TagIndex,
): Promise<{
  graph: GraphIndex | undefined;
  updated: number;
  removed: string[];
}> {
  const allPaths = await listNotes();
  const pathSet = new Set(allPaths);
  let updated = 0;
  let reconciledRemoved: string[] = [];

  const changedNotes: Note[] = [];
  const extraRemovedPaths: string[] = [];

  // Read all changed notes in parallel before starting the SQLite transaction.
  // Keeping the watcher live here prevents a second external burst being dropped.
  await Promise.all(
    batch.changed.map(async (changedPath) => {
      if (!isIndexedNotePath(changedPath)) {
        return;
      }
      if (!pathSet.has(changedPath)) {
        extraRemovedPaths.push(changedPath);
        return;
      }

      try {
        const file = await readNote(changedPath);
        const note = noteFromMarkdown(
          changedPath,
          file.content,
          file.mtime,
          allPaths,
        );
        changedNotes.push(note);
      } catch {
        // File was deleted/unreadable during sync burst; treat as removed
        extraRemovedPaths.push(changedPath);
      }
    }),
  );

  const db = await getVaultIndexDb();

  await withDbLock(async () => {
    const indexedPaths = await listIndexedNotePaths(db);
    const allRemoved = Array.from(
      new Set([
        ...batch.removed,
        ...extraRemovedPaths,
        ...indexedPaths.filter((path) => !pathSet.has(path)),
      ]),
    );
    reconciledRemoved = allRemoved;
    await withDbTransaction(db, async () => {
      if (allRemoved.length > 0) {
        await removeNotesBatch(db, allRemoved);
        for (const removed of allRemoved) {
          if (tagIndex) removeNoteFromTagIndex(tagIndex, removed);
          updated += 1;
        }
      }

      for (const note of changedNotes) {
        if (tagIndex) updateTagIndexForNote(tagIndex, note);
        if (graph) updateGraphForNote(graph, note);
        updated += 1;
      }

      if (changedNotes.length > 0) {
        await persistNotesBatch(db, changedNotes);
      }
    });
  });

  return { graph, updated, removed: reconciledRemoved };
}

export async function openAndIndexVault(path: string): Promise<{
  vaultPath: string;
  noteCount: number;
  elapsedMs: number;
  tagIndex: TagIndex;
}> {
  const vaultPath = await openVault(path);
  const { noteCount, elapsedMs, tagIndex } = await indexVaultFull();
  return { vaultPath, noteCount, elapsedMs, tagIndex };
}

/** Folder picker (non-blocking) + full index. */
export async function openAndIndexVaultFromPicker(): Promise<{
  vaultPath: string;
  noteCount: number;
  elapsedMs: number;
  tagIndex: TagIndex;
}> {
  const { openVaultFromPicker } = await import("./vaultCommands");
  const vaultPath = await openVaultFromPicker();
  const { noteCount, elapsedMs, tagIndex } = await indexVaultFull();
  return { vaultPath, noteCount, elapsedMs, tagIndex };
}

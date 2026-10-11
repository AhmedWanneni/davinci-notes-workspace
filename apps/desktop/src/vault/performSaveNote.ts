import type { GraphIndex, TagIndex } from "@app/indexer";
import type {
  WorkspaceSaveContext,
  WorkspaceSaveUpdater,
} from "./noteConflictTypes";
import { noteFromMarkdown } from "./noteFromMarkdown";
import { persistNote, getVaultIndexDb, withDbLock } from "./sqliteIndex";
import { updateGraphForNote, updateTagIndexForNote } from "@app/indexer";
import { readNote, statNote, writeNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { diskStateTracker } from "./diskStateTracker";
import { classifyDiskChange } from "./classifyDiskChange";
import { queuePerPath } from "./saveQueue";

export async function writeAndIndexNote(
  path: string,
  content: string,
  state: {
    allNotePaths: string[];
    graph: GraphIndex | null;
    tagIndex: TagIndex | null;
  },
  set: WorkspaceSaveUpdater,
): Promise<void> {
  await withVaultWatchSuppressed(async () => {
    const newStat = await writeNote(path, content);
    diskStateTracker.set(path, {
      mtime: newStat.mtime,
      size: newStat.size,
      content,
    });

    const db = await getVaultIndexDb();
    const note = noteFromMarkdown(
      path,
      content,
      Date.now(),
      state.allNotePaths,
    );
    await withDbLock(() => persistNote(db, note));

    if (state.graph) {
      const nextGraph = updateGraphForNote(state.graph, note);
      set((curr) => ({
        graph: nextGraph,
        vaultUpdateCounter: curr.vaultUpdateCounter + 1,
      }));
    }
    if (state.tagIndex) {
      updateTagIndexForNote(state.tagIndex, note);
    }
  });

  set((curr) => {
    const nextDirty = new Set(curr.dirtyNotes);
    nextDirty.delete(path);
    return { dirtyNotes: nextDirty };
  });

  void import("../git/loadGitVersioning")
    .then(({ loadGitVersioning }) => loadGitVersioning())
    .then(({ versionHistoryScheduler }) =>
      versionHistoryScheduler.recordAutoSave(path),
    )
    .catch((error) => console.error("Failed to schedule local version", error));
}

export async function performSaveNote(
  path: string,
  get: () => WorkspaceSaveContext,
  set: WorkspaceSaveUpdater,
): Promise<void> {
  return queuePerPath(path, async () => {
    const state = get();
    const { notesContent, dirtyNotes, conflictNotes } = state;

    if (!dirtyNotes.has(path) || notesContent[path] === undefined) {
      return;
    }
    if (conflictNotes.has(path)) {
      // Autosave stays paused while in conflict
      return;
    }

    const content = notesContent[path];
    const lastKnown = diskStateTracker.get(path);

    // Fast check: stat first to avoid disk reads when nothing changed
    const stat = await statNote(path);
    if (!stat.exists && lastKnown) {
      set((curr) => {
        const next = new Map(curr.conflictNotes);
        next.set(path, "");
        return { conflictNotes: next };
      });
      return;
    }

    if (
      lastKnown &&
      stat.exists &&
      stat.mtime === lastKnown.mtime &&
      stat.size === lastKnown.size
    ) {
      await writeAndIndexNote(path, content, state, set);
      return;
    }

    // Disk changed: read and classify
    const diskFile = await readNote(path);
    const classification = classifyDiskChange(
      lastKnown ? lastKnown.content : "",
      diskFile.content,
    );

    if (classification.type === "touched_only") {
      await writeAndIndexNote(path, content, state, set);
      return;
    }

    if (classification.type === "pure_append") {
      // Lossless merge: append tail to current in-memory content
      const mergedContent = content + classification.tail;
      set((curr) => ({
        notesContent: { ...curr.notesContent, [path]: mergedContent },
      }));
      await writeAndIndexNote(path, mergedContent, state, set);
      return;
    }

    // Conflict detected: pause autosave and notify
    set((curr) => {
      const next = new Map(curr.conflictNotes);
      next.set(path, diskFile.content);
      return { conflictNotes: next };
    });
  });
}

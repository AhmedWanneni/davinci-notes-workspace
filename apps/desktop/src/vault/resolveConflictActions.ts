import type {
  WorkspaceSaveContext,
  WorkspaceSaveUpdater,
} from "./noteConflictTypes";
import { noteFromMarkdown } from "./noteFromMarkdown";
import { persistNote, getVaultIndexDb, withDbLock } from "./sqliteIndex";
import { statNote, writeNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";
import { diskStateTracker } from "./diskStateTracker";
import { queuePerPath } from "./saveQueue";
import { writeAndIndexNote } from "./performSaveNote";

export async function resolveConflictKeepMine(
  path: string,
  state: WorkspaceSaveContext,
  set: WorkspaceSaveUpdater,
): Promise<void> {
  return queuePerPath(path, async () => {
    const content = state.notesContent[path];
    if (content === undefined) return;

    set((curr) => {
      const next = new Map(curr.conflictNotes);
      next.delete(path);
      return { conflictNotes: next };
    });

    await writeAndIndexNote(path, content, state, set);
  });
}

export async function resolveConflictUseDisk(
  path: string,
  set: WorkspaceSaveUpdater,
  diskContentOverride?: string,
): Promise<void> {
  return queuePerPath(path, async () => {
    const stat = await statNote(path);
    let diskContent = diskContentOverride;
    if (diskContent === undefined) {
      const { readNote } = await import("./vaultCommands");
      const file = await readNote(path);
      diskContent = file.content;
    }

    diskStateTracker.set(path, {
      mtime: stat.mtime,
      size: stat.size,
      content: diskContent,
    });

    set((curr) => {
      const nextConflict = new Map(curr.conflictNotes);
      nextConflict.delete(path);
      const nextDirty = new Set(curr.dirtyNotes);
      nextDirty.delete(path);
      return {
        conflictNotes: nextConflict,
        dirtyNotes: nextDirty,
        notesContent: { ...curr.notesContent, [path]: diskContent },
      };
    });
  });
}

export async function resolveConflictSaveCopy(
  path: string,
  state: WorkspaceSaveContext,
  set: WorkspaceSaveUpdater,
  diskContentOverride?: string,
): Promise<string> {
  return queuePerPath(path, async () => {
    const userContent = state.notesContent[path] ?? "";
    let diskContent = diskContentOverride;
    if (diskContent === undefined) {
      const { readNote } = await import("./vaultCommands");
      const file = await readNote(path);
      diskContent = file.content;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const lastSlash = path.lastIndexOf("/");
    const dir = lastSlash === -1 ? "" : path.slice(0, lastSlash);
    const stem = path.slice(lastSlash + 1).replace(/\.md$/, "");
    const copyName = `${stem} (conflict ${timestamp}).md`;
    const copyPath = dir ? `${dir}/${copyName}` : copyName;

    // 1. Write user version to conflict copy file
    await withVaultWatchSuppressed(async () => {
      const copyStat = await writeNote(copyPath, userContent);
      diskStateTracker.set(copyPath, {
        mtime: copyStat.mtime,
        size: copyStat.size,
        content: userContent,
      });

      const db = await getVaultIndexDb();
      const copyNote = noteFromMarkdown(copyPath, userContent, Date.now(), [
        ...state.allNotePaths,
        copyPath,
      ]);
      await withDbLock(() => persistNote(db, copyNote));
    });

    // 2. Reload original with fresh disk content
    const origStat = await statNote(path);
    diskStateTracker.set(path, {
      mtime: origStat.mtime,
      size: origStat.size,
      content: diskContent,
    });

    set((curr) => {
      const nextConflict = new Map(curr.conflictNotes);
      nextConflict.delete(path);
      const nextDirty = new Set(curr.dirtyNotes);
      nextDirty.delete(path);
      const nextAllPaths = curr.allNotePaths.includes(copyPath)
        ? curr.allNotePaths
        : [...curr.allNotePaths, copyPath];
      return {
        conflictNotes: nextConflict,
        dirtyNotes: nextDirty,
        allNotePaths: nextAllPaths,
        notesContent: { ...curr.notesContent, [path]: diskContent },
      };
    });

    return copyPath;
  });
}

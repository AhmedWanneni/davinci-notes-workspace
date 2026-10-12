import type { GraphIndex, TagIndex } from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import {
  closeVaultIndexDb,
  getVaultIndexDb,
  queryFullGraphIndex,
  withDbLock,
} from "./sqliteIndex";
import { indexVaultFull } from "./VaultIndexer";
import { getSetting, setSetting } from "./settingsCommands";
import { listFolders, listNotes, openVault } from "./vaultCommands";
import { deactivateVaultWatcher } from "./vaultWatchSession";
import { diskStateTracker } from "./diskStateTracker";
import { recordRecentVault } from "./recentVaultsRegistry";

let switchLock: Promise<boolean> = Promise.resolve(true);
let switchingInProgress = false;

export function isVaultSwitching(): boolean {
  return switchingInProgress;
}

async function teardownActiveVault(): Promise<string | null> {
  const state = useWorkspaceStore.getState();
  const currentPath = state.vaultPath;
  if (!currentPath) {
    return null;
  }

  // 1. Flush/save any dirty editor content
  await state.saveAllDirty();

  // Save session state to vault-index.db before closing
  try {
    const db = await getVaultIndexDb();
    await withDbLock(async () => {
      const openNotesJson = JSON.stringify(state.openNotes);
      await setSetting(db, "session.openNotes", openNotesJson);
      if (state.activeNotePath) {
        await setSetting(db, "session.activeNotePath", state.activeNotePath);
      }
    });
  } catch (err) {
    console.warn("[vault-switch] Failed to save session before teardown:", err);
  }

  // 2. Stop file watcher
  await deactivateVaultWatcher();

  // 3. Cleanly close SQLite DB connection pool & flush WAL
  await closeVaultIndexDb();

  // 4. Reset in-memory state
  diskStateTracker.clear();
  useWorkspaceStore.setState({
    openNotes: [],
    activeNotePath: null,
    notesContent: {},
    dirtyNotes: new Set(),
    conflictNotes: new Map(),
    vaultPath: null,
  });
  await state.initializeVault([], [], null, null);

  return currentPath;
}

async function restoreVaultSession(paths: string[]): Promise<void> {
  try {
    const db = await getVaultIndexDb();
    const [rawOpen, activeNote] = await withDbLock(() =>
      Promise.all([
        getSetting(db, "session.openNotes"),
        getSetting(db, "session.activeNotePath"),
      ]),
    );

    if (rawOpen) {
      const openNotes = JSON.parse(rawOpen) as string[];
      const validOpen = openNotes.filter((p) => paths.includes(p));
      for (const note of validOpen) {
        await useWorkspaceStore.getState().openNote(note);
      }
      if (activeNote && paths.includes(activeNote)) {
        await useWorkspaceStore.getState().setActiveNote(activeNote);
      }
    }
  } catch (err) {
    console.warn("[vault-switch] Session restore skipped:", err);
  }
}

async function mountVault(targetPath: string): Promise<{
  vaultPath: string;
  tagIndex: TagIndex;
  fullGraph: GraphIndex;
}> {
  // 5. Initialize new vault: open DB, index files, start watcher
  const canonicalPath = await openVault(targetPath);
  const { tagIndex } = await indexVaultFull();
  const paths = await listNotes();
  const folders = await listFolders();

  const db = await getVaultIndexDb();
  const fullGraph = await withDbLock(() => queryFullGraphIndex(db));

  useWorkspaceStore.getState().setVaultPath(canonicalPath);
  await useWorkspaceStore
    .getState()
    .initializeVault(paths, folders, fullGraph, tagIndex);

  await restoreVaultSession(paths);

  // 6. Update recent-vaults registry
  await recordRecentVault(canonicalPath);

  return { vaultPath: canonicalPath, tagIndex, fullGraph };
}

async function executeVaultSwitch(
  targetPath: string,
  onError?: (err: Error) => void,
): Promise<boolean> {
  switchingInProgress = true;
  let previousVaultPath: string | null = null;
  try {
    previousVaultPath = await teardownActiveVault();
    await mountVault(targetPath);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[vault-switch] Vault switch failed:", err);
    onError?.(err);

    // Rollback attempt
    try {
      await deactivateVaultWatcher();
      await closeVaultIndexDb();
      if (previousVaultPath && previousVaultPath !== targetPath) {
        console.info(
          "[vault-switch] Rolling back to previous vault:",
          previousVaultPath,
        );
        await mountVault(previousVaultPath);
      } else {
        useWorkspaceStore.getState().setVaultPath(null);
      }
    } catch (rollbackErr) {
      console.error(
        "[vault-switch] Rollback failed, returning to picker:",
        rollbackErr,
      );
      useWorkspaceStore.getState().setVaultPath(null);
    }
    return false;
  } finally {
    switchingInProgress = false;
  }
}

/**
 * Serialized vault switch orchestrator.
 * Guarantees all switches are serialized; rapid clicks queue and never interleave.
 */
export function switchVault(
  targetPath: string,
  onError?: (err: Error) => void,
): Promise<boolean> {
  const next = switchLock.then(
    () => executeVaultSwitch(targetPath, onError),
    () => executeVaultSwitch(targetPath, onError),
  );
  switchLock = next;
  return next;
}

export async function closeVault(): Promise<void> {
  const next = switchLock.then(async () => {
    switchingInProgress = true;
    try {
      await teardownActiveVault();
    } finally {
      switchingInProgress = false;
    }
    return true;
  });
  switchLock = next;
  await next;
}

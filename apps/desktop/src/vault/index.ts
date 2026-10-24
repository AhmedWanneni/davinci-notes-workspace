export {
  openAndIndexVault,
  openAndIndexVaultFromPicker,
  indexVaultFull,
  reconcileVaultChanges,
} from "./VaultIndexer";
export { createFolderInVault } from "./createFolderInVault";
export { createNoteInVault } from "./createNoteInVault";
export {
  appendToNoteInVault,
  type ClipInsertPosition,
} from "./appendToNoteInVault";
export { deleteNoteInVault } from "./deleteNoteInVault";
export { deleteFolderInVault } from "./deleteFolderInVault";
export { duplicateNoteInVault } from "./duplicateNoteInVault";
export { moveNoteInVault } from "./moveNoteInVault";
export { extractH1Title } from "./extractH1Title";
export { initialNoteContent, noteTitleFromPath } from "./initialNoteContent";
export { noteFromMarkdown } from "./noteFromMarkdown";
export { renameFolderInVault } from "./renameFolderInVault";
export { renameNoteInVault } from "./renameNoteInVault";
export { resolveUniqueNotePath } from "./resolveUniqueNotePath";
export { getSetting, setSetting } from "./settingsCommands";
export {
  computeVaultRelativeLink,
  writeAttachmentToVault,
} from "./writeAttachment";
export {
  closeVaultIndexDb,
  countIndexedNotes,
  getVaultIndexDb,
  persistNote,
  removeNoteFromIndex,
  removeNotesBatch,
  withDbLock,
  withDbTransaction,
  queryBacklinkSources,
  queryFullGraphIndex,
  VAULT_INDEX_DB,
} from "./sqliteIndex";
export {
  activateVaultWatcher,
  deactivateVaultWatcher,
  withVaultWatchSuppressed,
} from "./vaultWatchSession";
export {
  getRecentVaults,
  recordRecentVault,
  removeRecentVault,
  checkVaultExists,
  getAutoOpenVault,
  type RecentVaultEntry,
} from "./recentVaultsRegistry";
export {
  vaultWatchCoordinator,
  VAULT_WATCHER_SETTLE_MS,
} from "./vaultWatchCoordinator";
export { pickVaultFolder } from "./pickVaultFolder";
export {
  getFileTree,
  listNotes,
  listFolders,
  openVault,
  openVaultFromPicker,
  readNote,
  statNote,
  setVaultWatcherPaused,
  startVaultWatcher,
  subscribeVaultChanges,
  writeNote,
  renameNote,
  deleteNote,
  createFolder,
  renameFolder,
  deleteFolder,
  writeBinaryFile,
  type FileTreeNode,
  type VaultChangeBatch,
  type NoteStatPayload,
} from "./vaultCommands";
export {
  switchVault,
  closeVault,
  isVaultSwitching,
} from "./vaultSwitchOrchestrator";
export { useVaultSession } from "./useVaultSession";
export { retryOnSqliteBusy, isSqliteBusyError } from "./retryOnSqliteBusy";
export { diskStateTracker } from "./diskStateTracker";
export { classifyDiskChange } from "./classifyDiskChange";
export { performSaveNote } from "./performSaveNote";
export {
  resolveConflictKeepMine,
  resolveConflictUseDisk,
  resolveConflictSaveCopy,
} from "./resolveConflictActions";
export type {
  NoteConflictState,
  ConflictResolutionChoice,
  WorkspaceSaveContext,
  WorkspaceSaveUpdater,
} from "./noteConflictTypes";

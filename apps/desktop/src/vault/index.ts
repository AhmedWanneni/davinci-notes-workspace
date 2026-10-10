export {
  openAndIndexVault,
  openAndIndexVaultFromPicker,
  indexVaultFull,
  reconcileVaultChanges,
} from "./VaultIndexer";
export { createFolderInVault } from "./createFolderInVault";
export { createNoteInVault } from "./createNoteInVault";
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
export { writeAttachmentToVault } from "./writeAttachment";
export {
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
  withVaultWatchSuppressed,
} from "./vaultWatchSession";
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
} from "./vaultCommands";
export { useVaultSession } from "./useVaultSession";

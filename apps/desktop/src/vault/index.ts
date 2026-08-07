export {
  openAndIndexVault,
  openAndIndexVaultFromPicker,
  indexVaultFull,
  reconcileVaultChanges,
} from "./VaultIndexer";
export { noteFromMarkdown } from "./noteFromMarkdown";
export {
  countIndexedNotes,
  getVaultIndexDb,
  persistNote,
  removeNoteFromIndex,
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
  openVault,
  openVaultFromPicker,
  readNote,
  setVaultWatcherPaused,
  startVaultWatcher,
  subscribeVaultChanges,
  writeNote,
  type FileTreeNode,
  type VaultChangeBatch,
} from "./vaultCommands";

import { useState, useCallback } from "react";
import { defaultVaultManager } from "./vaultManager";
import { defaultNoteStore } from "./noteStore";
import type { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import type { VaultInfo } from "./types";
import { defaultVaultIndexer } from "../indexer";
import type { SortMode } from "./folderViewHelpers";

export function useFilesScreenState() {
  const [adapter, setAdapter] = useState<MobileVaultStorageAdapter | null>(
    null,
  );
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [hasAnyVaults, setHasAnyVaults] = useState<boolean | null>(null);
  const [allNotes, setAllNotes] = useState<string[]>([]);
  const [allFolders, setAllFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const [actionTargetNote, setActionTargetNote] = useState<string | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const loadVault = useCallback(async () => {
    const {
      adapter: active,
      info,
      hasAnyVaults: exists,
    } = await defaultVaultManager.getActiveAdapter();
    setHasAnyVaults(exists);
    setVaultInfo(info);
    setAdapter(active);

    if (active) {
      setIsLoadingNotes(true);
      try {
        const scan = await active.scanVault();
        setAllNotes(scan.notes);
        setAllFolders(scan.folders);
        defaultVaultIndexer.indexVault(active).catch(() => {});
      } catch (err) {
        setVaultInfo({
          ...info,
          isAccessible: false,
          error: err instanceof Error ? err.message : "Failed to scan vault",
        });
      } finally {
        setIsLoadingNotes(false);
      }
    }
  }, []);

  const togglePin = (path: string) => {
    setPinnedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!adapter) return;
    const fullPath = currentFolder
      ? `${currentFolder}/${folderName}`
      : folderName;
    await adapter.createFolder(fullPath);
    await loadVault();
  };

  const handleRenameNote = async (sourcePath: string, newStem: string) => {
    if (!adapter) return;
    const dir = sourcePath.includes("/")
      ? sourcePath.substring(0, sourcePath.lastIndexOf("/"))
      : "";
    const ext = sourcePath.endsWith(".canvas") ? ".canvas" : ".md";
    const targetPath = dir ? `${dir}/${newStem}${ext}` : `${newStem}${ext}`;
    await adapter.renameNote(sourcePath, targetPath);
    defaultNoteStore.remove(sourcePath);
    defaultNoteStore.register(targetPath);
    await defaultVaultIndexer.indexVault(adapter, false);
    await loadVault();
  };

  return {
    adapter,
    vaultInfo,
    hasAnyVaults,
    allNotes,
    allFolders,
    currentFolder,
    setCurrentFolder,
    sortMode,
    setSortMode,
    pinnedNotes,
    togglePin,
    actionTargetNote,
    setActionTargetNote,
    isLoadingNotes,
    loadVault,
    handleCreateFolder,
    handleRenameNote,
  };
}

import { useState, useEffect, useCallback } from "react";
import type { GraphIndex } from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { pickVaultFolder } from "./pickVaultFolder";
import {
  getAutoOpenVault,
  getRecentVaults,
  removeRecentVault,
  type RecentVaultEntry,
} from "./recentVaultsRegistry";
import { useVaultWatcherSubscription } from "./useVaultWatcherSubscription";
import { useVaultFileCreation } from "./useVaultFileCreation";
import { switchVault, closeVault } from "./vaultSwitchOrchestrator";

const FIXTURE_VAULT = __FIXTURE_VAULT_PATH__;
const LARGE_FIXTURE_VAULT = __LARGE_FIXTURE_VAULT_PATH__;

export function useVaultSession() {
  const [log, setLog] = useState<string[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [recentVaults, setRecentVaults] = useState<RecentVaultEntry[]>([]);
  const graph = useWorkspaceStore((state) => state.graph);
  const setGraph = useCallback((nextGraph: GraphIndex) => {
    useWorkspaceStore.setState({ graph: nextGraph });
  }, []);

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const setVaultPath = useWorkspaceStore((state) => state.setVaultPath);

  const append = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-24), line]);
    console.info(`[vault] ${line}`);
  }, []);

  useEffect(() => {
    const handleNotificationLog = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) {
        append(detail);
      }
    };
    window.addEventListener("davinci:notification-log", handleNotificationLog);
    return () => {
      window.removeEventListener(
        "davinci:notification-log",
        handleNotificationLog,
      );
    };
  }, [append]);

  useVaultWatcherSubscription({ append, setGraph, setVaultError });

  const { createNewNote, createNewFolder, createNewCanvas, handleLinkClick } =
    useVaultFileCreation({ append });

  const refreshRecentVaults = useCallback(async () => {
    try {
      const recents = await getRecentVaults();
      setRecentVaults(recents);
    } catch {
      setRecentVaults([]);
    }
  }, []);

  const handleRemoveRecentVault = useCallback(async (path: string) => {
    try {
      const updated = await removeRecentVault(path);
      setRecentVaults(updated);
    } catch {
      await refreshRecentVaults();
    }
  }, [refreshRecentVaults]);

  const switchVaultTo = useCallback(
    async (targetPath: string) => {
      setIsLoadingVault(true);
      setVaultError(null);
      try {
        const success = await switchVault(targetPath, (err) => {
          setVaultError(err.message);
          append(`Vault switch failed: ${err.message}`);
        });
        if (success) {
          append(`Switched vault to: ${targetPath}`);
          await refreshRecentVaults();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setVaultError(msg);
        append(`Vault switch error: ${msg}`);
      } finally {
        setIsLoadingVault(false);
      }
    },
    [append, refreshRecentVaults],
  );

  const openPicker = useCallback(async () => {
    try {
      const selected = await pickVaultFolder();
      if (selected) {
        await switchVaultTo(selected);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      append(`Folder picker cancelled or failed: ${msg}`);
    }
  }, [append, switchVaultTo]);

  const createNewVault = useCallback(async () => {
    try {
      const selected = await pickVaultFolder();
      if (!selected) return;
      setIsLoadingVault(true);
      setVaultError(null);
      const success = await switchVault(selected, (err) => {
        setVaultError(err.message);
        append(`Vault initialization failed: ${err.message}`);
      });
      if (success) {
        append(`Opened vault: ${selected}`);
        const notes = useWorkspaceStore.getState().allNotePaths;
        if (notes.length === 0) {
          await createNewNote("Welcome");
        }
        await refreshRecentVaults();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      append(`Vault creation failed: ${msg}`);
      setVaultError(msg);
    } finally {
      setIsLoadingVault(false);
    }
  }, [append, createNewNote, refreshRecentVaults]);

  // Backwards compatibility for loadVaultByMethod
  const loadVaultByMethod = useCallback(
    async (
      loader: () => Promise<{
        vaultPath: string;
      }>,
    ) => {
      setIsLoadingVault(true);
      setVaultError(null);
      try {
        const res = await loader();
        await switchVaultTo(res.vaultPath);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setVaultError(msg);
        append(msg);
      } finally {
        setIsLoadingVault(false);
      }
    },
    [append, switchVaultTo],
  );

  // Auto-open last vault on launch
  useEffect(() => {
    let mounted = true;
    void refreshRecentVaults();
    void getAutoOpenVault().then((autoVault) => {
      if (mounted && autoVault && !useWorkspaceStore.getState().vaultPath) {
        void switchVaultTo(autoVault.path);
      }
    });
    return () => {
      mounted = false;
    };
  }, [switchVaultTo, refreshRecentVaults]);

  return {
    log,
    vaultPath,
    setVaultPath,
    isLoadingVault,
    vaultError,
    setVaultError,
    recentVaults,
    refreshRecentVaults,
    handleRemoveRecentVault,
    graph,
    loadVaultByMethod,
    createNewNote,
    createNewFolder,
    createNewCanvas,
    handleLinkClick,
    switchVaultTo,
    createNewVault,
    openFixture: () => void switchVaultTo(FIXTURE_VAULT),
    openLargeFixture: () => void switchVaultTo(LARGE_FIXTURE_VAULT),
    openPicker,
    closeVault,
  };
}


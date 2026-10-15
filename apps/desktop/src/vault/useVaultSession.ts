import { useState, useEffect, useCallback } from "react";
import type { GraphIndex } from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { pickVaultFolder } from "./pickVaultFolder";
import { getAutoOpenVault } from "./recentVaultsRegistry";
import { useVaultWatcherSubscription } from "./useVaultWatcherSubscription";
import { useVaultFileCreation } from "./useVaultFileCreation";
import { switchVault, closeVault } from "./vaultSwitchOrchestrator";

const FIXTURE_VAULT = __FIXTURE_VAULT_PATH__;
const LARGE_FIXTURE_VAULT = __LARGE_FIXTURE_VAULT_PATH__;

export function useVaultSession() {
  const [log, setLog] = useState<string[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const graph = useWorkspaceStore((state) => state.graph);
  const setGraph = useCallback((nextGraph: GraphIndex) => {
    useWorkspaceStore.setState({ graph: nextGraph });
  }, []);

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const setVaultPath = useWorkspaceStore((state) => state.setVaultPath);

  const append = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-12), line]);
    console.info(`[vault] ${line}`);
  }, []);

  useVaultWatcherSubscription({ append, setGraph, setVaultError });

  const { createNewNote, createNewFolder, createNewCanvas, handleLinkClick } =
    useVaultFileCreation({ append });

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
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setVaultError(msg);
        append(`Vault switch error: ${msg}`);
      } finally {
        setIsLoadingVault(false);
      }
    },
    [append],
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
    void getAutoOpenVault().then((autoVault) => {
      if (mounted && autoVault && !useWorkspaceStore.getState().vaultPath) {
        void switchVaultTo(autoVault.path);
      }
    });
    return () => {
      mounted = false;
    };
  }, [switchVaultTo]);

  return {
    log,
    vaultPath,
    setVaultPath,
    isLoadingVault,
    vaultError,
    setVaultError,
    graph,
    loadVaultByMethod,
    createNewNote,
    createNewFolder,
    createNewCanvas,
    handleLinkClick,
    switchVaultTo,
    openFixture: () => void switchVaultTo(FIXTURE_VAULT),
    openLargeFixture: () => void switchVaultTo(LARGE_FIXTURE_VAULT),
    openPicker,
    closeVault,
  };
}

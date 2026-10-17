import { invoke } from "@tauri-apps/api/core";

export interface RecentVaultEntry {
  path: string;
  name: string;
  lastOpenedAt: number;
  exists?: boolean;
}

export async function getRecentVaults(): Promise<RecentVaultEntry[]> {
  try {
    return await invoke<RecentVaultEntry[]>("get_recent_vaults");
  } catch (error) {
    console.warn("[vault-registry] Failed to read recent vaults:", error);
    return [];
  }
}

export async function recordRecentVault(
  path: string,
): Promise<RecentVaultEntry[]> {
  try {
    return await invoke<RecentVaultEntry[]>("record_recent_vault", { path });
  } catch (error) {
    console.warn("[vault-registry] Failed to record recent vault:", error);
    return [];
  }
}

export async function removeRecentVault(
  path: string,
): Promise<RecentVaultEntry[]> {
  try {
    return await invoke<RecentVaultEntry[]>("remove_recent_vault", { path });
  } catch (error) {
    console.warn("[vault-registry] Failed to remove recent vault:", error);
    return [];
  }
}

export async function checkVaultExists(path: string): Promise<boolean> {
  try {
    return await invoke<boolean>("check_vault_exists", { path });
  } catch {
    return false;
  }
}

/**
 * Identify the most recently opened valid vault on app launch.
 * Scans recent vaults in order (most recent first); returns first existing folder.
 * If none exist or all paths are missing/unreadable, returns null.
 */
export async function getAutoOpenVault(): Promise<RecentVaultEntry | null> {
  const recent = await getRecentVaults();
  for (const entry of recent) {
    if (entry.exists !== false) {
      return entry;
    }
  }
  return null;
}

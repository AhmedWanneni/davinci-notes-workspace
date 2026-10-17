import { Paths, File } from "expo-file-system";
import type { MobileVaultRegistry } from "./vaultRegistryTypes";
import type { VaultMode } from "./types";

export interface LegacyVaultConfig {
  vaultUri: string;
  vaultName: string;
  mode: VaultMode;
}

export async function loadRegistryFromDisk(
  registryPath: string,
  legacyConfigPath: string,
): Promise<MobileVaultRegistry> {
  try {
    const regFile = new File(registryPath);
    if (regFile.exists) {
      const raw = await regFile.text();
      return JSON.parse(raw) as MobileVaultRegistry;
    }
    const legacyFile = new File(legacyConfigPath);
    if (legacyFile.exists) {
      const raw = await legacyFile.text();
      const legacy = JSON.parse(raw) as LegacyVaultConfig;
      const initial: MobileVaultRegistry = {
        activeVaultUri: legacy.vaultUri,
        vaults: [
          {
            uri: legacy.vaultUri,
            name: legacy.vaultName,
            mode: legacy.mode,
            createdAt: Date.now(),
          },
        ],
      };
      saveRegistryToDisk(registryPath, initial);
      return initial;
    }
  } catch {
    // Return empty fallback on parse error
  }
  return { activeVaultUri: null, vaults: [] };
}

export function saveRegistryToDisk(
  registryPath: string,
  registry: MobileVaultRegistry,
): void {
  const regFile = new File(registryPath);
  regFile.write(JSON.stringify(registry, null, 2));
}

export async function verifyDirectoryAccess(
  vaultUri: string,
): Promise<{ isAccessible: boolean; error?: string }> {
  try {
    const info = Paths.info(vaultUri);
    if (!info.exists) {
      return {
        isAccessible: false,
        error: "Vault folder does not exist or was deleted.",
      };
    }
    if (!info.isDirectory) {
      return {
        isAccessible: false,
        error: "Specified vault path is not a directory.",
      };
    }
    return { isAccessible: true };
  } catch (err) {
    return {
      isAccessible: false,
      error:
        err instanceof Error
          ? err.message
          : "Permission revoked or folder inaccessible.",
    };
  }
}

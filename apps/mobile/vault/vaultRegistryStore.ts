import { Paths, File } from "expo-file-system";
import type { MobileVaultRegistry } from "./vaultRegistryTypes";
import type { VaultMode } from "./types";
import { normalizeToValidFileUri } from "./pathUtils";

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
      const parsed = JSON.parse(raw) as MobileVaultRegistry;
      return {
        activeVaultUri: parsed.activeVaultUri
          ? normalizeToValidFileUri(parsed.activeVaultUri)
          : null,
        vaults: (parsed.vaults || []).map((v) => ({
          ...v,
          uri: normalizeToValidFileUri(v.uri),
        })),
      };
    }
    const legacyFile = new File(legacyConfigPath);
    if (legacyFile.exists) {
      const raw = await legacyFile.text();
      const legacy = JSON.parse(raw) as LegacyVaultConfig;
      const normLegacyUri = normalizeToValidFileUri(legacy.vaultUri);
      const initial: MobileVaultRegistry = {
        activeVaultUri: normLegacyUri,
        vaults: [
          {
            uri: normLegacyUri,
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
    const norm = normalizeToValidFileUri(vaultUri);
    if (!norm || norm.startsWith("content://")) {
      return {
        isAccessible: false,
        error:
          "External Document Picker folders (content://) cannot be accessed directly. Please create a new folder in app storage to sync your files.",
      };
    }
    const info = Paths.info(norm);
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
    const rawMsg = err instanceof Error ? err.message : String(err);
    if (
      /character in path|FileSystemPath|IllegalArgumentException|URI/i.test(
        rawMsg,
      )
    ) {
      return {
        isAccessible: false,
        error:
          "Invalid or external folder path. Please create a new folder in app storage to sync your files.",
      };
    }
    return {
      isAccessible: false,
      error: rawMsg || "Permission revoked or folder inaccessible.",
    };
  }
}

import { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import { INITIAL_WELCOME_NOTE } from "./initialWelcomeNote";
import {
  createSandboxVaultDirectory,
  deleteVaultDirectory,
  pickDirectory,
} from "./fs/vaultStorage";
import { syncExternalDirectoryToSandbox } from "./fs/syncExternalDirectory";
import type { RegisteredVault } from "./vaultRegistryTypes";

export async function createNewSandboxVault(name: string): Promise<{
  adapter: MobileVaultStorageAdapter;
  vault: RegisteredVault;
}> {
  const { uri: rawVaultUri, folderName } = createSandboxVaultDirectory(name);
  try {
    const adapter = new MobileVaultStorageAdapter(rawVaultUri, "sandbox");
    await adapter.createFolder("Attachments");
    await adapter.writeNote(
      "Welcome to DaVinci Notes.md",
      INITIAL_WELCOME_NOTE,
    );
    return {
      adapter,
      vault: {
        uri: adapter.vaultUri,
        name: name.trim() || folderName,
        mode: "sandbox",
        createdAt: Date.now(),
      },
    };
  } catch (err) {
    deleteVaultDirectory(rawVaultUri);
    throw err;
  }
}

export async function pickExternalDirectoryVault(): Promise<{
  adapter: MobileVaultStorageAdapter;
  vault: RegisteredVault;
} | null> {
  const picked = await pickDirectory();
  if (!picked?.uri) return null;

  // Create a clean sandbox folder to sync external notes safely
  const { uri: newVaultUri, folderName } = createSandboxVaultDirectory(
    picked.name || "External Vault",
  );
  try {
    const adapter = new MobileVaultStorageAdapter(newVaultUri, "sandbox");
    await syncExternalDirectoryToSandbox(picked.uri, newVaultUri);

    return {
      adapter,
      vault: {
        uri: adapter.vaultUri,
        name: picked.name || folderName,
        mode: picked.uri.startsWith("content://") ? "saf" : "sandbox",
        createdAt: Date.now(),
      },
    };
  } catch (err) {
    deleteVaultDirectory(newVaultUri);
    throw err;
  }
}

export async function pickAndCreateFolderToSyncExternalVault(
  customName?: string,
): Promise<{
  adapter: MobileVaultStorageAdapter;
  vault: RegisteredVault;
  copiedCount: number;
} | null> {
  const picked = await pickDirectory();
  if (!picked?.uri) return null;

  const targetName = customName?.trim() || picked.name || "Synced Vault";
  const { uri: newVaultUri, folderName } =
    createSandboxVaultDirectory(targetName);
  try {
    const adapter = new MobileVaultStorageAdapter(newVaultUri, "sandbox");
    const copiedCount = await syncExternalDirectoryToSandbox(
      picked.uri,
      newVaultUri,
    );

    return {
      adapter,
      vault: {
        uri: adapter.vaultUri,
        name: folderName,
        mode: "sandbox",
        createdAt: Date.now(),
      },
      copiedCount,
    };
  } catch (err) {
    deleteVaultDirectory(newVaultUri);
    throw err;
  }
}

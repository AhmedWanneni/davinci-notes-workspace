import { Paths } from "expo-file-system";
import { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import type { VaultInfo } from "./types";
import type { MobileVaultRegistry, RegisteredVault } from "./vaultRegistryTypes";
import { INITIAL_WELCOME_NOTE } from "./initialWelcomeNote";
import { loadRegistryFromDisk, saveRegistryToDisk } from "./vaultRegistryStore";
import {
  createSandboxVaultDirectory,
  deleteVaultDirectory,
  pickDirectory,
  verifyDirectoryAccess,
} from "./fs/vaultStorage";

const docDir = Paths.document.uri.endsWith("/")
  ? Paths.document.uri
  : `${Paths.document.uri}/`;

const REGISTRY_FILE = `${docDir}.davinci_vault_registry.json`;
const LEGACY_CONFIG_FILE = `${docDir}.davinci_vault_config.json`;

export class VaultManager {
  private activeAdapter: MobileVaultStorageAdapter | null = null;

  async getRegistry(): Promise<MobileVaultRegistry> {
    return loadRegistryFromDisk(REGISTRY_FILE, LEGACY_CONFIG_FILE);
  }

  async saveRegistry(registry: MobileVaultRegistry): Promise<void> {
    saveRegistryToDisk(REGISTRY_FILE, registry);
  }

  async verifyVaultAccess(
    vaultUri: string,
  ): Promise<{ isAccessible: boolean; error?: string }> {
    return verifyDirectoryAccess(vaultUri);
  }

  async createSandboxVault(name: string): Promise<MobileVaultStorageAdapter> {
    const { uri: rawVaultUri, folderName } = createSandboxVaultDirectory(name);
    let adapter: MobileVaultStorageAdapter;

    try {
      adapter = new MobileVaultStorageAdapter(rawVaultUri, "sandbox");
      await adapter.createFolder("Attachments");
      await adapter.writeNote(
        "Welcome to DaVinci Notes.md",
        INITIAL_WELCOME_NOTE,
      );
    } catch (err) {
      deleteVaultDirectory(rawVaultUri);
      throw err;
    }

    const vaultUri = adapter.vaultUri;
    const registry = await this.getRegistry();
    const newVault: RegisteredVault = {
      uri: vaultUri,
      name: name.trim() || folderName,
      mode: "sandbox",
      createdAt: Date.now(),
    };
    const updatedVaults = [
      ...registry.vaults.filter((v) => v.uri !== vaultUri),
      newVault,
    ];
    await this.saveRegistry({
      activeVaultUri: vaultUri,
      vaults: updatedVaults,
    });

    this.activeAdapter = adapter;
    return adapter;
  }

  async pickAndOpenFolder(): Promise<{
    success: boolean;
    adapter?: MobileVaultStorageAdapter;
    error?: string;
  }> {
    try {
      const picked = await pickDirectory();
      if (!picked || !picked.uri) {
        return { success: false };
      }

      const adapter = new MobileVaultStorageAdapter(picked.uri, "saf");
      const vaultUri = adapter.vaultUri;
      const name = picked.name || "External Vault";

      const registry = await this.getRegistry();
      const newVault: RegisteredVault = {
        uri: vaultUri,
        name,
        mode: "saf",
        createdAt: Date.now(),
      };
      const updatedVaults = [
        ...registry.vaults.filter((v) => v.uri !== vaultUri),
        newVault,
      ];
      await this.saveRegistry({
        activeVaultUri: vaultUri,
        vaults: updatedVaults,
      });

      this.activeAdapter = adapter;
      return { success: true, adapter };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to open selected directory.",
      };
    }
  }

  async switchVault(uri: string): Promise<MobileVaultStorageAdapter | null> {
    const registry = await this.getRegistry();
    const target = registry.vaults.find((v) => v.uri === uri);
    if (!target) return null;

    await this.saveRegistry({ ...registry, activeVaultUri: uri });
    const access = await this.verifyVaultAccess(uri);
    if (!access.isAccessible) {
      this.activeAdapter = null;
      return null;
    }

    this.activeAdapter = new MobileVaultStorageAdapter(uri, target.mode);
    return this.activeAdapter;
  }

  async openDirectoryVault(
    uri: string,
    name?: string,
  ): Promise<MobileVaultStorageAdapter | null> {
    const registry = await this.getRegistry();
    let target = registry.vaults.find((v) => v.uri === uri);
    const mode = uri.startsWith("content://") ? "saf" : "sandbox";

    let nextVaults = registry.vaults;
    if (!target) {
      const parts = uri.replace(/\/+$/, "").split("/");
      target = {
        uri,
        name: name?.trim() || parts[parts.length - 1] || "Synced Vault",
        mode,
        createdAt: Date.now(),
      };
      nextVaults = [...registry.vaults, target];
    }

    await this.saveRegistry({ ...registry, vaults: nextVaults, activeVaultUri: uri });
    this.activeAdapter = new MobileVaultStorageAdapter(uri, target.mode);
    return this.activeAdapter;
  }

  async renameVault(uri: string, newDisplayName: string): Promise<void> {
    const trimmed = newDisplayName.trim();
    if (!trimmed) return;
    const registry = await this.getRegistry();
    const updatedVaults = registry.vaults.map((v) =>
      v.uri === uri ? { ...v, name: trimmed } : v,
    );
    await this.saveRegistry({ ...registry, vaults: updatedVaults });
  }

  async removeVault(uri: string): Promise<void> {
    const registry = await this.getRegistry();
    const nextVaults = registry.vaults.filter((v) => v.uri !== uri);
    const nextActive =
      registry.activeVaultUri === uri
        ? (nextVaults[0]?.uri ?? null)
        : registry.activeVaultUri;
    await this.saveRegistry({ activeVaultUri: nextActive, vaults: nextVaults });
    if (this.activeAdapter?.vaultUri === uri) {
      this.activeAdapter = null;
    }
  }

  async getActiveAdapter(): Promise<{
    adapter: MobileVaultStorageAdapter | null;
    info: VaultInfo;
    hasAnyVaults: boolean;
  }> {
    const registry = await this.getRegistry();
    if (!registry.vaults.length || !registry.activeVaultUri) {
      return {
        adapter: null,
        info: {
          uri: "",
          name: "No Vault",
          mode: "sandbox",
          isAccessible: false,
          error: "No vault configured. Please create or open a vault.",
        },
        hasAnyVaults: false,
      };
    }

    const active =
      registry.vaults.find((v) => v.uri === registry.activeVaultUri) ??
      registry.vaults[0];
    const access = await this.verifyVaultAccess(active.uri);

    if (!access.isAccessible) {
      return {
        adapter: null,
        info: {
          uri: active.uri,
          name: active.name,
          mode: active.mode,
          isAccessible: false,
          error: access.error,
        },
        hasAnyVaults: true,
      };
    }

    if (!this.activeAdapter || this.activeAdapter.vaultUri !== active.uri) {
      this.activeAdapter = new MobileVaultStorageAdapter(
        active.uri,
        active.mode,
      );
    }

    return {
      adapter: this.activeAdapter,
      info: {
        uri: active.uri,
        name: active.name,
        mode: active.mode,
        isAccessible: true,
      },
      hasAnyVaults: true,
    };
  }

  async initDefaultSandboxVault(): Promise<MobileVaultStorageAdapter> {
    return this.createSandboxVault("Default Vault");
  }

  async recoverToDefaultSandbox(): Promise<MobileVaultStorageAdapter> {
    return this.initDefaultSandboxVault();
  }
}

export const defaultVaultManager = new VaultManager();

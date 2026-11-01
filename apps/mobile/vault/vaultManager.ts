import { Paths } from "expo-file-system";
import { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import type { VaultInfo } from "./types";
import type {
  MobileVaultRegistry,
  RegisteredVault,
} from "./vaultRegistryTypes";
import { loadRegistryFromDisk, saveRegistryToDisk } from "./vaultRegistryStore";
import { verifyDirectoryAccess } from "./fs/vaultStorage";
import { normalizeToValidFileUri, toPosixPath } from "./pathUtils";
import {
  createNewSandboxVault,
  pickExternalDirectoryVault,
} from "./vaultCreation";

const docDir = Paths.document.uri.endsWith("/")
  ? Paths.document.uri
  : `${Paths.document.uri}/`;

const REGISTRY_FILE = `${docDir}.davinci_vault_registry.json`;
const LEGACY_CONFIG_FILE = `${docDir}.davinci_vault_config.json`;

const NO_VAULT_INFO: VaultInfo = {
  uri: "",
  name: "No Vault",
  mode: "sandbox",
  isAccessible: false,
  error: "No vault configured. Please create or open a vault.",
};

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

  private async registerAndActivate(
    vault: RegisteredVault,
    adapter: MobileVaultStorageAdapter,
  ): Promise<void> {
    const registry = await this.getRegistry();
    const updatedVaults = [
      ...registry.vaults.filter(
        (v) => normalizeToValidFileUri(v.uri) !== vault.uri,
      ),
      vault,
    ];
    await this.saveRegistry({
      activeVaultUri: vault.uri,
      vaults: updatedVaults,
    });
    this.activeAdapter = adapter;
  }

  async createSandboxVault(name: string): Promise<MobileVaultStorageAdapter> {
    const { adapter, vault } = await createNewSandboxVault(name);
    await this.registerAndActivate(vault, adapter);
    return adapter;
  }

  async pickAndOpenFolder(): Promise<{
    success: boolean;
    adapter?: MobileVaultStorageAdapter;
    error?: string;
  }> {
    try {
      const res = await pickExternalDirectoryVault();
      if (!res) return { success: false };
      await this.registerAndActivate(res.vault, res.adapter);
      return { success: true, adapter: res.adapter };
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
    const normUri = normalizeToValidFileUri(uri);
    const registry = await this.getRegistry();
    const target = registry.vaults.find(
      (v) => normalizeToValidFileUri(v.uri) === normUri || v.uri === uri,
    );
    if (!target) return null;

    await this.saveRegistry({ ...registry, activeVaultUri: normUri });
    const access = await this.verifyVaultAccess(normUri);
    if (!access.isAccessible) {
      this.activeAdapter = null;
      return null;
    }

    this.activeAdapter = new MobileVaultStorageAdapter(normUri, target.mode);
    return this.activeAdapter;
  }

  async openDirectoryVault(
    uri: string,
    name?: string,
  ): Promise<MobileVaultStorageAdapter | null> {
    const normUri = normalizeToValidFileUri(uri);
    const registry = await this.getRegistry();
    let target = registry.vaults.find(
      (v) => normalizeToValidFileUri(v.uri) === normUri || v.uri === uri,
    );
    const mode = normUri.startsWith("content://") ? "saf" : "sandbox";

    if (!target) {
      const decoded = toPosixPath(normUri);
      const parts = decoded.replace(/\/+$/, "").split("/");
      target = {
        uri: normUri,
        name: name?.trim() || parts[parts.length - 1] || "Synced Vault",
        mode,
        createdAt: Date.now(),
      };
    } else {
      target = { ...target, uri: normUri };
    }

    const nextVaults = [
      ...registry.vaults.filter(
        (v) => normalizeToValidFileUri(v.uri) !== normUri,
      ),
      target,
    ];
    await this.saveRegistry({
      ...registry,
      vaults: nextVaults,
      activeVaultUri: normUri,
    });
    this.activeAdapter = new MobileVaultStorageAdapter(normUri, target.mode);
    return this.activeAdapter;
  }

  async renameVault(uri: string, newDisplayName: string): Promise<void> {
    const trimmed = newDisplayName.trim();
    if (!trimmed) return;
    const normUri = normalizeToValidFileUri(uri);
    const registry = await this.getRegistry();
    const updatedVaults = registry.vaults.map((v) =>
      normalizeToValidFileUri(v.uri) === normUri ? { ...v, name: trimmed } : v,
    );
    await this.saveRegistry({ ...registry, vaults: updatedVaults });
  }

  async removeVault(uri: string): Promise<void> {
    const normUri = normalizeToValidFileUri(uri);
    const registry = await this.getRegistry();
    const nextVaults = registry.vaults.filter(
      (v) => normalizeToValidFileUri(v.uri) !== normUri,
    );
    const nextActive =
      normalizeToValidFileUri(registry.activeVaultUri || "") === normUri
        ? (nextVaults[0]?.uri ?? null)
        : registry.activeVaultUri;
    await this.saveRegistry({ activeVaultUri: nextActive, vaults: nextVaults });
    if (
      this.activeAdapter &&
      normalizeToValidFileUri(this.activeAdapter.vaultUri) === normUri
    ) {
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
      return { adapter: null, info: NO_VAULT_INFO, hasAnyVaults: false };
    }

    const normActiveUri = normalizeToValidFileUri(registry.activeVaultUri);
    const active =
      registry.vaults.find(
        (v) => normalizeToValidFileUri(v.uri) === normActiveUri,
      ) ?? registry.vaults[0];
    const targetUri = normalizeToValidFileUri(active.uri);
    const access = await this.verifyVaultAccess(targetUri);

    if (!access.isAccessible) {
      return {
        adapter: null,
        info: {
          uri: targetUri,
          name: active.name,
          mode: active.mode,
          isAccessible: false,
          error: access.error,
        },
        hasAnyVaults: true,
      };
    }

    if (
      !this.activeAdapter ||
      normalizeToValidFileUri(this.activeAdapter.vaultUri) !== targetUri
    ) {
      this.activeAdapter = new MobileVaultStorageAdapter(
        targetUri,
        active.mode,
      );
    }

    return {
      adapter: this.activeAdapter,
      info: {
        uri: targetUri,
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

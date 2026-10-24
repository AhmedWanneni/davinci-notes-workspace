import type {
  RecentVaultEntry,
  VaultRegistryAdapter,
} from "@app/platform-adapters";
import {
  checkVaultExists as invokeCheckVaultExists,
  getRecentVaults as invokeGetRecentVaults,
  recordRecentVault as invokeRecordRecentVault,
  removeRecentVault as invokeRemoveRecentVault,
} from "../vault/recentVaultsRegistry";

export class TauriVaultRegistryAdapter implements VaultRegistryAdapter {
  async getRecentVaults(): Promise<RecentVaultEntry[]> {
    const list = await invokeGetRecentVaults();
    return list.map((item) => ({
      path: item.path,
      name: item.name,
      lastOpened: item.lastOpenedAt,
    }));
  }

  async recordRecentVault(path: string, _name: string): Promise<void> {
    await invokeRecordRecentVault(path);
  }

  async removeRecentVault(path: string): Promise<void> {
    await invokeRemoveRecentVault(path);
  }

  async checkVaultExists(path: string): Promise<boolean> {
    return invokeCheckVaultExists(path);
  }
}

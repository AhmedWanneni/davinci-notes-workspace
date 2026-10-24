export interface RecentVaultEntry {
  path: string;
  name: string;
  lastOpened: number;
}

export interface VaultRegistryAdapter {
  getRecentVaults(): Promise<RecentVaultEntry[]>;
  recordRecentVault(path: string, name: string): Promise<void>;
  removeRecentVault(path: string): Promise<void>;
  checkVaultExists(path: string): Promise<boolean>;
}

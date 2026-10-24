import type {
  RecentVaultEntry,
  VaultRegistryAdapter,
} from "../VaultRegistryAdapter";

const RECENT_VAULTS_STORAGE_KEY = "davinci:recent-vaults";

export class WebVaultRegistryAdapter implements VaultRegistryAdapter {
  private entries: RecentVaultEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(RECENT_VAULTS_STORAGE_KEY);
        if (raw) {
          this.entries = JSON.parse(raw) as RecentVaultEntry[];
        }
      } catch {
        this.entries = [];
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(
          RECENT_VAULTS_STORAGE_KEY,
          JSON.stringify(this.entries),
        );
      } catch {
        // Ignore storage errors
      }
    }
  }

  async getRecentVaults(): Promise<RecentVaultEntry[]> {
    return [...this.entries].sort((a, b) => b.lastOpened - a.lastOpened);
  }

  async recordRecentVault(path: string, name: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.path !== path);
    this.entries.unshift({
      path,
      name,
      lastOpened: Date.now(),
    });
    if (this.entries.length > 10) {
      this.entries = this.entries.slice(0, 10);
    }
    this.saveToStorage();
  }

  async removeRecentVault(path: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.path !== path);
    this.saveToStorage();
  }

  async checkVaultExists(path: string): Promise<boolean> {
    return this.entries.some((e) => e.path === path);
  }
}

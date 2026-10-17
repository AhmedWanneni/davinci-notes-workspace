import type { VaultMode } from "./types";

export interface RegisteredVault {
  readonly uri: string;
  readonly name: string;
  readonly mode: VaultMode;
  readonly createdAt: number;
}

export interface MobileVaultRegistry {
  readonly activeVaultUri: string | null;
  readonly vaults: readonly RegisteredVault[];
}

export function sanitizeVaultFolderName(name: string): string {
  const trimmed = name.trim();
  // Strip characters illegal across iOS/Android POSIX/FAT/APFS paths
  const sanitized = trimmed
    .replace(/[/\\:*?"<>|\0]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim();
  return sanitized || `Vault_${Date.now()}`;
}

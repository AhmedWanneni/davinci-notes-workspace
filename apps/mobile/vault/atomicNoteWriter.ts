import type { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import type { VaultStat } from "./types";

export interface ConflictCheckResult {
  hasConflict: boolean;
  diskMtime: number;
  diskSize: number;
}

/**
 * Checks whether the file on disk was modified externally since lastKnownMtime.
 * Returns true if disk mtime is greater than lastKnownMtime + 500ms (clock tolerance).
 */
export async function checkForExternalConflict(
  adapter: MobileVaultStorageAdapter,
  relativePath: string,
  lastKnownMtime: number,
): Promise<ConflictCheckResult> {
  if (lastKnownMtime <= 0) {
    return { hasConflict: false, diskMtime: 0, diskSize: 0 };
  }

  const stat = await adapter.statFile(relativePath);
  if (!stat.exists) {
    return { hasConflict: false, diskMtime: 0, diskSize: 0 };
  }

  // 500ms threshold prevents false positives from filesystem timestamp granularity
  const hasConflict = stat.mtime > lastKnownMtime + 500;
  return {
    hasConflict,
    diskMtime: stat.mtime,
    diskSize: stat.size,
  };
}

/**
 * Atomically writes a note to disk.
 *
 * Uses adapter.writeNote, which writes to an internal temporary file (.name.<nonce>.tmp)
 * and atomically moves it over the target with overwrite: true.
 *
 * This guarantees that even if the app process is force-killed mid-write,
 * the target note is never left corrupted, truncated, or half-written.
 */
export async function atomicWriteNote(
  adapter: MobileVaultStorageAdapter,
  relativePath: string,
  content: string,
): Promise<VaultStat> {
  return await adapter.writeNote(relativePath, content);
}

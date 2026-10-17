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
 * Atomically writes a note to disk:
 * 1. Writes content to a temporary file in the vault (`.tmp.<timestamp>_<rand>`).
 * 2. Renames the temporary file over the destination note file (atomic move/rename).
 *
 * This guarantees that even if the app process is force-killed mid-write,
 * the target note is never left corrupted, truncated, or half-written.
 */
export async function atomicWriteNote(
  adapter: MobileVaultStorageAdapter,
  relativePath: string,
  content: string,
): Promise<VaultStat> {
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tempPath = `${relativePath}.tmp.${nonce}`;

  try {
    // 1. Write entire payload to the temp file
    await adapter.writeNote(tempPath, content);

    // 2. Atomic rename/move over the target path
    await adapter.renameNote(tempPath, relativePath);

    // 3. Return updated file stat
    return await adapter.statFile(relativePath);
  } catch (error) {
    // Clean up temporary file if write or rename failed
    try {
      await adapter.deleteNote(tempPath);
    } catch {
      // Ignore cleanup error
    }
    throw error;
  }
}

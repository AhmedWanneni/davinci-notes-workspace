import type { ManifestSnapshot } from "@app/sync-client";
import type { MobileVaultStorageAdapter } from "../vault";

export interface PendingChangesSummary {
  pendingCount: number;
  addedPaths: string[];
  modifiedPaths: string[];
  deletedPaths: string[];
}

/**
 * Calculates local pending changes that have not yet been synchronized to remote.
 * Compares current local filesystem state against the last synced ManifestSnapshot.
 */
export async function calculatePendingChanges(
  adapter: MobileVaultStorageAdapter,
  lastSyncedSnapshot?: ManifestSnapshot | null,
): Promise<PendingChangesSummary> {
  const scan = await adapter.scanVault();
  const currentNotes = new Set(scan.notes);
  const currentStats = scan.stats;

  const previousEntries = new Map(
    (lastSyncedSnapshot?.entries ?? []).map((e) => [e.path, e]),
  );

  const addedPaths: string[] = [];
  const modifiedPaths: string[] = [];
  const deletedPaths: string[] = [];

  // Check current local notes
  for (const path of scan.notes) {
    const prev = previousEntries.get(path);
    if (!prev || prev.deleted) {
      addedPaths.push(path);
    } else {
      const stat = currentStats[path];
      const prevMeta = lastSyncedSnapshot?.metadata?.[path];

      // Check size or mtime delta
      if (stat && prevMeta) {
        if (stat.size !== prevMeta.size || stat.mtime !== prevMeta.mtimeMs) {
          modifiedPaths.push(path);
        }
      } else if (stat && stat.size !== prev.size) {
        modifiedPaths.push(path);
      }
    }
  }

  // Check for deleted notes
  for (const [path, prev] of previousEntries.entries()) {
    if (!prev.deleted && !currentNotes.has(path)) {
      deletedPaths.push(path);
    }
  }

  const pendingCount =
    addedPaths.length + modifiedPaths.length + deletedPaths.length;

  return {
    pendingCount,
    addedPaths,
    modifiedPaths,
    deletedPaths,
  };
}

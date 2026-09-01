export interface SyncthingConflictInfo {
  path: string;
  originalPath: string;
  filename: string;
  originalFilename: string;
  conflictDetails?: string;
}

/** Check if a vault-relative path is a Syncthing conflict file. */
export function isSyncthingConflictPath(path: string): boolean {
  const filename = path.split("/").pop() ?? path;
  return /\.sync-conflict-[^/]+$/i.test(filename);
}

/** Extract original file path from a Syncthing conflict path. */
export function parseSyncthingConflictInfo(
  path: string,
): SyncthingConflictInfo {
  const parts = path.split("/");
  const filename = parts.pop() ?? path;
  const dir = parts.length > 0 ? `${parts.join("/")}/` : "";

  const match = filename.match(/^(.*?)\.sync-conflict-([^.]+)(\..*)?$/i);
  if (!match) {
    return {
      path,
      originalPath: path,
      filename,
      originalFilename: filename,
    };
  }

  const stem = match[1] ?? "";
  const conflictDetails = match[2] ?? "";
  const ext = match[3] ?? "";
  const originalFilename = `${stem}${ext}`;
  const originalPath = `${dir}${originalFilename}`;

  return {
    path,
    originalPath,
    filename,
    originalFilename,
    conflictDetails,
  };
}

/** Filter and return all active Syncthing conflict files in the vault. */
export function findSyncthingConflictFiles(
  allPaths: readonly string[],
): SyncthingConflictInfo[] {
  return allPaths
    .filter(isSyncthingConflictPath)
    .map(parseSyncthingConflictInfo);
}

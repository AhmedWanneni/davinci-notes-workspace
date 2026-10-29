import type { DriveClient } from "./driveApi";
import type { DriveFile } from "./driveApiTypes";

export function getDriveMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".canvas")) return "application/json";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

export async function findDriveFolder(
  drive: DriveClient,
  name: string,
  parentId?: string,
): Promise<DriveFile | undefined> {
  const escaped = name.replaceAll("'", "\\'");
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${escaped}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  const files = await drive.listFiles({ query });
  return files[0];
}

export async function createDriveFolder(
  drive: DriveClient,
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  return drive.createFile({
    name,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : undefined,
  });
}

export async function getOrCreateDriveFolder(
  drive: DriveClient,
  name: string,
  parentId?: string,
): Promise<DriveFile> {
  const existing = await findDriveFolder(drive, name, parentId);
  if (existing) return existing;
  return createDriveFolder(drive, name, parentId);
}

export async function ensureDriveVaultFolder(
  drive: DriveClient,
  vaultName: string,
): Promise<DriveFile> {
  return getOrCreateDriveFolder(drive, vaultName);
}

export async function ensureDriveFolderPath(
  drive: DriveClient,
  subfolderPath: string,
  rootFolderId: string,
  folderCache?: Map<string, string>,
): Promise<string> {
  const segments = subfolderPath.split(/[/\\]/).filter(Boolean);
  let currentParentId = rootFolderId;
  let pathSoFar = "";
  for (const segment of segments) {
    pathSoFar = pathSoFar ? `${pathSoFar}/${segment}` : segment;
    const cached = folderCache?.get(pathSoFar);
    if (cached) {
      currentParentId = cached;
      continue;
    }
    const folder = await getOrCreateDriveFolder(drive, segment, currentParentId);
    folderCache?.set(pathSoFar, folder.id);
    currentParentId = folder.id;
  }
  return currentParentId;
}

export async function listDriveVaultFiles(
  drive: DriveClient,
  vaultFolderId: string,
): Promise<DriveFile[]> {
  const escaped = vaultFolderId.replaceAll("'", "\\'");
  const query = `('${escaped}' in parents or appProperties has { key = 'davinciVault' and value = '${escaped}' }) and trashed = false`;
  return drive.listFiles({ query });
}

export async function syncFileToDriveVault(
  drive: DriveClient,
  vaultFolderId: string,
  relativePath: string,
  body: Blob,
  contentHash: string,
  knownExisting?: DriveFile,
  folderCache?: Map<string, string>,
): Promise<DriveFile> {
  const parts = relativePath.split(/[/\\]/).filter(Boolean);
  const filename = parts.pop()!;
  const dirPath = parts.join("/");
  const targetFolderId = dirPath
    ? await ensureDriveFolderPath(drive, dirPath, vaultFolderId, folderCache)
    : vaultFolderId;

  let existing = knownExisting;
  if (!existing && knownExisting === undefined) {
    const escaped = filename.replaceAll("'", "\\'");
    const query = `name = '${escaped}' and '${targetFolderId}' in parents and trashed = false`;
    const [found] = await drive.listFiles({ query });
    existing = found;
  }

  const appProperties = {
    davinciVault: vaultFolderId,
    vaultPath: relativePath,
    contentHash,
  };

  if (existing) {
    if (existing.appProperties?.contentHash === contentHash) {
      return existing;
    }
    return drive.uploadFileMedia(existing.id, body, appProperties);
  }

  return drive.uploadFileMultipart({
    name: filename,
    body,
    parents: [targetFolderId],
    mimeType: getDriveMimeType(filename),
    appProperties,
  });
}

export async function deleteFileFromDriveVault(
  drive: DriveClient,
  vaultFolderId: string,
  relativePath: string,
  knownExisting?: DriveFile,
): Promise<void> {
  if (knownExisting) {
    await drive.deleteFile(knownExisting.id);
    return;
  }
  const parts = relativePath.split(/[/\\]/).filter(Boolean);
  const filename = parts.pop()!;
  const dirPath = parts.join("/");
  const targetFolderId = dirPath
    ? await ensureDriveFolderPath(drive, dirPath, vaultFolderId)
    : vaultFolderId;

  const escaped = filename.replaceAll("'", "\\'");
  const query = `name = '${escaped}' and '${targetFolderId}' in parents and trashed = false`;
  const [existing] = await drive.listFiles({ query });
  if (existing) {
    await drive.deleteFile(existing.id);
  }
}

import {
  createJsonManifestStore,
  deleteFileFromDriveVault,
  DriveClient,
  DriveReauthRequiredError,
  ensureDriveVaultFolder,
  generateManifest,
  listDriveVaultFiles,
  syncFileToDriveVault,
  type DriveFile,
  type ManifestEntry,
  type ManifestSnapshot,
} from "@app/sync-client";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import {
  listFolders,
  listNotes,
  setVaultWatcherPaused,
} from "../vault/vaultCommands";
import { getDriveAccessToken } from "./desktopDriveAuth";
import { getDesktopDeviceId } from "./desktopDeviceId";
import { DesktopManifestStorage } from "./desktopManifestStorage";
import { createDesktopManifestSource } from "./desktopManifestSource";
import { applyDownloadedPayload, readFilePayload } from "./desktopFilePayload";

export interface DesktopSyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  error?: string;
  reauthRequired?: boolean;
}

export async function runDesktopDriveSync(opts?: {
  mockDriveClient?: DriveClient;
}): Promise<DesktopSyncResult> {
  const vaultPath = useWorkspaceStore.getState().vaultPath;
  if (!vaultPath) {
    return {
      success: false,
      pushedCount: 0,
      pulledCount: 0,
      error: "No vault open",
    };
  }

  let drive: DriveClient;
  if (opts?.mockDriveClient) {
    drive = opts.mockDriveClient;
  } else {
    try {
      const token = await getDriveAccessToken();
      drive = new DriveClient({ accessToken: token });
    } catch (err) {
      const isReauth = err instanceof DriveReauthRequiredError;
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        reauthRequired: isReauth,
        error: isReauth
          ? "Authentication required"
          : err instanceof Error
            ? err.message
            : String(err),
      };
    }
  }

  const deviceId = getDesktopDeviceId();
  const manifestStorage = new DesktopManifestStorage();
  const manifestStore = createJsonManifestStore(manifestStorage);
  const previousLocal = await manifestStore.load();
  const vaultName =
    vaultPath.split(/[/\\]/).filter(Boolean).pop() || "Sophia";

  try {
    const vaultFolder = await ensureDriveVaultFolder(drive, vaultName);
    const driveFiles = await listDriveVaultFiles(drive, vaultFolder.id);
    const driveFilesByPath = new Map<string, DriveFile>();
    for (const df of driveFiles) {
      if (df.mimeType === "application/vnd.google-apps.folder") continue;
      const key = df.appProperties?.vaultPath || df.name;
      driveFilesByPath.set(key, df);
    }

    const manifestSource = createDesktopManifestSource();
    const manifestResult = await generateManifest(
      manifestSource,
      previousLocal,
    );
    const localSnapshot: ManifestSnapshot = {
      entries: manifestResult.entries,
      metadata: manifestResult.metadata,
    };
    const localByPath = new Map(localSnapshot.entries.map((e) => [e.path, e]));

    let pushedCount = 0;
    const folderCache = new Map<string, string>();
    folderCache.set("", vaultFolder.id);

    for (const item of localSnapshot.entries) {
      if (item.deleted) {
        if (driveFilesByPath.has(item.path)) {
          await deleteFileFromDriveVault(
            drive,
            vaultFolder.id,
            item.path,
            driveFilesByPath.get(item.path),
          );
          driveFilesByPath.delete(item.path);
          pushedCount++;
        }
      } else {
        const existing = driveFilesByPath.get(item.path);
        if (!existing || existing.appProperties?.contentHash !== item.hash) {
          const blob = await readFilePayload(item.path);
          const uploaded = await syncFileToDriveVault(
            drive,
            vaultFolder.id,
            item.path,
            blob,
            item.hash,
            existing,
            folderCache,
          );
          driveFilesByPath.set(item.path, uploaded);
          await drive.uploadContent({
            name: item.path,
            hash: item.hash,
            body: blob,
          });
          pushedCount++;
        }
      }
    }

    let pulledCount = 0;
    const toPullPaths = Array.from(driveFilesByPath.keys()).filter(
      (p) => !localByPath.has(p),
    );
    if (toPullPaths.length > 0) {
      await setVaultWatcherPaused(true);
      try {
        for (const path of toPullPaths) {
          const df = driveFilesByPath.get(path);
          if (df) {
            const buf = await drive.downloadFile(df.id);
            await applyDownloadedPayload(path, buf);
            pulledCount++;
          }
        }
      } finally {
        await setVaultWatcherPaused(false);
      }
    }

    const finalEntries = new Map<string, ManifestEntry>();
    for (const e of manifestResult.entries) finalEntries.set(e.path, e);
    for (const path of toPullPaths) {
      const df = driveFilesByPath.get(path);
      if (df) {
        finalEntries.set(path, {
          path,
          hash: df.appProperties?.contentHash || "",
          size: df.size ?? 0,
          deviceClock: 1,
          modifiedTime: Date.now(),
        });
      }
    }

    const finalSnapshot: ManifestSnapshot = {
      entries: Array.from(finalEntries.values()),
      metadata: manifestResult.metadata,
    };
    await manifestStore.save(finalSnapshot);

    const ownManifestName = `manifests/${deviceId}.json`;
    const manifestBlob = new Blob([JSON.stringify(finalSnapshot, null, 2)], {
      type: "application/json",
    });
    const existingOwn = await drive.findByName(ownManifestName);
    await drive.uploadAppData(
      ownManifestName,
      manifestBlob,
      {},
      existingOwn?.id,
    );

    if (pulledCount > 0) {
      const notes = await listNotes();
      const folders = await listFolders();
      useWorkspaceStore.setState({
        allNotePaths: notes,
        allFolderPaths: folders,
      });
    }

    return { success: true, pushedCount, pulledCount };
  } catch (err) {
    if (err instanceof DriveReauthRequiredError) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        reauthRequired: true,
        error: "Authentication required",
      };
    }
    return {
      success: false,
      pushedCount: 0,
      pulledCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

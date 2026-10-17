import {
  classifySyncDiff,
  createJsonManifestStore,
  DriveClient,
  DriveReauthRequiredError,
  generateManifest,
  type ManifestEntry,
  type ManifestSnapshot,
} from "@app/sync-client";
import type { MobileVaultStorageAdapter } from "../vault";
import { defaultSecureTokenStore } from "./secureTokenStore";
import { MobileManifestStorage } from "./mobileManifestStore";
import { MobileSyncIndexUpdater } from "./mobileSyncIndexUpdater";
import { evaluateSyncPolicy } from "./syncPolicy";
import { processAndApplyConflict } from "./conflictApplier";
import {
  calculatePendingChanges,
  type PendingChangesSummary,
} from "./pendingChangesTracker";
import {
  downloadFileAtomicallyWithRetry,
  uploadContentWithRetry,
} from "./transferWithRetry";
import type {
  NetworkBatteryState,
  SyncConflictInfo,
  SyncPassResult,
  SyncProgress,
} from "./types";

export interface MobileSyncEngineOptions {
  adapter: MobileVaultStorageAdapter;
  deviceId: string;
  clientId: string;
  onProgress?: (progress: SyncProgress) => void;
  mockDriveClient?: DriveClient; // for testing
}

export class MobileSyncEngine {
  private isRunning = false;

  constructor(private readonly options: MobileSyncEngineOptions) {}

  async getPendingChanges(): Promise<PendingChangesSummary> {
    const manifestStorage = new MobileManifestStorage(this.options.adapter);
    const manifestStore = createJsonManifestStore(manifestStorage);
    const previousLocal = await manifestStore.load();
    return calculatePendingChanges(this.options.adapter, previousLocal);
  }

  async runSyncPass(
    opts: {
      isManual?: boolean;
      networkState?: NetworkBatteryState;
      abortSignal?: AbortSignal;
    } = {},
  ): Promise<SyncPassResult> {
    if (this.isRunning) {
      const pending = await this.getPendingChanges();
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [],
        pendingChangesCount: pending.pendingCount,
        error: "Sync already in progress",
      };
    }
    this.isRunning = true;

    try {
      // 1. Policy evaluation (metered networks & low battery)
      const netState = opts.networkState ?? {
        networkType: "wifi",
        isMetered: false,
        batteryLevel: 1.0,
        isLowPowerMode: false,
      };
      const policy = evaluateSyncPolicy(netState, undefined, opts.isManual);
      if (!policy.canSync) {
        const pending = await this.getPendingChanges();
        return {
          success: false,
          pushedCount: 0,
          pulledCount: 0,
          conflicts: [],
          policyReason: policy.reason,
          pendingChangesCount: pending.pendingCount,
          error: `Sync skipped: ${policy.reason}`,
        };
      }

      // 2. Drive Client initialization
      let drive: DriveClient;
      if (this.options.mockDriveClient) {
        drive = this.options.mockDriveClient;
      } else {
        const token = await defaultSecureTokenStore.load();
        if (!token?.accessToken) {
          return {
            success: false,
            pushedCount: 0,
            pulledCount: 0,
            conflicts: [],
            reauthRequired: true,
            error: "Authentication required",
          };
        }
        drive = new DriveClient({ accessToken: token.accessToken });
      }

      // 3. Manifest generation & diffing
      this.options.onProgress?.({
        phase: "generating-manifest",
        current: 0,
        total: 1,
      });
      const manifestStorage = new MobileManifestStorage(this.options.adapter);
      const manifestStore = createJsonManifestStore(manifestStorage);
      const previousLocal = await manifestStore.load();

      const manifestResult = await generateManifest(
        this.options.adapter,
        previousLocal,
      );
      const localSnapshot: ManifestSnapshot = {
        entries: manifestResult.entries,
        metadata: manifestResult.metadata,
      };

      this.options.onProgress?.({ phase: "diffing", current: 1, total: 1 });
      const remoteFiles = await drive.listAppDataFiles("trashed = false");
      const remoteManifestFile = remoteFiles.find(
        (f) =>
          f.name.startsWith("manifests/") &&
          !f.name.includes(this.options.deviceId),
      );

      let remoteSnapshot: ManifestSnapshot = { entries: [], metadata: {} };
      if (remoteManifestFile) {
        const remoteBuffer = await drive.downloadFile(remoteManifestFile.id);
        remoteSnapshot = JSON.parse(
          new TextDecoder().decode(remoteBuffer),
        ) as ManifestSnapshot;
      }

      const diffs = classifySyncDiff(
        localSnapshot.entries,
        previousLocal?.entries ?? [],
        remoteSnapshot.entries,
      );

      // 4. Identify conflicts (Strict rule: conflicting changes are left untouched)
      const conflicts: SyncConflictInfo[] = [];
      const toPush: ManifestEntry[] = [];
      const toPull: ManifestEntry[] = [];

      const indexUpdater = new MobileSyncIndexUpdater(this.options.adapter);
      const scan = await this.options.adapter.scanVault();
      const remoteId = remoteManifestFile
        ? remoteManifestFile.name
            .replace(/^manifests\//, "")
            .replace(/\.json$/, "")
        : "remote";

      for (const diff of diffs) {
        if (diff.classification === "conflict") {
          const res = await processAndApplyConflict({
            path: diff.path,
            localEntry: diff.local,
            baseEntry: previousLocal?.entries.find((e) => e.path === diff.path),
            remoteEntry: diff.remote,
            remoteDeviceId: remoteId,
            existingPaths: scan.notes,
            adapter: this.options.adapter,
            drive,
            indexUpdater,
          });
          conflicts.push(res.conflictInfo);
          toPush.push(...res.extraPushEntries);
        } else if (diff.classification === "push" && diff.local) {
          if (!policy.allowAttachments && !diff.path.endsWith(".md")) {
            continue; // Skip heavy attachment upload on metered network
          }
          toPush.push(diff.local);
        } else if (diff.classification === "pull" && diff.remote) {
          toPull.push(diff.remote);
        }
      }

      // 5. Transfer Uploads (Push)
      let pushedCount = 0;
      for (let i = 0; i < toPush.length; i++) {
        if (opts.abortSignal?.aborted) {
          const p = await this.getPendingChanges();
          return {
            success: false,
            interrupted: true,
            pushedCount,
            pulledCount: 0,
            conflicts,
            pendingChangesCount: p.pendingCount,
            error: "Sync interrupted by OS suspension",
          };
        }
        const item = toPush[i];
        this.options.onProgress?.({
          phase: "uploading",
          current: i + 1,
          total: toPush.length,
          currentItem: item.path,
        });
        if (!item.deleted) {
          const body = await this.readBlobForPath(item.path);
          await uploadContentWithRetry(drive, item.path, item.hash, body);
        }
        pushedCount++;
      }

      // 6. Transfer Downloads (Pull)
      let pulledCount = 0;
      for (let i = 0; i < toPull.length; i++) {
        if (opts.abortSignal?.aborted) {
          const p = await this.getPendingChanges();
          return {
            success: false,
            interrupted: true,
            pushedCount,
            pulledCount,
            conflicts,
            pendingChangesCount: p.pendingCount,
            error: "Sync interrupted by OS suspension",
          };
        }
        const item = toPull[i];
        this.options.onProgress?.({
          phase: "downloading",
          current: i + 1,
          total: toPull.length,
          currentItem: item.path,
        });

        if (item.deleted) {
          await this.options.adapter.deleteNote(item.path);
          await indexUpdater.remove(item.path);
        } else {
          const remoteContent = await drive.findByContentHash(item.hash);
          if (remoteContent) {
            await downloadFileAtomicallyWithRetry(
              drive,
              remoteContent.id,
              item.path,
              this.options.adapter,
            );
            await indexUpdater.upsert(item.path);
          }
        }
        pulledCount++;
      }

      // 7. Upload own manifest to appDataFolder
      const entryMap = new Map<string, ManifestEntry>();
      for (const entry of manifestResult.entries)
        entryMap.set(entry.path, entry);
      for (const pulled of toPull) entryMap.set(pulled.path, pulled);
      for (const extra of toPush) entryMap.set(extra.path, extra);
      const finalSnapshot: ManifestSnapshot = {
        entries: Array.from(entryMap.values()),
        metadata: manifestResult.metadata,
      };

      await manifestStore.save(finalSnapshot);
      const manifestBlob = new Blob([JSON.stringify(finalSnapshot, null, 2)], {
        type: "application/json",
      });
      const ownManifestName = `manifests/${this.options.deviceId}.json`;
      const existingOwn = await drive.findByName(ownManifestName);
      await drive.uploadAppData(
        ownManifestName,
        manifestBlob,
        {},
        existingOwn?.id,
      );

      this.options.onProgress?.({ phase: "complete", current: 1, total: 1 });
      const pendingAfter = await this.getPendingChanges();
      return {
        success: true,
        pushedCount,
        pulledCount,
        conflicts,
        pendingChangesCount: pendingAfter.pendingCount,
      };
    } catch (err) {
      if (err instanceof DriveReauthRequiredError) {
        await defaultSecureTokenStore.clear();
        return {
          success: false,
          pushedCount: 0,
          pulledCount: 0,
          conflicts: [],
          reauthRequired: true,
          error: "Drive session expired. Please re-authenticate.",
        };
      }
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        conflicts: [],
        error: String(err),
      };
    } finally {
      this.isRunning = false;
    }
  }

  private async readBlobForPath(path: string): Promise<Blob> {
    if (path.endsWith(".md")) {
      const file = await this.options.adapter.readNote(path);
      return new Blob([file.content], { type: "text/markdown" });
    }
    const bytes = await this.options.adapter.readBinary(path);
    return new Blob([bytes as unknown as BlobPart], {
      type: "application/octet-stream",
    });
  }
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { MobileVaultStorageAdapter } from "../vault";
import {
  resetInMemoryFs,
  inMemoryFs,
  documentDirectory,
} from "./mocks/expoFileSystemMock";
import { MobileSyncEngine } from "../sync/mobileSyncEngine";
import { defaultSecureTokenStore } from "../sync/secureTokenStore";
import { SyncTriggerManager } from "../sync/syncTriggers";
import { BackgroundSyncCoordinator } from "../sync/backgroundSyncCoordinator";
import { SyncStatusBadge } from "../sync/SyncStatusBadge";
import type { DriveClient, ManifestSnapshot } from "@app/sync-client";
import { defaultVaultIndexer } from "../indexer";

describe("Mobile Suspended Sync & Background Lifecycle Verification", () => {
  const VAULT_PHONE = `${documentDirectory}suspended-sync-vault/`;
  let phoneAdapter: MobileVaultStorageAdapter;
  const remoteDriveFiles = new Map<
    string,
    {
      name: string;
      content: ArrayBuffer;
      appProperties?: Record<string, string>;
    }
  >();
  let mockDriveClient: DriveClient;

  beforeEach(async () => {
    resetInMemoryFs();
    remoteDriveFiles.clear();
    await defaultSecureTokenStore.clear();

    inMemoryFs.set(VAULT_PHONE.replace(/\/+$/, ""), {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });

    phoneAdapter = new MobileVaultStorageAdapter(VAULT_PHONE, "sandbox");
    await defaultVaultIndexer.indexVault(phoneAdapter, true);

    mockDriveClient = {
      listAppDataFiles: vi.fn(async () =>
        Array.from(remoteDriveFiles.entries()).map(([id, f]) => ({
          id,
          name: f.name,
          appProperties: f.appProperties,
        })),
      ),
      downloadFile: vi.fn(async (fileId: string) => {
        const file = remoteDriveFiles.get(fileId);
        if (!file) throw new Error(`Not found: ${fileId}`);
        return file.content;
      }),
      findByContentHash: vi.fn(async (hash: string) => {
        for (const [id, f] of remoteDriveFiles.entries()) {
          if (f.appProperties?.contentHash === hash)
            return { id, name: f.name, appProperties: f.appProperties };
        }
      }),
      findByName: vi.fn(async (name: string) => {
        for (const [id, f] of remoteDriveFiles.entries()) {
          if (f.name === name)
            return { id, name: f.name, appProperties: f.appProperties };
        }
      }),
      uploadAppData: vi.fn(
        async (
          name: string,
          body: Blob,
          appProperties = {},
          fileId?: string,
        ) => {
          const buffer = await body.arrayBuffer();
          const id =
            fileId ?? `remote-${Math.random().toString(36).substring(2, 9)}`;
          remoteDriveFiles.set(id, { name, content: buffer, appProperties });
          return { id, name, appProperties };
        },
      ),
      uploadContent: vi.fn(async (item) => {
        const buffer = await item.body.arrayBuffer();
        const id = `content-${item.hash}`;
        remoteDriveFiles.set(id, {
          name: `content/${item.hash}`,
          content: buffer,
          appProperties: { contentHash: item.hash },
        });
        return { file: { id, name: `content/${item.hash}` }, uploaded: true };
      }),
    } as unknown as DriveClient;
  });

  const createEngine = () =>
    new MobileSyncEngine({
      adapter: phoneAdapter,
      deviceId: "phone-1",
      clientId: "mock-client",
      mockDriveClient,
    });

  it("1. Foreground trigger immediately syncs remote updates upon AppState active", async () => {
    const engine = createEngine();

    // Remote device wrote a note
    const remoteManifest: ManifestSnapshot = {
      entries: [
        {
          path: "RemoteNote.md",
          hash: "hash-remote-1",
          size: 18,
          deviceClock: 1,
          deleted: false,
        },
      ],
      metadata: {},
    };
    remoteDriveFiles.set("manifest-remote", {
      name: "manifests/remote-device.json",
      content: new TextEncoder().encode(JSON.stringify(remoteManifest))
        .buffer as ArrayBuffer,
    });
    remoteDriveFiles.set("content-hash-remote-1", {
      name: "content/hash-remote-1",
      content: new TextEncoder().encode("# Hello From Cloud")
        .buffer as ArrayBuffer,
      appProperties: { contentHash: "hash-remote-1" },
    });

    const triggers = new SyncTriggerManager(
      engine,
      {
        autoSyncOnForeground: true,
        autoSyncOnSave: false,
        saveDebounceMs: 50,
        allowCellularSync: true,
        pauseOnLowBattery: true,
        lowBatteryThresholdPercent: 20,
      },
      () => ({
        networkType: "wifi",
        isMetered: false,
        batteryLevel: 0.9,
        isLowPowerMode: false,
      }),
    );
    triggers.start();

    // Trigger AppState change to active
    const res = await triggers.triggerForegroundSync();
    expect(res.success).toBe(true);
    expect(res.pulledCount).toBe(1);

    const note = await phoneAdapter.readNote("RemoteNote.md");
    expect(note.content).toBe("# Hello From Cloud");
    triggers.stop();
  });

  it("2. Safe background execution & cancellation when OS suspends the app", async () => {
    await phoneAdapter.writeNote("LargeNote1.md", "# First note content");
    await phoneAdapter.writeNote("LargeNote2.md", "# Second note content");

    const engine = createEngine();

    const coordinator = new BackgroundSyncCoordinator(engine, {
      timeoutMs: 50,
    });
    coordinator.register();
    expect(coordinator.isTaskRegistered).toBe(true);

    const abortController = new AbortController();
    abortController.abort(); // Simulates OS immediate suspension notice

    const result = await engine.runSyncPass({
      isManual: false,
      abortSignal: abortController.signal,
    });

    expect(result.success).toBe(false);
    expect(result.interrupted).toBe(true);
    expect(result.error).toContain("interrupted by OS suspension");
    expect(result.pendingChangesCount).toBe(2);

    coordinator.unregister();
  });

  it("3. Resume after interruption: zero duplicates, no corrupted files, full convergence", async () => {
    await phoneAdapter.writeNote("Resume1.md", "# Note One");
    await phoneAdapter.writeNote("Resume2.md", "# Note Two");

    const engine = createEngine();

    // Run first pass interrupted
    const abortCtrl = new AbortController();
    abortCtrl.abort();
    const interruptedRes = await engine.runSyncPass({
      abortSignal: abortCtrl.signal,
    });
    expect(interruptedRes.interrupted).toBe(true);

    // Resume sync pass
    const resumeRes = await engine.runSyncPass({ isManual: true });
    expect(resumeRes.success).toBe(true);
    expect(resumeRes.pushedCount).toBe(2);
    expect(resumeRes.pendingChangesCount).toBe(0);

    const pending = await engine.getPendingChanges();
    expect(pending.pendingCount).toBe(0);
  });

  it("4. Low-power mode / low battery pauses auto-sync, manual sync overrides", async () => {
    await phoneAdapter.writeNote("BatteryNote.md", "# Battery test");
    const engine = createEngine();

    // Auto-sync under low-power mode (< 20% or low-power mode on)
    const lowPowerRes = await engine.runSyncPass({
      isManual: false,
      networkState: {
        networkType: "wifi",
        isMetered: false,
        batteryLevel: 0.12,
        isLowPowerMode: true,
      },
    });
    expect(lowPowerRes.success).toBe(false);
    expect(lowPowerRes.policyReason).toBe("low-battery");
    expect(lowPowerRes.pendingChangesCount).toBe(1);

    // Manual sync overrides low-power policy
    const manualRes = await engine.runSyncPass({
      isManual: true,
      networkState: {
        networkType: "wifi",
        isMetered: false,
        batteryLevel: 0.12,
        isLowPowerMode: true,
      },
    });
    expect(manualRes.success).toBe(true);
    expect(manualRes.pushedCount).toBe(1);
    expect(manualRes.pendingChangesCount).toBe(0);
  });

  it("5. UI honesty: badge NEVER shows 'synced' while changes are pending", () => {
    const pastSyncTime = Date.now() - 300_000;

    // 1. Initial synced state: no changes pending, last synced 5 minutes ago
    const syncedBadge = SyncStatusBadge({
      status: "idle",
      lastSyncedAt: pastSyncTime,
      pendingChangesCount: 0,
    }) as React.ReactElement<{ accessibilityLabel: string }>;
    expect(syncedBadge.props.accessibilityLabel).toBe(
      "Sync status: Synced 5m ago",
    );

    // 2. Note edited locally: pendingChangesCount = 1
    const pendingBadge = SyncStatusBadge({
      status: "idle",
      lastSyncedAt: pastSyncTime,
      pendingChangesCount: 1,
    }) as React.ReactElement<{ accessibilityLabel: string }>;
    // MUST NOT claim "Synced" or "Synced 5m ago"
    expect(pendingBadge.props.accessibilityLabel).not.toContain("Synced");
    // MUST honestly show pending changes
    expect(pendingBadge.props.accessibilityLabel).toBe(
      "Sync status: 1 pending change",
    );

    // 3. Multiple pending changes
    const multiPendingBadge = SyncStatusBadge({
      status: "idle",
      lastSyncedAt: pastSyncTime,
      pendingChangesCount: 3,
    }) as React.ReactElement<{ accessibilityLabel: string }>;
    expect(multiPendingBadge.props.accessibilityLabel).toBe(
      "Sync status: 3 pending changes",
    );

    // 4. Paused on low-battery
    const lowBatBadge = SyncStatusBadge({
      status: "paused-low-battery",
      pendingChangesCount: 1,
    }) as React.ReactElement<{ accessibilityLabel: string }>;
    expect(lowBatBadge.props.accessibilityLabel).toBe(
      "Sync status: Sync paused (low battery)",
    );

    // 5. Interrupted state
    const interruptedBadge = SyncStatusBadge({
      status: "interrupted",
      pendingChangesCount: 1,
    }) as React.ReactElement<{ accessibilityLabel: string }>;
    expect(interruptedBadge.props.accessibilityLabel).toBe(
      "Sync status: Sync interrupted — tap to resume",
    );
  });
});

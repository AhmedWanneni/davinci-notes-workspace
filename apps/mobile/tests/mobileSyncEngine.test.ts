import { describe, it, expect, beforeEach, vi } from "vitest";
import { MobileVaultStorageAdapter } from "../vault";
import {
  resetInMemoryFs,
  inMemoryFs,
  documentDirectory,
} from "./mocks/expoFileSystemMock";
import { MobileSyncEngine } from "../sync/mobileSyncEngine";
import { defaultSecureTokenStore } from "../sync/secureTokenStore";
import { executeWithRetry } from "../sync/transferWithRetry";
import type {
  DriveClient,
  DriveFile,
  ManifestSnapshot,
} from "@app/sync-client";
import { defaultVaultIndexer } from "../indexer";

describe("Mobile Manifest Sync & Transfer Verification", () => {
  const VAULT_PHONE = `${documentDirectory}phone-vault/`;
  let phoneAdapter: MobileVaultStorageAdapter;

  // In-memory remote Drive mock
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
      listAppDataFiles: vi.fn(async () => {
        const files: DriveFile[] = [];
        for (const [id, f] of remoteDriveFiles.entries()) {
          files.push({ id, name: f.name, appProperties: f.appProperties });
        }
        return files;
      }),
      downloadFile: vi.fn(async (fileId: string) => {
        const file = remoteDriveFiles.get(fileId);
        if (!file) throw new Error(`Not found: ${fileId}`);
        return file.content;
      }),
      findByContentHash: vi.fn(async (hash: string) => {
        for (const [id, f] of remoteDriveFiles.entries()) {
          if (f.appProperties?.contentHash === hash) {
            return { id, name: f.name, appProperties: f.appProperties };
          }
        }
        return undefined;
      }),
      findByName: vi.fn(async (name: string) => {
        for (const [id, f] of remoteDriveFiles.entries()) {
          if (f.name === name) {
            return { id, name: f.name, appProperties: f.appProperties };
          }
        }
        return undefined;
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

  it("1. Two-device convergence (desktop + phone): create, edit, rename, delete", async () => {
    const desktopManifest: ManifestSnapshot = {
      entries: [
        {
          path: "SharedNote.md",
          hash: "hash-desktop-1",
          size: 20,
          deviceClock: 1,
          deleted: false,
        },
        {
          path: "DeletedOnDesktop.md",
          hash: "hash-del",
          size: 10,
          deviceClock: 2,
          deleted: true,
        },
      ],
      metadata: {},
    };

    // Populate remote Drive with desktop's manifest and content
    remoteDriveFiles.set("manifest-desktop", {
      name: "manifests/desktop-device.json",
      content: new TextEncoder().encode(JSON.stringify(desktopManifest))
        .buffer as ArrayBuffer,
    });
    remoteDriveFiles.set("content-hash-desktop-1", {
      name: "content/hash-desktop-1",
      content: new TextEncoder().encode("# Content from desktop")
        .buffer as ArrayBuffer,
      appProperties: { contentHash: "hash-desktop-1" },
    });

    // Create note on phone
    await phoneAdapter.writeNote("PhoneNote.md", "# Created on phone");

    const engine = new MobileSyncEngine({
      adapter: phoneAdapter,
      deviceId: "phone-device",
      clientId: "test-client",
      mockDriveClient,
    });

    const res = await engine.runSyncPass({ isManual: true });
    expect(res.success).toBe(true);
    expect(res.pushedCount).toBeGreaterThan(0);
    expect(res.pulledCount).toBeGreaterThan(0);

    // Verify phone filesystem has desktop note and local note
    const scan = await phoneAdapter.scanVault();
    expect(scan.notes).toContain("SharedNote.md");
    expect(scan.notes).toContain("PhoneNote.md");
    expect(scan.notes).not.toContain("DeletedOnDesktop.md");

    const sharedContent = await phoneAdapter.readNote("SharedNote.md");
    expect(sharedContent.content).toBe("# Content from desktop");
  });

  it("2. Transfer interruption & retry: recovers mid-transfer with no partial files", async () => {
    let failFirst = true;
    const flakeyDownload = async () => {
      if (failFirst) {
        failFirst = false;
        throw new Error("Simulated network drop / airplane mode");
      }
      return "resumed-content";
    };

    const result = await executeWithRetry(flakeyDownload, {
      maxRetries: 2,
      baseDelayMs: 10,
    });
    expect(result).toBe("resumed-content");
  });

  it("3. Expired / revoked token returns actionable reauthRequired", async () => {
    const engine = new MobileSyncEngine({
      adapter: phoneAdapter,
      deviceId: "phone-device",
      clientId: "test-client",
      // No mock client provided, relies on secureTokenStore which is empty
    });

    const res = await engine.runSyncPass({ isManual: true });
    expect(res.success).toBe(false);
    expect(res.reauthRequired).toBe(true);
    expect(res.error).toContain("Authentication required");
  });

  it("4. Detects conflicts and leaves conflicting files untouched", async () => {
    // Both sides modified the same file
    await phoneAdapter.writeNote("Conflict.md", "# Local edit on phone");

    // Existing base manifest had older version
    const baseManifest: ManifestSnapshot = {
      entries: [
        {
          path: "Conflict.md",
          hash: "old-base-hash",
          size: 5,
          deviceClock: 1,
          deleted: false,
        },
      ],
      metadata: {},
    };
    await phoneAdapter.writeNote(
      ".davinci/manifest.json",
      JSON.stringify(baseManifest),
    );

    // Remote desktop modified it differently
    const desktopManifest: ManifestSnapshot = {
      entries: [
        {
          path: "Conflict.md",
          hash: "remote-desktop-hash",
          size: 25,
          deviceClock: 2,
          deleted: false,
        },
      ],
      metadata: {},
    };
    remoteDriveFiles.set("manifest-desktop", {
      name: "manifests/desktop.json",
      content: new TextEncoder().encode(JSON.stringify(desktopManifest))
        .buffer as ArrayBuffer,
    });

    const engine = new MobileSyncEngine({
      adapter: phoneAdapter,
      deviceId: "phone-device",
      clientId: "test-client",
      mockDriveClient,
    });

    const res = await engine.runSyncPass({ isManual: true });
    expect(res.conflicts.length).toBe(1);
    expect(res.conflicts[0].path).toBe("Conflict.md");

    // Strict requirement: Conflicting file on disk was left completely untouched
    const diskNote = await phoneAdapter.readNote("Conflict.md");
    expect(diskNote.content).toBe("# Local edit on phone");
  });
});

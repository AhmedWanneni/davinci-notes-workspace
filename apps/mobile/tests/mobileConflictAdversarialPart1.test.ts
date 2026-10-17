import { describe, it, expect, beforeEach } from "vitest";
import { resetInMemoryFs } from "./mocks/expoFileSystemMock";
import { defaultSecureTokenStore } from "../sync/secureTokenStore";
import { defaultVaultIndexer } from "../indexer";
import { MobileSyncEngine } from "../sync/mobileSyncEngine";
import {
  createMockDriveClient,
  createDeviceAdapter,
  type RemoteDriveFileEntry,
} from "./helpers/mockDriveHelper";

describe("Adversarial Sync Conflict Cases (Part 1: Cases 1 - 5)", () => {
  const remoteFiles = new Map<string, RemoteDriveFileEntry>();
  let drive: ReturnType<typeof createMockDriveClient>;

  beforeEach(async () => {
    resetInMemoryFs();
    remoteFiles.clear();
    await defaultSecureTokenStore.clear();
    drive = createMockDriveClient(remoteFiles);
  });

  it("Case 1: Same note edited on both devices offline, non-overlapping regions", async () => {
    const devA = createDeviceAdapter("device-a");
    const devB = createDeviceAdapter("device-b");
    const engineA = new MobileSyncEngine({
      adapter: devA,
      deviceId: "device-a",
      clientId: "test-client",
      mockDriveClient: drive,
    });
    const engineB = new MobileSyncEngine({
      adapter: devB,
      deviceId: "device-b",
      clientId: "test-client",
      mockDriveClient: drive,
    });

    // Initial state
    const baseContent = "# Title\n\nSection 1 original\n\nSection 2 original\n";
    await devA.writeNote("Note.md", baseContent);
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });

    // Device B pulls initial state
    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // Offline edits: non-overlapping regions
    await devA.writeNote(
      "Note.md",
      "# Title\n\nSection 1 edited by A\n\nSection 2 original\n",
    );
    await devB.writeNote(
      "Note.md",
      "# Title\n\nSection 1 original\n\nSection 2 edited by B\n",
    );

    // Device A syncs first
    await engineA.runSyncPass({ isManual: true });

    // Device B syncs (merges cleanly)
    const resultB = await engineB.runSyncPass({ isManual: true });
    expect(resultB.conflicts[0]?.resolution).toBe("clean-merge");

    // Device A syncs merged result
    await engineA.runSyncPass({ isManual: true });

    const noteA = await devA.readNote("Note.md");
    const noteB = await devB.readNote("Note.md");
    expect(noteA.content).toBe(noteB.content);
    expect(noteA.content).toContain("Section 1 edited by A");
    expect(noteA.content).toContain("Section 2 edited by B");
  });

  it("Case 2: Same note edited on both devices offline, overlapping regions", async () => {
    const devA = createDeviceAdapter("device-a");
    const devB = createDeviceAdapter("device-b");
    const engineA = new MobileSyncEngine({
      adapter: devA,
      deviceId: "device-a",
      clientId: "test-client",
      mockDriveClient: drive,
    });
    const engineB = new MobileSyncEngine({
      adapter: devB,
      deviceId: "device-b",
      clientId: "test-client",
      mockDriveClient: drive,
    });

    await devA.writeNote("Overlap.md", "Original single line");
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });

    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // Overlapping edits on same line
    await devA.writeNote("Overlap.md", "Conflicting edit by Device A");
    await devB.writeNote("Overlap.md", "Conflicting edit by Device B");

    await engineA.runSyncPass({ isManual: true });
    const resultB = await engineB.runSyncPass({ isManual: true });
    expect(resultB.conflicts[0]?.resolution).toBe("conflict-copy");

    await engineA.runSyncPass({ isManual: true });

    const treeA = await devA.scanVault();
    const treeB = await devB.scanVault();
    expect(treeA.notes.sort()).toEqual(treeB.notes.sort());
    expect(treeB.notes).toContain("Overlap.md");
    expect(
      treeB.notes.some((p) => p.includes("Overlap") && p.includes("copy")),
    ).toBe(true);

    // Verify both versions exist
    const originalOnB = await devB.readNote("Overlap.md");
    const copyPath = treeB.notes.find((p) => p.includes("copy"))!;
    const copyOnB = await devB.readNote(copyPath);
    expect([originalOnB.content, copyOnB.content].sort()).toEqual([
      "Conflicting edit by Device A",
      "Conflicting edit by Device B",
    ]);
  });

  it("Case 3: Delete on one side vs edit on the other (both directions: edit wins)", async () => {
    const devA = createDeviceAdapter("device-a");
    const devB = createDeviceAdapter("device-b");
    const engineA = new MobileSyncEngine({
      adapter: devA,
      deviceId: "device-a",
      clientId: "test-client",
      mockDriveClient: drive,
    });
    const engineB = new MobileSyncEngine({
      adapter: devB,
      deviceId: "device-b",
      clientId: "test-client",
      mockDriveClient: drive,
    });

    await devA.writeNote("DeleteVsEditA.md", "Initial Content 1");
    await devA.writeNote("DeleteVsEditB.md", "Initial Content 2");
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });
    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // 3a: Dev A deletes DeleteVsEditA, Dev B edits it
    await devA.deleteNote("DeleteVsEditA.md");
    await devB.writeNote("DeleteVsEditA.md", "Preserved Edit by Dev B");

    // 3b: Dev A edits DeleteVsEditB, Dev B deletes it
    await devA.writeNote("DeleteVsEditB.md", "Preserved Edit by Dev A");
    await devB.deleteNote("DeleteVsEditB.md");

    await engineA.runSyncPass({ isManual: true });
    await engineB.runSyncPass({ isManual: true });
    await engineA.runSyncPass({ isManual: true });

    const statA1 = await devA.readNote("DeleteVsEditA.md");
    const statB1 = await devB.readNote("DeleteVsEditA.md");
    expect(statA1.content).toBe("Preserved Edit by Dev B");
    expect(statB1.content).toBe("Preserved Edit by Dev B");

    const statA2 = await devA.readNote("DeleteVsEditB.md");
    const statB2 = await devB.readNote("DeleteVsEditB.md");
    expect(statA2.content).toBe("Preserved Edit by Dev A");
    expect(statB2.content).toBe("Preserved Edit by Dev A");
  });

  it("Case 4: Rename on one side vs edit on the other", async () => {
    const devA = createDeviceAdapter("device-a");
    const devB = createDeviceAdapter("device-b");
    const engineA = new MobileSyncEngine({
      adapter: devA,
      deviceId: "device-a",
      clientId: "test-client",
      mockDriveClient: drive,
    });
    const engineB = new MobileSyncEngine({
      adapter: devB,
      deviceId: "device-b",
      clientId: "test-client",
      mockDriveClient: drive,
    });

    await devA.writeNote("Original.md", "Base content for rename test");
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });
    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // Dev A renames Original.md -> RenamedByA.md
    await devA.renameNote("Original.md", "RenamedByA.md");
    // Dev B edits Original.md offline
    await devB.writeNote("Original.md", "Edited by B while A renamed");

    await engineA.runSyncPass({ isManual: true });
    await engineB.runSyncPass({ isManual: true });
    await engineA.runSyncPass({ isManual: true });

    const scanA = await devA.scanVault();
    const scanB = await devB.scanVault();
    expect(scanA.notes.sort()).toEqual(["Original.md", "RenamedByA.md"]);
    expect(scanB.notes.sort()).toEqual(["Original.md", "RenamedByA.md"]);

    const orig = await devA.readNote("Original.md");
    const ren = await devA.readNote("RenamedByA.md");
    expect(orig.content).toBe("Edited by B while A renamed");
    expect(ren.content).toBe("Base content for rename test");
  });

  it("Case 5: Rename on both sides to different names", async () => {
    const devA = createDeviceAdapter("device-a");
    const devB = createDeviceAdapter("device-b");
    const engineA = new MobileSyncEngine({
      adapter: devA,
      deviceId: "device-a",
      clientId: "test-client",
      mockDriveClient: drive,
    });
    const engineB = new MobileSyncEngine({
      adapter: devB,
      deviceId: "device-b",
      clientId: "test-client",
      mockDriveClient: drive,
    });

    await devA.writeNote("Shared.md", "Shared file body");
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });
    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // Dev A renames to NameA.md, Dev B renames to NameB.md
    await devA.renameNote("Shared.md", "NameA.md");
    await devB.renameNote("Shared.md", "NameB.md");

    await engineA.runSyncPass({ isManual: true });
    await engineB.runSyncPass({ isManual: true });
    await engineA.runSyncPass({ isManual: true });

    const scanA = await devA.scanVault();
    const scanB = await devB.scanVault();
    expect(scanA.notes.sort()).toEqual(["NameA.md", "NameB.md"]);
    expect(scanB.notes.sort()).toEqual(["NameA.md", "NameB.md"]);

    const aNote = await devA.readNote("NameA.md");
    const bNote = await devB.readNote("NameB.md");
    expect(aNote.content).toBe("Shared file body");
    expect(bNote.content).toBe("Shared file body");
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { resetInMemoryFs } from "./mocks/expoFileSystemMock";
import { defaultSecureTokenStore } from "../sync/secureTokenStore";
import { defaultVaultIndexer } from "../indexer";
import { MobileSyncEngine } from "../sync/mobileSyncEngine";
import { syncH1ToFilename } from "../vault/h1SyncService";
import {
  createMockDriveClient,
  createDeviceAdapter,
  type RemoteDriveFileEntry,
} from "./helpers/mockDriveHelper";

describe("Adversarial Sync Conflict Cases (Part 2: Cases 6 - 10)", () => {
  const remoteFiles = new Map<string, RemoteDriveFileEntry>();
  let drive: ReturnType<typeof createMockDriveClient>;

  beforeEach(async () => {
    resetInMemoryFs();
    remoteFiles.clear();
    await defaultSecureTokenStore.clear();
    drive = createMockDriveClient(remoteFiles);
  });

  it("Case 6: Same-named new note created on both devices", async () => {
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

    // Initial state: neither device has BrandNew.md
    await devA.writeNote("BrandNew.md", "# Device A Brand New Note Content");
    await devB.writeNote("BrandNew.md", "# Device B Brand New Note Content");

    await defaultVaultIndexer.indexVault(devA, true);
    await defaultVaultIndexer.indexVault(devB, true);

    await engineA.runSyncPass({ isManual: true });
    const resB = await engineB.runSyncPass({ isManual: true });
    expect(resB.conflicts[0]?.resolution).toBe("conflict-copy");

    await engineA.runSyncPass({ isManual: true });

    const treeA = await devA.scanVault();
    const treeB = await devB.scanVault();
    expect(treeA.notes.sort()).toEqual(treeB.notes.sort());
    expect(treeA.notes.length).toBe(2);
    expect(treeA.notes).toContain("BrandNew.md");
    const copyNote = treeA.notes.find(
      (p) => p.includes("BrandNew") && p.includes("copy"),
    )!;
    expect(copyNote).toBeDefined();

    const c1 = await devA.readNote("BrandNew.md");
    const c2 = await devA.readNote(copyNote);
    expect([c1.content, c2.content].sort()).toEqual([
      "# Device A Brand New Note Content",
      "# Device B Brand New Note Content",
    ]);
  });

  it("Case 7: Folder move on one side vs edits inside the folder on other", async () => {
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

    await devA.createFolder("Projects");
    await devA.writeNote("Projects/Spec.md", "Original Specification");
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });
    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // Dev A moves Projects/Spec.md -> Archive/Spec.md
    await devA.createFolder("Archive");
    await devA.renameNote("Projects/Spec.md", "Archive/Spec.md");

    // Dev B edits Projects/Spec.md offline
    await devB.writeNote(
      "Projects/Spec.md",
      "Important revisions made on Dev B",
    );

    await engineA.runSyncPass({ isManual: true });
    await engineB.runSyncPass({ isManual: true });
    await engineA.runSyncPass({ isManual: true });

    const scanA = await devA.scanVault();
    const scanB = await devB.scanVault();
    expect(scanA.notes.sort()).toEqual(["Archive/Spec.md", "Projects/Spec.md"]);
    expect(scanB.notes.sort()).toEqual(["Archive/Spec.md", "Projects/Spec.md"]);

    const orig = await devA.readNote("Projects/Spec.md");
    const moved = await devA.readNote("Archive/Spec.md");
    expect(orig.content).toBe("Important revisions made on Dev B");
    expect(moved.content).toBe("Original Specification");
  });

  it("Case 8: H1<->filename rename interacting with sync-induced rename (no feedback loop)", async () => {
    const dev = createDeviceAdapter("device-h1");
    let writeCount = 0;
    const originalWrite = dev.writeNote.bind(dev);
    dev.writeNote = async (path: string, content: string) => {
      writeCount++;
      return originalWrite(path, content);
    };

    // 1. Initial note arrives from sync
    await dev.writeNote("SyncArrived.md", "# Converged Title\n\nBody line 1");
    const initialWrites = writeCount;
    expect(initialWrites).toBe(1);

    // 2. Trigger H1 rename
    const sync1 = await syncH1ToFilename(
      dev,
      "SyncArrived.md",
      "# Converged Title\n\nBody line 1",
    );
    expect(sync1.renamed).toBe(true);
    expect(sync1.newPath).toBe("Converged Title.md");

    // 3. Subsequent sync pass or re-check: must NO-OP with 0 further writes
    const preCheckWrites = writeCount;
    const sync2 = await syncH1ToFilename(
      dev,
      "Converged Title.md",
      "# Converged Title\n\nBody line 1",
    );
    expect(sync2.renamed).toBe(false);
    expect(writeCount - preCheckWrites).toBe(0); // 0 extra writes -> feedback loop prevented
  });

  it("Case 9: Clock skew between devices (+1 hour) does not affect sync convergence", async () => {
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

    await devA.writeNote("ClockSkew.md", "Base text");
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });
    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // Dev B simulates +1 hour clock skew in stat/mtime
    const origStatB = devB.statFile.bind(devB);
    devB.statFile = async (path: string) => {
      const s = await origStatB(path);
      return { ...s, mtime: s.mtime + 3600000 };
    };

    // Both edit offline
    await devA.writeNote("ClockSkew.md", "Edit from normal clock");
    await devB.writeNote("ClockSkew.md", "Edit from +1hr clock");

    await engineA.runSyncPass({ isManual: true });
    const resB = await engineB.runSyncPass({ isManual: true });
    expect(resB.conflicts[0]?.resolution).toBe("conflict-copy");

    await engineA.runSyncPass({ isManual: true });

    const scanA = await devA.scanVault();
    const scanB = await devB.scanVault();
    expect(scanA.notes.sort()).toEqual(scanB.notes.sort());
    expect(scanA.notes.length).toBe(2);
  });

  it("Case 10: Interrupted merge (kill app mid-merge) recovers cleanly on next sync", async () => {
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

    await devA.writeNote(
      "Interrupted.md",
      "# Line 1 original\n\n# Line 2 original\n",
    );
    await defaultVaultIndexer.indexVault(devA, true);
    await engineA.runSyncPass({ isManual: true });
    await defaultVaultIndexer.indexVault(devB, true);
    await engineB.runSyncPass({ isManual: true });

    // Offline edits
    await devA.writeNote(
      "Interrupted.md",
      "# Line 1 edited by A\n\n# Line 2 original\n",
    );
    await devB.writeNote(
      "Interrupted.md",
      "# Line 1 original\n\n# Line 2 edited by B\n",
    );

    await engineA.runSyncPass({ isManual: true });

    // Simulate crash/process kill during merge write on devB
    let killInjected = true;
    const origWriteNote = devB.writeNote.bind(devB);
    devB.writeNote = async (path: string, content: string) => {
      if (killInjected && path.includes("Interrupted.md")) {
        killInjected = false;
        throw new Error("SIGKILL: Process aborted mid-merge");
      }
      return origWriteNote(path, content);
    };

    const failedPass = await engineB.runSyncPass({ isManual: true });
    expect(failedPass.success).toBe(false);

    // Verify devB note is uncorrupted (atomic temp-file guarantee)
    const intact = await devB.readNote("Interrupted.md");
    expect(intact.content).toBe("# Line 1 original\n\n# Line 2 edited by B\n");

    // Recover: Next sync pass completes cleanly
    const recoveredPass = await engineB.runSyncPass({ isManual: true });
    expect(recoveredPass.success).toBe(true);
    expect(recoveredPass.conflicts[0]?.resolution).toBe("clean-merge");

    await engineA.runSyncPass({ isManual: true });

    const finalA = await devA.readNote("Interrupted.md");
    const finalB = await devB.readNote("Interrupted.md");
    expect(finalA.content).toBe(finalB.content);
    expect(finalA.content).toContain("Line 1 edited by A");
    expect(finalA.content).toContain("Line 2 edited by B");
  });
});

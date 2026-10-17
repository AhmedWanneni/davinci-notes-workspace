import { describe, it, expect, beforeEach } from "vitest";
import {
  MobileVaultStorageAdapter,
  scanVaultDirectory,
  VaultManager,
} from "../vault";
import {
  resetInMemoryFs,
  inMemoryFs,
  documentDirectory,
} from "./mocks/expoFileSystemMock";

describe("Mobile Vault Storage & 5,000-Note Benchmark", () => {
  const VAULT_ROOT = `${documentDirectory}benchmark-vault/`;

  beforeEach(() => {
    resetInMemoryFs();
    inMemoryFs.set(VAULT_ROOT.replace(/\/+$/, ""), {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });
  });

  it("scans a 5,000-note vault with nested folders and attachments under budget", async () => {
    const FOLDER_COUNT = 50;
    const NOTES_PER_FOLDER = 100;
    const ATTACHMENT_COUNT = 250;

    // 1. Seed 50 folders
    for (let f = 1; f <= FOLDER_COUNT; f++) {
      const folderUri = `${VAULT_ROOT}Folder_${f}`;
      inMemoryFs.set(folderUri, {
        isDirectory: true,
        size: 0,
        mtime: Date.now() - 10000,
      });
    }

    // 2. Seed 5,000 notes
    for (let f = 1; f <= FOLDER_COUNT; f++) {
      for (let n = 1; n <= NOTES_PER_FOLDER; n++) {
        const noteUri = `${VAULT_ROOT}Folder_${f}/Note_${n}.md`;
        inMemoryFs.set(noteUri, {
          isDirectory: false,
          content: `# Note ${n} in Folder ${f}\nContent text...`,
          size: 45,
          mtime: Date.now() - (f * 100 + n),
        });
      }
    }

    // 3. Seed 250 attachments
    for (let a = 1; a <= ATTACHMENT_COUNT; a++) {
      const attUri = `${VAULT_ROOT}Folder_${(a % FOLDER_COUNT) + 1}/asset_${a}.png`;
      inMemoryFs.set(attUri, {
        isDirectory: false,
        size: 1024,
        mtime: Date.now() - a * 50,
      });
    }

    // 4. Measure Scan Time & Memory
    const memBefore = process.memoryUsage().heapUsed;
    const t0 = performance.now();

    const result = await scanVaultDirectory(VAULT_ROOT);

    const t1 = performance.now();
    const memAfter = process.memoryUsage().heapUsed;
    const durationMs = t1 - t0;
    const memDeltaMb = (memAfter - memBefore) / (1024 * 1024);

    // Assertions
    expect(result.notes.length).toBe(5000);
    expect(result.folders.length).toBe(50);
    expect(result.attachments.length).toBe(250);
    expect(Object.keys(result.stats).length).toBe(5250);

    // Performance constraints: must scan 5,000 items under 500 ms in memory under parallel load
    expect(durationMs).toBeLessThan(500);
    expect(memDeltaMb).toBeLessThan(30);
  });

  it("handles basic note CRUD and directory operations cleanly", async () => {
    const adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");

    // Write note in nested folder
    await adapter.writeNote("Sub/Daily.md", "# Daily Log\n- [ ] Task 1");

    // Check stats
    const stat = await adapter.statFile("Sub/Daily.md");
    expect(stat.exists).toBe(true);
    expect(stat.isDirectory).toBe(false);

    // Read note
    const payload = await adapter.readNote("Sub/Daily.md");
    expect(payload.content).toContain("# Daily Log");
    expect(payload.path).toBe("Sub/Daily.md");

    // Rename note
    await adapter.renameNote("Sub/Daily.md", "Sub/Archive.md");
    expect((await adapter.statFile("Sub/Daily.md")).exists).toBe(false);
    expect((await adapter.statFile("Sub/Archive.md")).exists).toBe(true);

    // Delete note
    await adapter.deleteNote("Sub/Archive.md");
    expect((await adapter.statFile("Sub/Archive.md")).exists).toBe(false);
  });

  it("shows a recoverable state and does not crash when vault is deleted or permission revoked", async () => {
    const manager = new VaultManager();
    const adapter = await manager.initDefaultSandboxVault();

    // Verify initial access
    const { info: initialInfo } = await manager.getActiveAdapter();
    expect(initialInfo.isAccessible).toBe(true);

    // Simulate user deleting vault folder or revoking permission externally
    inMemoryFs.delete(adapter.vaultUri.replace(/\/+$/, ""));

    // Check active adapter: must not throw, must return recoverable info
    const { adapter: brokenAdapter, info: brokenInfo } =
      await manager.getActiveAdapter();
    expect(brokenAdapter).toBeNull();
    expect(brokenInfo.isAccessible).toBe(false);
    expect(brokenInfo.error).toBeDefined();

    // Recover vault cleanly
    const recoveredAdapter = await manager.recoverToDefaultSandbox();
    expect(recoveredAdapter).toBeDefined();

    const { info: recoveredInfo } = await manager.getActiveAdapter();
    expect(recoveredInfo.isAccessible).toBe(true);
  });
});

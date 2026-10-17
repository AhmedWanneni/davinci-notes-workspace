import { describe, it, expect, beforeEach } from "vitest";
import {
  VaultManager,
  sanitizeVaultFolderName,
  scanVaultDirectory,
} from "../vault";
import {
  resetInMemoryFs,
  inMemoryFs,
  setMockPickedDirectory,
} from "./mocks/expoFileSystemMock";

describe("Mobile Vault Onboarding, Multi-Vault Registry & Adversarial Tests", () => {
  beforeEach(() => {
    resetInMemoryFs();
  });

  it("1. Fresh install: empty registry returns hasAnyVaults: false without crashing", async () => {
    const manager = new VaultManager();
    const { adapter, info, hasAnyVaults } = await manager.getActiveAdapter();

    expect(hasAnyVaults).toBe(false);
    expect(adapter).toBeNull();
    expect(info.isAccessible).toBe(false);
    expect(info.error).toContain("No vault configured");
  });

  it("2. Sandbox creation: creates folder, welcome note, and registers active vault", async () => {
    const manager = new VaultManager();
    const adapter = await manager.createSandboxVault("Personal Vault");

    expect(adapter).toBeDefined();
    expect(adapter.vaultUri).toContain("Personal Vault");

    const stat = await adapter.statFile("Welcome to DaVinci Notes.md");
    expect(stat.exists).toBe(true);

    const note = await adapter.readNote("Welcome to DaVinci Notes.md");
    expect(note.content).toContain("# Welcome to DaVinci Notes");

    const {
      adapter: active,
      info,
      hasAnyVaults,
    } = await manager.getActiveAdapter();
    expect(hasAnyVaults).toBe(true);
    expect(active).not.toBeNull();
    expect(info.name).toBe("Personal Vault");
    expect(info.isAccessible).toBe(true);
  });

  it("3. Kill & relaunch persistence: new VaultManager instance reopens active vault", async () => {
    const session1 = new VaultManager();
    await session1.createSandboxVault("Work Notes");

    // Simulate kill and relaunch by creating fresh manager
    const session2 = new VaultManager();
    const { adapter, info, hasAnyVaults } = await session2.getActiveAdapter();

    expect(hasAnyVaults).toBe(true);
    expect(adapter).not.toBeNull();
    expect(info.name).toBe("Work Notes");
    expect(info.isAccessible).toBe(true);

    const notes = await adapter!.listNotes();
    expect(notes).toContain("Welcome to DaVinci Notes.md");
  });

  it("4. Adversarial names: handles Arabic, emoji, accents, slashes, and spaces safely", async () => {
    // Name sanitization unit checks
    expect(sanitizeVaultFolderName("ملاحظاتي")).toBe("ملاحظاتي");
    expect(sanitizeVaultFolderName("Café & Études")).toBe("Café & Études");
    expect(sanitizeVaultFolderName("Work/Project:2026?")).toBe(
      "Work_Project_2026",
    );
    expect(sanitizeVaultFolderName("   Spaces Vault   ")).toBe("Spaces Vault");
    expect(sanitizeVaultFolderName("///:::***???")).toMatch(/^Vault_/);

    // Functional creation with Arabic & Emoji
    const manager = new VaultManager();
    const testNames = [
      "My Notes",
      "ملاحظات",
      "Café ☕",
      "a  b",
      "x".repeat(150),
    ];
    for (const name of testNames) {
      const adapter = await manager.createSandboxVault(name);
      expect(adapter).toBeDefined();
      expect(adapter.vaultUri).toBeTruthy();

      const stat = await adapter.statFile("Welcome to DaVinci Notes.md");
      expect(stat.exists).toBe(true);

      const notes = await adapter.listNotes();
      expect(notes).toContain("Welcome to DaVinci Notes.md");

      const readBack = await adapter.readNote("Welcome to DaVinci Notes.md");
      expect(readBack.content).toContain("# Welcome to DaVinci Notes");
    }
  });

  it("5. External folder picking: registers SAF directory and persists across restart", async () => {
    const externalUri =
      "content://com.android.externalstorage.documents/tree/notes/";
    inMemoryFs.set(
      "content://com.android.externalstorage.documents/tree/notes",
      {
        isDirectory: true,
        size: 0,
        mtime: Date.now(),
      },
    );
    inMemoryFs.set(
      "content://com.android.externalstorage.documents/tree/notes/ExternalNote.md",
      {
        isDirectory: false,
        content: "# External Content\nFrom Files app.",
        size: 35,
        mtime: Date.now(),
      },
    );

    setMockPickedDirectory(externalUri);

    const manager = new VaultManager();
    const result = await manager.pickAndOpenFolder();
    expect(result.success).toBe(true);
    expect(result.adapter).toBeDefined();

    // Verify notes visible in adapter
    const notes = await result.adapter!.listNotes();
    expect(notes).toContain("ExternalNote.md");

    // Simulate restart
    const relaunchManager = new VaultManager();
    const { adapter, info, hasAnyVaults } =
      await relaunchManager.getActiveAdapter();
    expect(hasAnyVaults).toBe(true);
    expect(info.mode).toBe("saf");
    expect(adapter).not.toBeNull();
  });

  it("6. Multi-vault switcher: registers multiple vaults, switches between them, and removes vaults", async () => {
    const manager = new VaultManager();
    const vaultA = await manager.createSandboxVault("Vault Alpha");
    const vaultB = await manager.createSandboxVault("Vault Beta");

    let reg = await manager.getRegistry();
    expect(reg.vaults.length).toBe(2);
    expect(reg.activeVaultUri).toBe(vaultB.vaultUri);

    // Switch to Alpha
    const switched = await manager.switchVault(vaultA.vaultUri);
    expect(switched).not.toBeNull();
    expect(switched!.vaultUri).toBe(vaultA.vaultUri);

    reg = await manager.getRegistry();
    expect(reg.activeVaultUri).toBe(vaultA.vaultUri);

    // Remove Beta
    await manager.removeVault(vaultB.vaultUri);
    reg = await manager.getRegistry();
    expect(reg.vaults.length).toBe(1);
    expect(reg.vaults[0].name).toBe("Vault Alpha");
  });

  it("7. Deleting vault folder externally reports recoverable state without crash", async () => {
    const manager = new VaultManager();
    const adapter = await manager.createSandboxVault("Ephemeral");

    // Externally delete the directory
    inMemoryFs.delete(adapter.vaultUri.replace(/\/+$/, ""));

    const {
      adapter: broken,
      info,
      hasAnyVaults,
    } = await manager.getActiveAdapter();
    expect(hasAnyVaults).toBe(true);
    expect(broken).toBeNull();
    expect(info.isAccessible).toBe(false);
    expect(info.error).toContain("does not exist or was deleted");

    // Recovering restores accessibility
    const recovered = await manager.recoverToDefaultSandbox();
    expect(recovered).toBeDefined();
    const { info: recInfo } = await manager.getActiveAdapter();
    expect(recInfo.isAccessible).toBe(true);
  });

  it("8. 5,000 files in external directory scans within performance budget", async () => {
    const largeUri = "content://com.android.storage/tree/huge/";
    inMemoryFs.set("content://com.android.storage/tree/huge", {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });

    for (let i = 1; i <= 5000; i++) {
      inMemoryFs.set(`content://com.android.storage/tree/huge/Note_${i}.md`, {
        isDirectory: false,
        content: `# Note ${i}`,
        size: 20,
        mtime: Date.now() - i,
      });
    }

    const t0 = performance.now();
    const scan = await scanVaultDirectory(largeUri);
    const duration = performance.now() - t0;

    expect(scan.notes.length).toBe(5000);
    expect(duration).toBeLessThan(500);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { switchVault, closeVault } from "./vaultSwitchOrchestrator";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { closeVaultIndexDb, withDbLock } from "./sqliteIndex";
import { indexVaultFull } from "./VaultIndexer";
import { listFolders, listNotes, openVault } from "./vaultCommands";
import { deactivateVaultWatcher } from "./vaultWatchSession";
import { recordRecentVault } from "./recentVaultsRegistry";
import { BOOKMARKS_TAB_ID } from "../bookmarks";

vi.mock("./VaultIndexer", () => ({
  indexVaultFull: vi.fn().mockResolvedValue({
    noteCount: 1,
    elapsedMs: 5,
    tagIndex: {},
  }),
}));

vi.mock("./sqliteIndex", () => ({
  closeVaultIndexDb: vi.fn().mockResolvedValue(undefined),
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  queryFullGraphIndex: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  withDbLock: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock("./settingsCommands", () => ({
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./vaultCommands", () => ({
  openVault: vi.fn((p: string) => Promise.resolve(`/canonical${p}`)),
  listNotes: vi.fn().mockResolvedValue(["note1.md"]),
  listFolders: vi.fn().mockResolvedValue(["folder1"]),
  readNote: vi.fn().mockResolvedValue({ content: "{}" }),
  writeNote: vi.fn().mockResolvedValue({ exists: true, mtime: 1, size: 2 }),
}));

vi.mock("./vaultWatchSession", () => ({
  deactivateVaultWatcher: vi.fn().mockResolvedValue(undefined),
  withVaultWatchSuppressed: vi.fn((fn: () => unknown) => fn()),
}));

vi.mock("./recentVaultsRegistry", () => ({
  recordRecentVault: vi.fn().mockResolvedValue([]),
}));

describe("vaultSwitchOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      vaultPath: null,
      openNotes: [],
      activeNotePath: null,
      notesContent: {},
      dirtyNotes: new Set(),
      conflictNotes: new Map(),
    });
  });

  it("switches to new vault from empty state", async () => {
    const success = await switchVault("/Users/test/VaultA");
    expect(success).toBe(true);
    expect(openVault).toHaveBeenCalledWith("/Users/test/VaultA");
    expect(indexVaultFull).toHaveBeenCalled();
    expect(listNotes).toHaveBeenCalled();
    expect(listFolders).toHaveBeenCalled();
    expect(recordRecentVault).toHaveBeenCalledWith(
      "/canonical/Users/test/VaultA",
    );
    expect(useWorkspaceStore.getState().vaultPath).toBe(
      "/canonical/Users/test/VaultA",
    );
  });

  it("tears down old vault cleanly in order before mounting new vault", async () => {
    // Set up active vault with dirty notes
    useWorkspaceStore.setState({
      vaultPath: "/canonical/VaultA",
      openNotes: ["note1.md"],
      activeNotePath: "note1.md",
      dirtyNotes: new Set(["note1.md"]),
    });

    const executionOrder: string[] = [];

    const saveSpy = vi
      .spyOn(useWorkspaceStore.getState(), "saveAllDirty")
      .mockImplementation(async () => {
        executionOrder.push("saveAllDirty");
      });

    vi.mocked(deactivateVaultWatcher).mockImplementation(async () => {
      executionOrder.push("deactivateVaultWatcher");
    });

    vi.mocked(closeVaultIndexDb).mockImplementation(async () => {
      executionOrder.push("closeVaultIndexDb");
    });

    vi.mocked(openVault).mockImplementation(async (p: string) => {
      executionOrder.push(`openVault:${p}`);
      return `/canonical${p}`;
    });

    const success = await switchVault("/VaultB");
    expect(success).toBe(true);

    expect(executionOrder).toEqual([
      "saveAllDirty",
      "deactivateVaultWatcher",
      "closeVaultIndexDb",
      "openVault:/VaultB",
    ]);

    expect(useWorkspaceStore.getState().vaultPath).toBe("/canonical/VaultB");
    saveSpy.mockRestore();
  });

  it("serializes rapid sequential switches without interleaving", async () => {
    const switchOrder: string[] = [];
    vi.mocked(openVault).mockImplementation(async (path: string) => {
      switchOrder.push(`start:${path}`);
      await new Promise((r) => setTimeout(r, 20));
      switchOrder.push(`finish:${path}`);
      return `/canonical${path}`;
    });

    const p1 = switchVault("/Vault1");
    const p2 = switchVault("/Vault2");

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(true);
    expect(r2).toBe(true);

    expect(switchOrder).toEqual([
      "start:/Vault1",
      "finish:/Vault1",
      "start:/Vault2",
      "finish:/Vault2",
    ]);
  });

  it("closeVault tears down active vault and clears vaultPath", async () => {
    useWorkspaceStore.setState({ vaultPath: "/canonical/VaultA" });
    await closeVault();
    expect(deactivateVaultWatcher).toHaveBeenCalled();
    expect(closeVaultIndexDb).toHaveBeenCalled();
    expect(useWorkspaceStore.getState().vaultPath).toBeNull();
  });

  it("handles concurrent vault switch, full indexing, and settings update safely", async () => {
    useWorkspaceStore.setState({ vaultPath: "/canonical/VaultA" });
    const log: string[] = [];

    const indexingOperation = withDbLock(async () => {
      log.push("indexing:start");
      await new Promise((r) => setTimeout(r, 15));
      log.push("indexing:end");
      return true;
    });

    const settingsOperation = withDbLock(async () => {
      log.push("settings:start");
      await new Promise((r) => setTimeout(r, 10));
      log.push("settings:end");
      return true;
    });

    const switchOperation = switchVault("/VaultB");

    const [idxRes, setRes, swRes] = await Promise.all([
      indexingOperation,
      settingsOperation,
      switchOperation,
    ]);

    expect(idxRes).toBe(true);
    expect(setRes).toBe(true);
    expect(swRes).toBe(true);
    expect(log).toContain("indexing:start");
    expect(log).toContain("indexing:end");
    expect(log).toContain("settings:start");
    expect(log).toContain("settings:end");
    expect(useWorkspaceStore.getState().vaultPath).toBe("/canonical/VaultB");
  });

  it("restores BOOKMARKS_TAB_ID in session restore", async () => {
    const { getSetting } = await import("./settingsCommands");
    vi.mocked(getSetting).mockImplementation(async (_db, key) => {
      if (key === "session.openNotes") {
        return JSON.stringify(["note1.md", BOOKMARKS_TAB_ID]);
      }
      if (key === "session.activeNotePath") {
        return BOOKMARKS_TAB_ID;
      }
      return null;
    });

    await switchVault("/VaultWithBookmarks");
    expect(useWorkspaceStore.getState().openNotes).toContain(BOOKMARKS_TAB_ID);
    expect(useWorkspaceStore.getState().activeNotePath).toBe(BOOKMARKS_TAB_ID);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { indexVaultFull, reconcileVaultChanges } from "./VaultIndexer";

const {
  listNotes,
  readNote,
  setVaultWatcherPaused,
  startVaultWatcher,
  getVaultIndexDb,
} = vi.hoisted(() => ({
  listNotes: vi.fn(),
  readNote: vi.fn(),
  setVaultWatcherPaused: vi.fn(),
  startVaultWatcher: vi.fn(),
  getVaultIndexDb: vi.fn(),
}));

vi.mock("./vaultCommands", () => ({
  listNotes,
  readNote,
  openVault: vi.fn(),
  setVaultWatcherPaused,
  startVaultWatcher,
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb,
  clearVaultIndex: vi.fn(),
  persistNotesBatch: vi.fn(),
  removeNoteFromIndex: vi.fn(),
}));

vi.mock("./noteFromMarkdown", () => ({
  noteFromMarkdown: (path: string) => ({
    path,
    title: path,
    frontmatter: {},
    mtime: Date.now(),
    outlinks: [{ target: "other.md", targetRaw: "other", resolved: true }],
  }),
}));

describe("Vault Stress & Repeated Cycle Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockPaths = Array.from({ length: 350 }, (_, i) => `note_${i}.md`);
    listNotes.mockResolvedValue(mockPaths);
    readNote.mockImplementation(async (path: string) => ({
      path,
      content: `# ${path}`,
      mtime: 1000,
    }));
    setVaultWatcherPaused.mockResolvedValue(undefined);
    startVaultWatcher.mockResolvedValue(undefined);

    const mockDb = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockResolvedValue([]),
    };
    getVaultIndexDb.mockResolvedValue(mockDb);
  });

  it(
    "executes 10 consecutive vault open & index cycles without lock errors",
    { timeout: 15000 },
    async () => {
      for (let cycle = 1; cycle <= 10; cycle += 1) {
        const result = await indexVaultFull();
        expect(result.noteCount).toBe(350);
        expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
      }

      expect(setVaultWatcherPaused).toHaveBeenCalled();
      expect(startVaultWatcher).toHaveBeenCalledTimes(10);
    },
  );

  it("handles watcher-driven reconcile boundary stress immediately after index", async () => {
    const indexPromise = indexVaultFull();
    const reconcilePromise = reconcileVaultChanges({
      changed: ["note_0.md", "note_1.md"],
      removed: [],
    });

    const [indexRes, reconcileRes] = await Promise.all([
      indexPromise,
      reconcilePromise,
    ]);

    expect(indexRes.noteCount).toBe(350);
    expect(reconcileRes.updated).toBe(2);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const listNotes = vi.fn();
const readNote = vi.fn();
const setVaultWatcherPaused = vi.fn();
const startVaultWatcher = vi.fn();
const getVaultIndexDb = vi.fn();
const clearVaultIndex = vi.fn();
const persistNotesBatch = vi.fn();

vi.mock("./vaultCommands", () => ({
  listNotes,
  readNote,
  openVault: vi.fn(),
  setVaultWatcherPaused,
  startVaultWatcher,
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb,
  clearVaultIndex,
  persistNote: vi.fn(),
  persistNotesBatch,
  removeNoteFromIndex: vi.fn(),
}));

vi.mock("./noteFromMarkdown", () => ({
  noteFromMarkdown: (path: string) => ({ path, title: path, outlinks: [] }),
}));

describe("VaultIndexer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    listNotes.mockResolvedValue(["a.md", "b.md"]);
    readNote.mockResolvedValue({ path: "a.md", content: "# A", mtime: 1 });
    setVaultWatcherPaused.mockResolvedValue(undefined);
    startVaultWatcher.mockResolvedValue(undefined);

    const db = {
      execute: vi.fn().mockResolvedValue(undefined),
    };
    getVaultIndexDb.mockResolvedValue(db);
    clearVaultIndex.mockResolvedValue(undefined);
    persistNotesBatch.mockResolvedValue(undefined);
  });

  it("starts the watcher only after indexing finishes", async () => {
    const { indexVaultFull } = await import("./VaultIndexer");

    const resultPromise = indexVaultFull();
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.noteCount).toBe(2);
    expect(clearVaultIndex).toHaveBeenCalledOnce();
    expect(startVaultWatcher).toHaveBeenCalledOnce();
    expect(persistNotesBatch.mock.invocationCallOrder[0]).toBeLessThan(
      startVaultWatcher.mock.invocationCallOrder[0]!,
    );
  });

  it("pauses the watcher while reconciling incremental changes", async () => {
    const { reconcileVaultChanges } = await import("./VaultIndexer");

    const reconcilePromise = reconcileVaultChanges({
      changed: ["a.md"],
      removed: [],
    });

    await vi.runAllTimersAsync();
    await reconcilePromise;

    expect(setVaultWatcherPaused).toHaveBeenCalledWith(true);
    expect(setVaultWatcherPaused).toHaveBeenLastCalledWith(false);
    expect(startVaultWatcher).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  writeNoteMock,
  readNoteMock,
  persistNoteMock,
  withDbLockMock,
  withDbTransactionMock,
  getVaultIndexDbMock,
} = vi.hoisted(() => ({
  writeNoteMock: vi.fn(),
  readNoteMock: vi.fn(),
  persistNoteMock: vi.fn(),
  withDbLockMock: vi.fn(async (fn: () => Promise<unknown>) => fn()),
  withDbTransactionMock: vi.fn(
    async (_db: unknown, fn: () => Promise<unknown>) => fn(),
  ),
  getVaultIndexDbMock: vi.fn(),
}));

vi.mock("./vaultCommands", () => ({
  writeNote: (...args: unknown[]) => writeNoteMock(...args),
  readNote: (...args: unknown[]) => readNoteMock(...args),
  listNotes: vi.fn().mockResolvedValue([]),
  listFolders: vi.fn().mockResolvedValue([]),
  subscribeVaultChanges: vi.fn().mockResolvedValue(() => undefined),
}));

vi.mock("./vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb: (...args: unknown[]) => getVaultIndexDbMock(...args),
  persistNote: (...args: unknown[]) => persistNoteMock(...args),
  withDbLock: (...args: [() => Promise<unknown>]) => withDbLockMock(...args),
  withDbTransaction: (...args: [unknown, () => Promise<unknown>]) =>
    withDbTransactionMock(...args),
  queryFullGraphIndex: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
}));

import { renderHook, act } from "@testing-library/react";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { createNoteInVault } from "./createNoteInVault";
import { useVaultSession } from "./useVaultSession";

describe("New Note creation and concurrency robustness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      allNotePaths: [],
      openNotes: [],
      activeNotePath: null,
      notesContent: {},
      dirtyNotes: new Set(),
    });
    writeNoteMock.mockResolvedValue(undefined);
    readNoteMock.mockImplementation(async (path: string) => ({
      path,
      content: `# ${path}\n\nContent`,
      mtime: Date.now(),
    }));
    getVaultIndexDbMock.mockResolvedValue({ execute: vi.fn() });
    persistNoteMock.mockResolvedValue(undefined);
    withDbLockMock.mockImplementation(async (fn: () => Promise<unknown>) =>
      fn(),
    );
    withDbTransactionMock.mockImplementation(
      async (_db: unknown, fn: () => Promise<unknown>) => fn(),
    );
  });

  it("1. Creates note on disk and opens tab when DB is locked, then index catches up once unlocked", async () => {
    let dbLocked = true;
    let persistAttempts = 0;

    persistNoteMock.mockImplementation(async () => {
      persistAttempts += 1;
      if (dbLocked) {
        throw new Error(
          "error returned from database: (code: 5) database is locked",
        );
      }
      return undefined;
    });

    // Invoke createNoteInVault while DB is locked
    const createdPath = await createNoteInVault(
      "LockedNote.md",
      "# Locked Note",
    );

    // File was written to disk immediately
    expect(writeNoteMock).toHaveBeenCalledWith(
      "LockedNote.md",
      "# Locked Note",
    );
    expect(createdPath).toBe("LockedNote.md");

    // State was updated in useWorkspaceStore immediately
    expect(useWorkspaceStore.getState().allNotePaths).toContain(
      "LockedNote.md",
    );
    expect(useWorkspaceStore.getState().notesContent["LockedNote.md"]).toBe(
      "# Locked Note",
    );

    // Open note tab succeeds immediately without waiting for DB
    await useWorkspaceStore.getState().openNote("LockedNote.md");
    expect(useWorkspaceStore.getState().openNotes).toContain("LockedNote.md");
    expect(useWorkspaceStore.getState().activeNotePath).toBe("LockedNote.md");

    // Release DB lock and allow retry to catch up
    dbLocked = false;

    // Wait for retry backoff
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    expect(persistAttempts).toBeGreaterThanOrEqual(2);
    expect(persistNoteMock).toHaveBeenCalled();
  });

  it("2. Creates 10 notes rapidly with unique names, no overwrites, and all tabs open", async () => {
    const { result } = renderHook(() => useVaultSession());

    const createdPaths: (string | null)[] = [];
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        const path = await result.current.createNewNote();
        createdPaths.push(path);
      }
    });

    // 10 unique paths
    expect(createdPaths).toHaveLength(10);
    const uniquePaths = new Set(createdPaths);
    expect(uniquePaths.size).toBe(10);

    // Matches Untitled, Untitled 1, Untitled 2, ...
    expect(createdPaths[0]).toBe("Untitled.md");
    expect(createdPaths[1]).toBe("Untitled 1.md");
    expect(createdPaths[9]).toBe("Untitled 9.md");

    // 10 distinct disk writes
    expect(writeNoteMock).toHaveBeenCalledTimes(10);

    // All 10 notes present in store and open in tabs
    const state = useWorkspaceStore.getState();
    expect(state.allNotePaths).toHaveLength(10);
    expect(state.openNotes).toHaveLength(10);
    expect(state.activeNotePath).toBe("Untitled 9.md");
  });

  it("3. Creates note on disk immediately while a long full vault index holds the DB lock", async () => {
    let resolveLongIndex: (() => void) | undefined;
    const longIndexPromise = new Promise<void>((resolve) => {
      resolveLongIndex = resolve;
    });

    // Hold the DB lock
    withDbLockMock.mockImplementation(async (work: () => Promise<unknown>) => {
      await longIndexPromise;
      return work();
    });

    const { result } = renderHook(() => useVaultSession());

    let createdPath: string | null = null;
    await act(async () => {
      createdPath = await result.current.createNewNote("FastNote.md");
    });

    // Note file was written to disk and tab opened immediately without waiting for long index
    expect(createdPath).toBe("FastNote.md");
    expect(writeNoteMock).toHaveBeenCalledWith(
      "FastNote.md",
      expect.any(String),
    );
    expect(useWorkspaceStore.getState().openNotes).toContain("FastNote.md");
    expect(useWorkspaceStore.getState().activeNotePath).toBe("FastNote.md");

    // Release long index
    resolveLongIndex?.();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  it("4. Tests new-note creation entry points independently", async () => {
    const { result } = renderHook(() => useVaultSession());

    // Entry point A: Quick Switcher / Link click on non-existent note
    await act(async () => {
      await result.current.handleLinkClick("QuickSwitcherTarget");
    });
    expect(useWorkspaceStore.getState().openNotes).toContain(
      "QuickSwitcherTarget.md",
    );
    expect(writeNoteMock).toHaveBeenCalledWith(
      "QuickSwitcherTarget.md",
      expect.any(String),
    );

    // Entry point B: Subfolder-scoped creation (sidebar)
    await act(async () => {
      await result.current.createNewNote("SubNote", "projects");
    });
    expect(useWorkspaceStore.getState().openNotes).toContain(
      "projects/SubNote.md",
    );
    expect(writeNoteMock).toHaveBeenCalledWith(
      "projects/SubNote.md",
      expect.any(String),
    );
  });
});

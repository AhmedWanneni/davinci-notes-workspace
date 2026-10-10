import { beforeEach, describe, expect, it, vi } from "vitest";

const renameFolderMock = vi.fn();
const readNoteMock = vi.fn();
const getStateMock = vi.fn();
const setStateMock = vi.fn();
const removeNoteFromIndexMock = vi.fn();
const removeNotesBatchMock = vi.fn();
const persistNoteMock = vi.fn();
const persistNotesBatchMock = vi.fn();
const executeDbMock = vi.fn();

vi.mock("./vaultCommands", () => ({
  renameFolder: (...args: unknown[]) => renameFolderMock(...args),
  readNote: (...args: unknown[]) => readNoteMock(...args),
}));

vi.mock("./vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({
    execute: (...args: unknown[]) => executeDbMock(...args),
  }),
  persistNote: (...args: unknown[]) => persistNoteMock(...args),
  persistNotesBatch: (...args: unknown[]) => persistNotesBatchMock(...args),
  removeNoteFromIndex: (...args: unknown[]) => removeNoteFromIndexMock(...args),
  removeNotesBatch: (...args: unknown[]) => removeNotesBatchMock(...args),
  withDbLock: async (work: () => Promise<unknown>) => work(),
  withDbTransaction: async (_db: unknown, work: () => Promise<unknown>) =>
    work(),
}));

vi.mock("./h1DrivenRename", () => ({
  clearH1RenameTimer: vi.fn(),
}));

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => getStateMock(),
    setState: (updater: unknown) => setStateMock(updater),
  },
}));

vi.mock("../state/saveTimers", () => ({
  migrateSaveTimer: vi.fn(),
}));

import { renameFolderInVault } from "./renameFolderInVault";

describe("renameFolderInVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renameFolderMock.mockResolvedValue(undefined);
    getStateMock.mockReturnValue({
      allFolderPaths: ["projects", "archive"],
      allNotePaths: [
        "projects/note1.md",
        "projects/sub/note2.md",
        "archive/old.md",
      ],
      notesContent: {
        "projects/note1.md": "# Note 1\n\nContent",
        "projects/sub/note2.md": "# Note 2\n\nSub",
      },
      openNotes: ["projects/note1.md"],
      activeNotePath: "projects/note1.md",
      dirtyNotes: new Set(["projects/note1.md"]),
      tagIndex: null,
      graph: null,
      vaultUpdateCounter: 0,
    });
    setStateMock.mockImplementation((updater) => {
      if (typeof updater === "function") {
        updater(getStateMock());
      }
    });
  });

  it("skips when old and new names are identical", async () => {
    const result = await renameFolderInVault("projects", "projects");
    expect(result).toEqual({ ok: true, newPath: "projects" });
    expect(renameFolderMock).not.toHaveBeenCalled();
  });

  it("returns invalid for illegal characters or empty names", async () => {
    const result = await renameFolderInVault("projects", "  / \\ : * ?  ");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(renameFolderMock).not.toHaveBeenCalled();

    const slashResult = await renameFolderInVault("projects", "next/name");
    expect(slashResult).toEqual({ ok: false, reason: "invalid" });
    expect(renameFolderMock).not.toHaveBeenCalled();
  });

  it("returns collision when destination folder exists", async () => {
    const result = await renameFolderInVault("projects", "archive");
    expect(result).toEqual({ ok: false, reason: "collision" });
    expect(renameFolderMock).not.toHaveBeenCalled();
  });

  it("renames folder on disk and updates descendant note paths and SQLite index", async () => {
    const result = await renameFolderInVault("projects", "work");
    expect(result).toEqual({ ok: true, newPath: "work" });
    expect(renameFolderMock).toHaveBeenCalledWith("projects", "work");
    expect(setStateMock).toHaveBeenCalledWith(expect.any(Function));
    const immediateUpdate = setStateMock.mock.calls[0]?.[0] as (
      state: ReturnType<typeof getStateMock>,
    ) => Record<string, unknown>;
    expect(immediateUpdate(getStateMock())).toEqual(
      expect.objectContaining({
        allFolderPaths: ["archive", "work"],
        allNotePaths: ["archive/old.md", "work/note1.md", "work/sub/note2.md"],
        openNotes: ["work/note1.md"],
        activeNotePath: "work/note1.md",
      }),
    );

    expect(removeNotesBatchMock).toHaveBeenCalledWith(expect.anything(), [
      "projects/note1.md",
      "projects/sub/note2.md",
    ]);

    expect(persistNotesBatchMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ path: "work/note1.md" }),
        expect.objectContaining({ path: "work/sub/note2.md" }),
      ]),
    );
  });
});

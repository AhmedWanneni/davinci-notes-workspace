import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteFolderMock = vi.fn();
const getStateMock = vi.fn();
const setStateMock = vi.fn();
const executeDbMock = vi.fn();
const removeNoteFromIndexMock = vi.fn();

vi.mock("./vaultCommands", () => ({
  deleteFolder: (...args: unknown[]) => deleteFolderMock(...args),
}));

vi.mock("./vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({
    execute: (...args: unknown[]) => executeDbMock(...args),
  }),
  removeNoteFromIndex: (...args: unknown[]) => removeNoteFromIndexMock(...args),
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
  clearSaveTimer: vi.fn(),
}));

import { deleteFolderInVault } from "./deleteFolderInVault";

describe("deleteFolderInVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteFolderMock.mockResolvedValue(undefined);
    executeDbMock.mockResolvedValue(undefined);
    getStateMock.mockReturnValue({
      allFolderPaths: ["projects", "projects/sub", "archive"],
      allNotePaths: [
        "projects/note1.md",
        "projects/sub/note2.md",
        "archive/old.md",
      ],
      notesContent: {
        "projects/note1.md": "# Note 1\n\nContent",
        "projects/sub/note2.md": "# Note 2\n\nSub",
        "archive/old.md": "# Old\n\nArchive",
      },
      openNotes: ["projects/note1.md", "archive/old.md"],
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

  it("rejects vault root deletion", async () => {
    const resRoot = await deleteFolderInVault("");
    expect(resRoot).toEqual({ ok: false, reason: "cannot-delete-root" });

    const resSlash = await deleteFolderInVault("/");
    expect(resSlash).toEqual({ ok: false, reason: "cannot-delete-root" });

    const resDot = await deleteFolderInVault(".");
    expect(resDot).toEqual({ ok: false, reason: "cannot-delete-root" });

    expect(deleteFolderMock).not.toHaveBeenCalled();
  });

  it("rejects hidden and system paths", async () => {
    const resHidden = await deleteFolderInVault(".git");
    expect(resHidden).toEqual({ ok: false, reason: "hidden-path" });
    expect(deleteFolderMock).not.toHaveBeenCalled();
  });

  it("rejects missing folders", async () => {
    const resMissing = await deleteFolderInVault("nonexistent");
    expect(resMissing).toEqual({ ok: false, reason: "missing" });
    expect(deleteFolderMock).not.toHaveBeenCalled();
  });

  it("deletes folder on disk and removes descendant notes from SQLite and workspace state", async () => {
    const result = await deleteFolderInVault("projects");
    expect(result).toEqual({ ok: true });
    expect(deleteFolderMock).toHaveBeenCalledWith("projects");

    expect(removeNoteFromIndexMock).toHaveBeenCalledWith(
      expect.anything(),
      "projects/note1.md",
    );
    expect(removeNoteFromIndexMock).toHaveBeenCalledWith(
      expect.anything(),
      "projects/sub/note2.md",
    );
    expect(executeDbMock).toHaveBeenCalledWith(
      "DELETE FROM links WHERE target_path = $1 OR source_path = $1",
      ["projects/note1.md"],
    );
    expect(executeDbMock).toHaveBeenCalledWith(
      "DELETE FROM links WHERE target_path = $1 OR source_path = $1",
      ["projects/sub/note2.md"],
    );

    expect(setStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allFolderPaths: ["archive"],
        allNotePaths: ["archive/old.md"],
        openNotes: ["archive/old.md"],
        activeNotePath: "archive/old.md",
      }),
    );
  });
});

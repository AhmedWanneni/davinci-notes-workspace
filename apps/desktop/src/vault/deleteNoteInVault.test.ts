import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deleteNoteMock,
  getStateMock,
  setStateMock,
  executeMock,
  removeNoteFromIndexMock,
  removeNotesBatchMock,
} = vi.hoisted(() => ({
  deleteNoteMock: vi.fn(),
  getStateMock: vi.fn(),
  setStateMock: vi.fn(),
  executeMock: vi.fn(),
  removeNoteFromIndexMock: vi.fn(),
  removeNotesBatchMock: vi.fn(),
}));

vi.mock("./vaultCommands", () => ({
  deleteNote: (...args: unknown[]) => deleteNoteMock(...args),
}));

vi.mock("./vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({ execute: executeMock }),
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
  saveTimers: {},
}));

import { deleteNoteInVault } from "./deleteNoteInVault";

describe("deleteNoteInVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteNoteMock.mockResolvedValue(undefined);
    executeMock.mockResolvedValue(undefined);
    getStateMock.mockReturnValue({
      allNotePaths: ["alpha.md", "beta.md"],
      notesContent: { "beta.md": "# Beta\n\n" },
      openNotes: ["alpha.md", "beta.md"],
      activeNotePath: "beta.md",
      dirtyNotes: new Set(["beta.md"]),
      graph: null,
      vaultUpdateCounter: 0,
    });
    setStateMock.mockImplementation((updater) => {
      if (typeof updater === "function") {
        return updater(getStateMock());
      }
      return updater;
    });
  });

  it("rejects missing and non-markdown paths", async () => {
    await expect(deleteNoteInVault("image.png")).resolves.toEqual({
      ok: false,
      reason: "not-markdown",
    });
    await expect(deleteNoteInVault("missing.md")).resolves.toEqual({
      ok: false,
      reason: "missing",
    });
    expect(deleteNoteMock).not.toHaveBeenCalled();
  });

  it("deletes from disk, index, and open workspace state", async () => {
    const result = await deleteNoteInVault("beta.md");
    expect(result).toEqual({ ok: true, path: "beta.md" });
    expect(deleteNoteMock).toHaveBeenCalledWith("beta.md");
    expect(removeNotesBatchMock).toHaveBeenCalledWith(
      { execute: executeMock },
      ["beta.md"],
    );

    const nextState = setStateMock.mock.results[0]?.value;
    expect(nextState.openNotes).toEqual(["alpha.md"]);
    expect(nextState.activeNotePath).toBe("alpha.md");
    expect(nextState.allNotePaths).toEqual(["alpha.md"]);
    expect(nextState.notesContent["beta.md"]).toBeUndefined();
    expect(nextState.dirtyNotes.has("beta.md")).toBe(false);
  });
});

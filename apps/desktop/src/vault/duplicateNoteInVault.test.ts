import { beforeEach, describe, expect, it, vi } from "vitest";

const readNoteMock = vi.fn();
const writeNoteMock = vi.fn();
const persistNoteMock = vi.fn();
const getStateMock = vi.fn();
const setStateMock = vi.fn();

vi.mock("./vaultCommands", () => ({
  readNote: (...args: unknown[]) => readNoteMock(...args),
  writeNote: (...args: unknown[]) => writeNoteMock(...args),
}));

vi.mock("./vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  persistNote: (...args: unknown[]) => persistNoteMock(...args),
  withDbLock: async (work: () => Promise<unknown>) => work(),
  withDbTransaction: async (_db: unknown, work: () => Promise<unknown>) =>
    work(),
}));

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => getStateMock(),
    setState: (updater: unknown) => setStateMock(updater),
  },
}));

import { duplicateNoteInVault } from "./duplicateNoteInVault";

describe("duplicateNoteInVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeNoteMock.mockResolvedValue(undefined);
    persistNoteMock.mockResolvedValue(undefined);
    readNoteMock.mockResolvedValue({
      path: "beta.md",
      content: "# Beta\n\nSee [[Alpha]].",
      mtime: 1,
    });
    getStateMock.mockReturnValue({
      allNotePaths: ["alpha.md", "beta.md", "beta copy.md"],
      notesContent: {},
      openNotes: ["alpha.md"],
      activeNotePath: "alpha.md",
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
    await expect(duplicateNoteInVault("image.png")).resolves.toEqual({
      ok: false,
      reason: "not-markdown",
    });

    getStateMock.mockReturnValueOnce({
      allNotePaths: ["alpha.md"],
      notesContent: {},
    });
    await expect(duplicateNoteInVault("missing.md")).resolves.toEqual({
      ok: false,
      reason: "missing",
    });
    expect(writeNoteMock).not.toHaveBeenCalled();
  });

  it("writes a unique copy, syncs H1, indexes it, and opens it", async () => {
    const result = await duplicateNoteInVault("beta.md");
    expect(result).toEqual({ ok: true, newPath: "beta copy 1.md" });
    expect(writeNoteMock).toHaveBeenCalledWith(
      "beta copy 1.md",
      "# beta copy 1\n\nSee [[Alpha]].",
    );
    expect(persistNoteMock).toHaveBeenCalledOnce();

    const nextState = setStateMock.mock.results[0]?.value;
    expect(nextState.allNotePaths).toContain("beta copy 1.md");
    expect(nextState.openNotes).toEqual(["alpha.md", "beta copy 1.md"]);
    expect(nextState.activeNotePath).toBe("beta copy 1.md");
  });
});

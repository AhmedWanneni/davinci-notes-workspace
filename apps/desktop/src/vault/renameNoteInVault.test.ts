import { beforeEach, describe, expect, it, vi } from "vitest";

const renameNoteMock = vi.fn();
const writeNoteMock = vi.fn();
const readNoteMock = vi.fn();
const getStateMock = vi.fn();
const setStateMock = vi.fn();

vi.mock("./vaultCommands", () => ({
  renameNote: (...args: unknown[]) => renameNoteMock(...args),
  writeNote: (...args: unknown[]) => writeNoteMock(...args),
  readNote: (...args: unknown[]) => readNoteMock(...args),
}));

vi.mock("./vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({
    execute: vi.fn(),
  }),
  persistNote: vi.fn(),
  removeNoteFromIndex: vi.fn(),
  withDbLock: async (work: () => Promise<unknown>) => work(),
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

import { renameNoteInVault } from "./renameNoteInVault";

describe("renameNoteInVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renameNoteMock.mockResolvedValue(undefined);
    writeNoteMock.mockResolvedValue(undefined);
    getStateMock.mockReturnValue({
      allNotePaths: ["alpha.md", "beta.md"],
      notesContent: {
        "alpha.md": "# Alpha\n\nSee [[Beta]].",
        "beta.md": "# Beta\n\n",
      },
      openNotes: ["alpha.md"],
      activeNotePath: "alpha.md",
      dirtyNotes: new Set(),
      graph: null,
    });
    setStateMock.mockImplementation((updater) => {
      if (typeof updater === "function") {
        updater(getStateMock());
      }
    });
  });

  it("skips when old and new paths are identical", async () => {
    const result = await renameNoteInVault("alpha.md", "alpha.md");
    expect(result).toEqual({ ok: true, newPath: "alpha.md" });
    expect(renameNoteMock).not.toHaveBeenCalled();
  });

  it("returns collision when destination exists", async () => {
    const result = await renameNoteInVault("alpha.md", "beta.md");
    expect(result).toEqual({ ok: false, reason: "collision" });
    expect(renameNoteMock).not.toHaveBeenCalled();
  });

  it("returns collision when the filesystem rejects a stale destination", async () => {
    renameNoteMock.mockRejectedValue(new Error("Destination already exists: Gamma.md"));

    const result = await renameNoteInVault("beta.md", "Gamma.md");

    expect(result).toEqual({ ok: false, reason: "collision" });
  });

  it("renames on disk and propagates wikilinks", async () => {
    const result = await renameNoteInVault("beta.md", "Gamma.md");
    expect(result).toEqual({ ok: true, newPath: "Gamma.md" });
    expect(renameNoteMock).toHaveBeenCalledWith("beta.md", "Gamma.md");
    expect(writeNoteMock).toHaveBeenCalledWith(
      "alpha.md",
      "# Alpha\n\nSee [[Gamma]].",
    );
  });

  it("syncs H1 when renaming from the file tree", async () => {
    await renameNoteInVault("beta.md", "Renamed.md", {
      syncH1FromFilename: true,
    });
    expect(writeNoteMock).toHaveBeenCalledWith("Renamed.md", "# Renamed\n\n");
  });
});

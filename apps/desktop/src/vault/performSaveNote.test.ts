import { beforeEach, describe, expect, it, vi } from "vitest";
import { performSaveNote } from "./performSaveNote";
import { diskStateTracker } from "./diskStateTracker";
import {
  resolveConflictKeepMine,
  resolveConflictUseDisk,
  resolveConflictSaveCopy,
} from "./resolveConflictActions";
import type { WorkspaceSaveContext } from "./noteConflictTypes";

const statNoteMock = vi.fn();
const readNoteMock = vi.fn();
const writeNoteMock = vi.fn();
const persistNoteMock = vi.fn();

vi.mock("./vaultCommands", () => ({
  statNote: (path: string) => statNoteMock(path),
  readNote: (path: string) => readNoteMock(path),
  writeNote: (path: string, content: string) => writeNoteMock(path, content),
}));

vi.mock("./sqliteIndex", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  persistNote: (...args: unknown[]) => persistNoteMock(...args),
  withDbLock: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("./vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
}));

describe("performSaveNote guard & conflict resolution", () => {
  let state: WorkspaceSaveContext;
  const set = (
    updater: (curr: WorkspaceSaveContext) => Partial<WorkspaceSaveContext>,
  ) => {
    state = { ...state, ...updater(state) };
  };
  const get = () => state;

  beforeEach(() => {
    vi.clearAllMocks();
    diskStateTracker.clear();

    state = {
      allNotePaths: ["notes/test.md"],
      graph: null,
      tagIndex: null,
      notesContent: { "notes/test.md": "# Title\n\nUser edits" },
      dirtyNotes: new Set(["notes/test.md"]),
      conflictNotes: new Map(),
      vaultUpdateCounter: 0,
    };
  });

  it("saves directly without reading disk when mtime and size match last known state", async () => {
    diskStateTracker.set("notes/test.md", {
      mtime: 1000,
      size: 20,
      content: "# Title\n\nInitial",
    });

    statNoteMock.mockResolvedValue({ exists: true, mtime: 1000, size: 20 });
    writeNoteMock.mockResolvedValue({ exists: true, mtime: 1100, size: 25 });

    await performSaveNote("notes/test.md", get, set);

    expect(readNoteMock).not.toHaveBeenCalled();
    expect(writeNoteMock).toHaveBeenCalledWith(
      "notes/test.md",
      "# Title\n\nUser edits",
    );
    expect(state.dirtyNotes.has("notes/test.md")).toBe(false);
    expect(state.conflictNotes.has("notes/test.md")).toBe(false);
  });

  it("performs lossless append merge when disk changed by pure append", async () => {
    diskStateTracker.set("notes/test.md", {
      mtime: 1000,
      size: 20,
      content: "# Title\n\nInitial",
    });

    statNoteMock.mockResolvedValue({ exists: true, mtime: 1200, size: 45 });
    readNoteMock.mockResolvedValue({
      path: "notes/test.md",
      content: "# Title\n\nInitial\n\n- [ ] Quick capture item",
      mtime: 1200,
      size: 45,
    });
    writeNoteMock.mockResolvedValue({ exists: true, mtime: 1300, size: 70 });

    await performSaveNote("notes/test.md", get, set);

    const expectedMerged = "# Title\n\nUser edits\n\n- [ ] Quick capture item";
    expect(writeNoteMock).toHaveBeenCalledWith("notes/test.md", expectedMerged);
    expect(state.notesContent["notes/test.md"]).toBe(expectedMerged);
    expect(state.dirtyNotes.has("notes/test.md")).toBe(false);
    expect(state.conflictNotes.has("notes/test.md")).toBe(false);
  });

  it("pauses autosave and flags conflict when mid-file conflict occurs", async () => {
    diskStateTracker.set("notes/test.md", {
      mtime: 1000,
      size: 20,
      content: "# Title\n\nInitial",
    });

    statNoteMock.mockResolvedValue({ exists: true, mtime: 1200, size: 30 });
    readNoteMock.mockResolvedValue({
      path: "notes/test.md",
      content: "# Conflict Title\n\nExternal",
      mtime: 1200,
      size: 30,
    });

    await performSaveNote("notes/test.md", get, set);

    expect(writeNoteMock).not.toHaveBeenCalled();
    expect(state.conflictNotes.has("notes/test.md")).toBe(true);
    expect(state.conflictNotes.get("notes/test.md")).toBe(
      "# Conflict Title\n\nExternal",
    );
  });

  it("resolves conflict with keep_mine by overwriting disk", async () => {
    state.conflictNotes.set("notes/test.md", "# Conflict on disk");
    writeNoteMock.mockResolvedValue({ exists: true, mtime: 1500, size: 25 });

    await resolveConflictKeepMine("notes/test.md", state, set);

    expect(writeNoteMock).toHaveBeenCalledWith(
      "notes/test.md",
      "# Title\n\nUser edits",
    );
    expect(state.conflictNotes.has("notes/test.md")).toBe(false);
    expect(state.dirtyNotes.has("notes/test.md")).toBe(false);
  });

  it("resolves conflict with use_disk by adopting disk content", async () => {
    state.conflictNotes.set("notes/test.md", "# Conflict on disk");
    statNoteMock.mockResolvedValue({ exists: true, mtime: 1500, size: 19 });

    await resolveConflictUseDisk("notes/test.md", set, "# Conflict on disk");

    expect(state.notesContent["notes/test.md"]).toBe("# Conflict on disk");
    expect(state.conflictNotes.has("notes/test.md")).toBe(false);
    expect(state.dirtyNotes.has("notes/test.md")).toBe(false);
  });

  it("resolves conflict with save_copy by creating copy file", async () => {
    state.conflictNotes.set("notes/test.md", "# Conflict on disk");
    writeNoteMock.mockResolvedValue({ exists: true, mtime: 1500, size: 25 });
    statNoteMock.mockResolvedValue({ exists: true, mtime: 1500, size: 19 });

    const copyPath = await resolveConflictSaveCopy(
      "notes/test.md",
      state,
      set,
      "# Conflict on disk",
    );

    expect(copyPath).toMatch(/^notes\/test \(conflict .+\)\.md$/);
    expect(writeNoteMock).toHaveBeenCalledWith(
      copyPath,
      "# Title\n\nUser edits",
    );
    expect(state.notesContent["notes/test.md"]).toBe("# Conflict on disk");
    expect(state.conflictNotes.has("notes/test.md")).toBe(false);
    expect(state.dirtyNotes.has("notes/test.md")).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceStore } from "./useWorkspaceStore";

// Mock the vault I/O layer
const readNoteMock = vi.fn();
const writeNoteMock = vi.fn();
const listNotesMock = vi.fn();
const persistNoteMock = vi.fn();
const getVaultIndexDbMock = vi.fn();

vi.mock("../vault", () => ({
  readNote: (path: string) => readNoteMock(path),
  writeNote: (path: string, content: string) => writeNoteMock(path, content),
  listNotes: () => listNotesMock(),
  noteFromMarkdown: (path: string, content: string, mtime: number) => ({
    path,
    title: path.replace(".md", ""),
    content,
    mtime,
    outlinks: [],
  }),
  getVaultIndexDb: () => getVaultIndexDbMock(),
  persistNote: (db: unknown, note: unknown) => persistNoteMock(db, note),
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => {
    return work();
  },
  renameNoteInVault: vi.fn(),
}));

vi.mock("../vault/h1DrivenRename", () => ({
  scheduleH1DrivenRename: vi.fn(),
  flushH1DrivenRename: vi.fn(async (path: string) => path),
}));

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset store state
    useWorkspaceStore.setState({
      activeNotePath: null,
      openNotes: [],
      notesContent: {},
      dirtyNotes: new Set(),
      allNotePaths: [],
      allFolderPaths: [],
      graph: null,
    });

    readNoteMock.mockResolvedValue({ path: "a.md", content: "# A", mtime: 1 });
    writeNoteMock.mockResolvedValue(undefined);
    listNotesMock.mockResolvedValue(["a.md", "b.md"]);
    persistNoteMock.mockResolvedValue(undefined);
    getVaultIndexDbMock.mockResolvedValue({});
  });

  it("loads vault paths and optional graph on initialize", async () => {
    const store = useWorkspaceStore.getState();
    await store.initializeVault(["a.md", "b.md"], []);

    const state = useWorkspaceStore.getState();
    expect(state.allNotePaths).toEqual(["a.md", "b.md"]);
    expect(state.openNotes).toEqual([]);
    expect(state.dirtyNotes.size).toBe(0);
  });

  it("opens note, reads from disk if needed, and sets active tab", async () => {
    const store = useWorkspaceStore.getState();
    await store.openNote("a.md");

    const state = useWorkspaceStore.getState();
    expect(readNoteMock).toHaveBeenCalledWith("a.md");
    expect(state.activeNotePath).toBe("a.md");
    expect(state.openNotes).toEqual(["a.md"]);
    expect(state.notesContent["a.md"]).toBe("# A");
  });

  it("debounces writes to disk when note content changes", async () => {
    const store = useWorkspaceStore.getState();
    await store.openNote("a.md");

    // Modify note content
    store.updateNoteContent("a.md", "# A - modified");

    let state = useWorkspaceStore.getState();
    expect(state.notesContent["a.md"]).toBe("# A - modified");
    expect(state.dirtyNotes.has("a.md")).toBe(true);
    expect(writeNoteMock).not.toHaveBeenCalled();

    // Advance timer slightly
    await vi.advanceTimersByTimeAsync(400);
    expect(writeNoteMock).not.toHaveBeenCalled();

    // Advance timer past debounce (750ms)
    await vi.advanceTimersByTimeAsync(400);
    expect(writeNoteMock).toHaveBeenCalledWith("a.md", "# A - modified");

    state = useWorkspaceStore.getState();
    expect(state.dirtyNotes.has("a.md")).toBe(false);
  });

  it("flushes saving immediately when switching notes", async () => {
    const store = useWorkspaceStore.getState();
    await store.openNote("a.md");
    await store.openNote("b.md");

    // Edit b.md
    store.updateNoteContent("b.md", "# B - edited");
    expect(writeNoteMock).not.toHaveBeenCalled();

    // Switch to a.md
    await store.setActiveNote("a.md");

    // b.md should have been saved immediately without waiting for timer
    expect(writeNoteMock).toHaveBeenCalledWith("b.md", "# B - edited");

    const state = useWorkspaceStore.getState();
    expect(state.activeNotePath).toBe("a.md");
    expect(state.dirtyNotes.has("b.md")).toBe(false);
  });

  it("saves and closes note tab, shifting active focus", async () => {
    const store = useWorkspaceStore.getState();
    await store.openNote("a.md");
    await store.openNote("b.md");

    // Make b.md dirty
    store.updateNoteContent("b.md", "# B - edited");

    // Close b.md tab
    await store.closeNote("b.md");

    // b.md is saved and closed
    expect(writeNoteMock).toHaveBeenCalledWith("b.md", "# B - edited");

    const state = useWorkspaceStore.getState();
    expect(state.openNotes).toEqual(["a.md"]);
    expect(state.activeNotePath).toBe("a.md");
  });
});

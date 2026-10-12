import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceStore } from "./useWorkspaceStore";

import { diskStateTracker } from "../vault/diskStateTracker";

// Mock the vault I/O layer
const readNoteMock = vi.fn();
const statNoteMock = vi.fn();
const writeNoteMock = vi.fn();
const listNotesMock = vi.fn();
const persistNoteMock = vi.fn();
const getVaultIndexDbMock = vi.fn();
const getSettingMock = vi.fn();
const setSettingMock = vi.fn();
const flushH1DrivenRenameMock = vi.fn(async (path: string) => path);

vi.mock("../vault", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    readNote: (path: string) => readNoteMock(path),
    statNote: (path: string) => statNoteMock(path),
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
    getSetting: (db: unknown, key: string) => getSettingMock(db, key),
    setSetting: (db: unknown, key: string, value: string) =>
      setSettingMock(db, key, value),
    persistNote: (db: unknown, note: unknown) => persistNoteMock(db, note),
    withDbLock: async (work: () => Promise<unknown>) => work(),
    withVaultWatchSuppressed: async (work: () => Promise<unknown>) => {
      return work();
    },
    renameNoteInVault: vi.fn(),
  };
});

vi.mock("../vault/vaultCommands", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    readNote: (path: string) => readNoteMock(path),
    statNote: (path: string) => statNoteMock(path),
    writeNote: (path: string, content: string) => writeNoteMock(path, content),
    listNotes: () => listNotesMock(),
    setVaultWatcherPaused: vi.fn(),
  };
});

vi.mock("../vault/vaultWatchSession", () => ({
  withVaultWatchSuppressed: async (work: () => Promise<unknown>) => work(),
  activateVaultWatcher: vi.fn(),
}));

vi.mock("../vault/sqliteIndex", () => ({
  getVaultIndexDb: () => getVaultIndexDbMock(),
  persistNote: (db: unknown, note: unknown) => persistNoteMock(db, note),
  withDbLock: async (work: () => Promise<unknown>) => work(),
}));

vi.mock("../vault/settingsCommands", () => ({
  getSetting: (db: unknown, key: string) => getSettingMock(db, key),
  setSetting: (db: unknown, key: string, value: string) =>
    setSettingMock(db, key, value),
}));

vi.mock("../vault/h1DrivenRename", () => ({
  scheduleH1DrivenRename: vi.fn(),
  flushH1DrivenRename: (path: string) => flushH1DrivenRenameMock(path),
}));

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    diskStateTracker.clear();
    vi.useFakeTimers();

    // Reset store state
    useWorkspaceStore.setState({
      activeNotePath: null,
      openNotes: [],
      notesContent: {},
      dirtyNotes: new Set(),
      conflictNotes: new Map(),
      allNotePaths: [],
      allFolderPaths: [],
      graph: null,
      editorFont: "system",
      editorFontSize: 16,
      strictLineBreaks: false,
      useVimMode: false,
    });

    statNoteMock.mockResolvedValue({ exists: true, mtime: 1, size: 4 });
    readNoteMock.mockResolvedValue({
      path: "a.md",
      content: "# A",
      mtime: 1,
      size: 4,
    });
    writeNoteMock.mockResolvedValue({ exists: true, mtime: 1, size: 4 });
    listNotesMock.mockResolvedValue(["a.md", "b.md"]);
    persistNoteMock.mockResolvedValue(undefined);
    getVaultIndexDbMock.mockResolvedValue({});
    getSettingMock.mockResolvedValue(null);
    setSettingMock.mockResolvedValue(undefined);
    flushH1DrivenRenameMock.mockClear();
    flushH1DrivenRenameMock.mockImplementation(async (path: string) => path);
  });

  it("defaults Vim keybindings to OFF (opt-in)", () => {
    expect(useWorkspaceStore.getState().useVimMode).toBe(false);
  });

  it("clamps and persists the editor font size through the database lock", async () => {
    useWorkspaceStore.getState().previewEditorFontSize(99);
    expect(useWorkspaceStore.getState().editorFontSize).toBe(28);

    await useWorkspaceStore.getState().setEditorFontSize(10);

    expect(useWorkspaceStore.getState().editorFontSize).toBe(12);
    expect(setSettingMock).toHaveBeenCalledWith({}, "editorFontSize", "12");
  });

  it("persists and restores Vim Keybindings setting through SQLite settings", async () => {
    getSettingMock.mockImplementation(async (_db: unknown, key: string) => {
      if (key === "useVimMode") return "true";
      if (key === "strictLineBreaks") return "true";
      return "montserrat";
    });

    await useWorkspaceStore.getState().loadSettings();
    expect(useWorkspaceStore.getState().useVimMode).toBe(true);

    await useWorkspaceStore.getState().setUseVimMode(false);
    expect(useWorkspaceStore.getState().useVimMode).toBe(false);
    expect(setSettingMock).toHaveBeenCalledWith({}, "useVimMode", "false");

    await useWorkspaceStore.getState().setUseVimMode(true);
    expect(useWorkspaceStore.getState().useVimMode).toBe(true);
    expect(setSettingMock).toHaveBeenCalledWith({}, "useVimMode", "true");
  });

  it("loads vault paths and optional graph on initialize", async () => {
    const store = useWorkspaceStore.getState();
    await store.initializeVault(["a.md", "b.md"], []);

    const state = useWorkspaceStore.getState();
    expect(state.allNotePaths).toEqual(["a.md", "b.md"]);
    expect(state.openNotes).toEqual([]);
    expect(state.dirtyNotes.size).toBe(0);
  });

  it("persists and restores Strict Line Breaks through SQLite settings", async () => {
    getSettingMock.mockImplementation(async (_db: unknown, key: string) => {
      if (key === "strictLineBreaks") return "true";
      return "montserrat";
    });

    await useWorkspaceStore.getState().loadSettings();
    expect(useWorkspaceStore.getState().strictLineBreaks).toBe(true);
    expect(useWorkspaceStore.getState().editorFont).toBe("montserrat");

    await useWorkspaceStore.getState().setStrictLineBreaks(false);
    expect(useWorkspaceStore.getState().strictLineBreaks).toBe(false);
    expect(setSettingMock).toHaveBeenCalledWith(
      {},
      "strictLineBreaks",
      "false",
    );
  });

  it("uses editor-package defaults for invalid persisted settings", async () => {
    getSettingMock.mockImplementation(async (_db: unknown, key: string) => {
      if (key === "editorFont") return "unsupported-font";
      return null;
    });

    await useWorkspaceStore.getState().loadSettings();

    expect(useWorkspaceStore.getState().editorFont).toBe("system");
    expect(useWorkspaceStore.getState().strictLineBreaks).toBe(false);
  });

  it("loads editor settings with sequential SQLite reads", async () => {
    let readsInFlight = 0;
    let maxReadsInFlight = 0;
    getSettingMock.mockImplementation(async (_db: unknown, key: string) => {
      readsInFlight += 1;
      maxReadsInFlight = Math.max(maxReadsInFlight, readsInFlight);
      await Promise.resolve();
      readsInFlight -= 1;
      return key === "editorFont" ? "montserrat" : "true";
    });

    await useWorkspaceStore.getState().loadSettings();

    expect(maxReadsInFlight).toBe(1);
    expect(useWorkspaceStore.getState().editorFont).toBe("montserrat");
    expect(useWorkspaceStore.getState().strictLineBreaks).toBe(true);
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
    expect(flushH1DrivenRenameMock).toHaveBeenCalledWith("a.md");

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

  it("closeAllNotes flushes all pending dirty saves across every open tab before closing all tabs", async () => {
    const store = useWorkspaceStore.getState();
    await store.openNote("a.md");
    await store.openNote("b.md");

    // Make both a.md and b.md dirty with pending debounced saves
    store.updateNoteContent("a.md", "# A - dirty edit");
    store.updateNoteContent("b.md", "# B - dirty edit");

    expect(writeNoteMock).not.toHaveBeenCalled();

    // Invoke closeAllNotes (:qa / :wqa)
    await store.closeAllNotes();

    // Verify both dirty notes were flushed and written to disk
    expect(writeNoteMock).toHaveBeenCalledWith("a.md", "# A - dirty edit");
    expect(writeNoteMock).toHaveBeenCalledWith("b.md", "# B - dirty edit");

    const state = useWorkspaceStore.getState();
    expect(state.openNotes).toEqual([]);
    expect(state.activeNotePath).toBeNull();
    expect(state.dirtyNotes.size).toBe(0);
  });

  it("automatically closes global graph when opening or activating a note", async () => {
    const store = useWorkspaceStore.getState();
    store.setIsGlobalGraphOpen(true);
    expect(useWorkspaceStore.getState().isGlobalGraphOpen).toBe(true);

    await store.openNote("a.md");
    expect(useWorkspaceStore.getState().isGlobalGraphOpen).toBe(false);

    store.setIsGlobalGraphOpen(true);
    expect(useWorkspaceStore.getState().isGlobalGraphOpen).toBe(true);

    await store.setActiveNote("b.md");
    expect(useWorkspaceStore.getState().isGlobalGraphOpen).toBe(false);
  });
});

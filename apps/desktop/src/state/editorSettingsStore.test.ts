import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorSettings } from "./createEditorSettings";

const getSettingMock = vi.fn();
const setSettingMock = vi.fn();
const getVaultIndexDbMock = vi.fn();

vi.mock("../vault", () => ({
  getVaultIndexDb: () => getVaultIndexDbMock(),
  getSetting: (db: unknown, key: string) => getSettingMock(db, key),
  setSetting: (db: unknown, key: string, value: string) =>
    setSettingMock(db, key, value),
  withDbLock: async (work: () => Promise<unknown>) => work(),
}));

describe("createEditorSettings", () => {
  let state: ReturnType<typeof createEditorSettings>;
  const setMock = vi.fn(
    (update: Partial<ReturnType<typeof createEditorSettings>>) => {
      Object.assign(state, update);
    },
  );

  beforeEach(() => {
    vi.clearAllMocks();
    getVaultIndexDbMock.mockResolvedValue({});
    state = createEditorSettings(setMock);
  });

  it("initializes with default settings", () => {
    expect(state.editorFont).toBe("system");
    expect(state.editorCustomFont).toBe("");
    expect(state.editorFontSize).toBe(16);
  });

  it("loads and sanitizes persisted settings from database", async () => {
    getSettingMock.mockImplementation((_db, key) => {
      if (key === "editorFont") return "custom";
      if (key === "editorCustomFont") return "Fira Code";
      if (key === "editorFontSize") return "18";
      return null;
    });

    await state.loadSettings();

    expect(state.editorFont).toBe("custom");
    expect(state.editorCustomFont).toBe("Fira Code");
    expect(state.editorFontSize).toBe(18);
  });

  it("updates and persists font selection", async () => {
    await state.setEditorFont("montserrat");
    expect(state.editorFont).toBe("montserrat");
    expect(setSettingMock).toHaveBeenCalledWith(
      expect.anything(),
      "editorFont",
      "montserrat",
    );
  });

  it("updates and persists custom font name", async () => {
    await state.setEditorCustomFont("Menlo");
    expect(state.editorCustomFont).toBe("Menlo");
    expect(setSettingMock).toHaveBeenCalledWith(
      expect.anything(),
      "editorCustomFont",
      "Menlo",
    );
  });

  it("clamps font size between 12 and 28 upon saving", async () => {
    await state.setEditorFontSize(35);
    expect(state.editorFontSize).toBe(28);
    expect(setSettingMock).toHaveBeenCalledWith(
      expect.anything(),
      "editorFontSize",
      "28",
    );

    await state.setEditorFontSize(8);
    expect(state.editorFontSize).toBe(12);
    expect(setSettingMock).toHaveBeenCalledWith(
      expect.anything(),
      "editorFontSize",
      "12",
    );
  });

  it("previews font size in memory without writing to database", () => {
    state.previewEditorFontSize(20);
    expect(state.editorFontSize).toBe(20);
    expect(setSettingMock).not.toHaveBeenCalled();
  });
});

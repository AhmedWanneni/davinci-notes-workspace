import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
const pickVaultFolder = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke,
}));

vi.mock("./pickVaultFolder", () => ({
  pickVaultFolder,
}));

describe("openVaultFromPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("opens the vault when a folder is selected", async () => {
    pickVaultFolder.mockResolvedValue("/Users/me/notes");
    invoke.mockResolvedValue("/Users/me/notes");

    const { openVaultFromPicker } = await import("./vaultCommands");
    await expect(openVaultFromPicker()).resolves.toBe("/Users/me/notes");
    expect(invoke).toHaveBeenCalledWith("open_vault", {
      path: "/Users/me/notes",
    });
  });

  it("throws when the picker is cancelled", async () => {
    pickVaultFolder.mockResolvedValue(null);
    const { openVaultFromPicker } = await import("./vaultCommands");
    await expect(openVaultFromPicker()).rejects.toThrow("No folder selected");
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("theme vault commands", () => {
  it("uses the Rust vault-scoped theme commands", async () => {
    invoke
      .mockResolvedValueOnce(["fixture-theme"])
      .mockResolvedValueOnce("body { color: red; }");
    const { listThemeDirectories, readThemeFile } =
      await import("./vaultCommands");

    await expect(listThemeDirectories()).resolves.toEqual(["fixture-theme"]);
    await expect(readThemeFile("fixture-theme", "theme.css")).resolves.toBe(
      "body { color: red; }",
    );
    expect(invoke).toHaveBeenNthCalledWith(1, "list_theme_directories");
    expect(invoke).toHaveBeenNthCalledWith(2, "read_theme_file", {
      dirName: "fixture-theme",
      relativePath: "theme.css",
    });
  });
});

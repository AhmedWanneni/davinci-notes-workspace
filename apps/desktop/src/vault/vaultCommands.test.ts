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

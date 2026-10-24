import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPlatformAdapters } from "@app/platform-adapters";
import { TauriDialogAdapter } from "../adapters/TauriDialogAdapter";

const openDialog = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: openDialog,
  confirm: vi.fn(),
  message: vi.fn(),
}));

describe("pickVaultFolder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPlatformAdapters({
      dialog: new TauriDialogAdapter(),
    });
  });

  it("returns null when the dialog is cancelled", async () => {
    openDialog.mockResolvedValue(null);
    const { pickVaultFolder } = await import("./pickVaultFolder");
    await expect(pickVaultFolder()).resolves.toBeNull();
  });

  it("returns a single directory path from the dialog", async () => {
    openDialog.mockResolvedValue("/Users/me/vault");
    const { pickVaultFolder } = await import("./pickVaultFolder");
    await expect(pickVaultFolder()).resolves.toBe("/Users/me/vault");
  });

  it("returns the first path when multiple is accidentally returned", async () => {
    openDialog.mockResolvedValue(["/first", "/second"]);
    const { pickVaultFolder } = await import("./pickVaultFolder");
    await expect(pickVaultFolder()).resolves.toBe("/first");
  });
});

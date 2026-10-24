import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPlatformAdapters } from "@app/platform-adapters";
import { runTreeRename } from "./runTreeRename";

const alertMock = vi.fn();

describe("runTreeRename", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPlatformAdapters({
      dialog: {
        confirm: vi.fn(),
        alert: alertMock,
        pickVaultFolder: vi.fn(),
        pickImageFile: vi.fn(),
      },
    });
  });

  it("surfaces a failed folder rename", async () => {
    await expect(
      runTreeRename("folder", () => Promise.resolve(false)),
    ).resolves.toBe(false);
    expect(alertMock).toHaveBeenCalledWith(
      "Could not rename this folder.",
      "Rename failed",
    );
  });
});

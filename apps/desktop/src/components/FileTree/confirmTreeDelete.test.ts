import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPlatformAdapters } from "@app/platform-adapters";
import { confirmTreeDelete } from "./confirmTreeDelete";

const confirmMock = vi.fn();
const alertMock = vi.fn();

describe("confirmTreeDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPlatformAdapters({
      dialog: {
        confirm: confirmMock,
        alert: alertMock,
        pickVaultFolder: vi.fn(),
        pickImageFile: vi.fn(),
      },
    });
  });

  it("does not delete when the native confirmation is cancelled", async () => {
    const remove = vi.fn();
    confirmMock.mockResolvedValue(false);

    await confirmTreeDelete("projects", true, remove);

    expect(remove).not.toHaveBeenCalled();
  });

  it("deletes a confirmed folder and surfaces failures", async () => {
    confirmMock.mockResolvedValue(true);
    const remove = vi.fn().mockResolvedValue(false);

    await confirmTreeDelete("projects", true, remove);

    expect(remove).toHaveBeenCalledOnce();
    expect(alertMock).toHaveBeenCalledWith(
      expect.stringContaining("Could not delete"),
      "Delete failed",
    );
  });
});

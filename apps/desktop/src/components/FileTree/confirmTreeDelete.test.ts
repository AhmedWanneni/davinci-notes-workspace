import { beforeEach, describe, expect, it, vi } from "vitest";

const confirmMock = vi.fn();
const messageMock = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  confirm: (...args: unknown[]) => confirmMock(...args),
  message: (...args: unknown[]) => messageMock(...args),
}));

import { confirmTreeDelete } from "./confirmTreeDelete";

describe("confirmTreeDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(messageMock).toHaveBeenCalledWith(
      expect.stringContaining("Could not delete"),
      expect.objectContaining({ kind: "error" }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const messageMock = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  message: (...args: unknown[]) => messageMock(...args),
}));

import { runTreeRename } from "./runTreeRename";

describe("runTreeRename", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("surfaces a failed folder rename", async () => {
    await expect(
      runTreeRename("folder", () => Promise.resolve(false)),
    ).resolves.toBe(false);
    expect(messageMock).toHaveBeenCalledWith(
      "Could not rename this folder.",
      expect.objectContaining({ kind: "error" }),
    );
  });
});

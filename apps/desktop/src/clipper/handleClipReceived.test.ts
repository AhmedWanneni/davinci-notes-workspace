import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClipAck } from "@app/clipper-core";

const { applyClipToVaultMock, invokeMock } = vi.hoisted(() => ({
  applyClipToVaultMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock("./applyClipToVault", () => ({
  applyClipToVault: (...args: unknown[]) => applyClipToVaultMock(...args),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

import { CLIPPER_EVENT, handleClipReceived } from "./handleClipReceived";

const event = {
  clipId: "clip-1",
  payload: { behavior: "create" },
  relativePath: "Clippings/Probe.md",
} as never;

describe("handleClipReceived", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockResolvedValue(undefined);
  });

  it("names the event the Rust listener emits", () => {
    expect(CLIPPER_EVENT).toBe("clipper:clip-received");
  });

  it("reports the outcome to the waiting listener", async () => {
    const ack: ClipAck = {
      clipId: "clip-1",
      status: "written",
      path: "Clippings/Probe.md",
    };
    applyClipToVaultMock.mockResolvedValue(ack);

    await expect(handleClipReceived(event)).resolves.toBe(ack);
    expect(invokeMock).toHaveBeenCalledWith("clipper_submit_result", { ack });
  });

  it("still reports a rejection so the listener never waits out its timeout", async () => {
    const ack: ClipAck = {
      clipId: "clip-1",
      status: "rejected",
      error: "vault-not-open",
    };
    applyClipToVaultMock.mockResolvedValue(ack);

    await handleClipReceived(event);
    expect(invokeMock).toHaveBeenCalledWith("clipper_submit_result", { ack });
  });

  it("does not throw when the receiver is no longer waiting", async () => {
    applyClipToVaultMock.mockResolvedValue({
      clipId: "clip-1",
      status: "written",
    });
    invokeMock.mockRejectedValue("no clip is waiting for that result");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(handleClipReceived(event)).resolves.toBeDefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

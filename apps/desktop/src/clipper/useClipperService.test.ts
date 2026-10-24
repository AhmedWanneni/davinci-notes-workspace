// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listenMock, handleClipReceivedMock } = vi.hoisted(() => ({
  listenMock: vi.fn(),
  handleClipReceivedMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => listenMock(...args),
}));

vi.mock("./handleClipReceived", () => ({
  CLIPPER_EVENT: "clipper:clip-received",
  handleClipReceived: (...args: unknown[]) => handleClipReceivedMock(...args),
}));

import { useClipperService } from "./useClipperService";

describe("useClipperService", () => {
  type Handler = (event: { payload: unknown }) => void;
  let handlers: Map<string, Handler>;
  let unlisten: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = new Map();
    unlisten = vi.fn();
    listenMock.mockImplementation(async (event: string, handler: Handler) => {
      handlers.set(event, handler);
      return unlisten;
    });
    handleClipReceivedMock.mockResolvedValue({
      clipId: "clip-1",
      status: "written",
    });
  });

  it("subscribes to the clip event and serves received clips", async () => {
    renderHook(() => useClipperService());

    await vi.waitFor(() => expect(listenMock).toHaveBeenCalledOnce());
    expect(listenMock).toHaveBeenCalledWith(
      "clipper:clip-received",
      expect.any(Function),
    );

    const payload = { clipId: "clip-1", payload: {}, relativePath: "a.md" };
    handlers.get("clipper:clip-received")?.({ payload });

    await vi.waitFor(() =>
      expect(handleClipReceivedMock).toHaveBeenCalledWith(payload),
    );
  });

  it("unsubscribes on unmount", async () => {
    const { unmount } = renderHook(() => useClipperService());
    await vi.waitFor(() => expect(listenMock).toHaveBeenCalledOnce());

    unmount();
    expect(unlisten).toHaveBeenCalledOnce();
  });
});

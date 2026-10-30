// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { useCaptureActions } from "./useCaptureActions";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("useCaptureActions - handleQuit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onQuit callback when provided", async () => {
    const onQuit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCaptureActions({
        onQuit,
        filename: "",
        folder: "",
        setText: vi.fn(),
        setFilename: vi.fn(),
        setFolder: vi.fn(),
        setMode: vi.fn(),
        setAutoStartRecord: vi.fn(),
        resetSearch: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleQuit();
    });

    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("invokes quick_capture_quit_app by default when onQuit is not provided", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useCaptureActions({
        filename: "",
        folder: "",
        setText: vi.fn(),
        setFilename: vi.fn(),
        setFolder: vi.fn(),
        setMode: vi.fn(),
        setAutoStartRecord: vi.fn(),
        resetSearch: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleQuit();
    });

    expect(invoke).toHaveBeenCalledWith("quick_capture_quit_app");
  });

  it("falls back to request_app_exit if quick_capture_quit_app rejects", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("Command unknown"));
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useCaptureActions({
        filename: "",
        folder: "",
        setText: vi.fn(),
        setFilename: vi.fn(),
        setFolder: vi.fn(),
        setMode: vi.fn(),
        setAutoStartRecord: vi.fn(),
        resetSearch: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleQuit();
    });

    expect(invoke).toHaveBeenCalledWith("quick_capture_quit_app");
    expect(invoke).toHaveBeenCalledWith("request_app_exit");
  });
});

// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { exportNoteToPdf } from "./exportNoteToPdf";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("exportNoteToPdf", () => {
  it("calls print_webview tauri command when available", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await exportNoteToPdf();
    expect(invoke).toHaveBeenCalledWith("print_webview");
  });

  it("falls back to window.print if invoke fails", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("ipc unavailable"));
    const originalPrint = window.print;
    const printSpy = vi.fn();
    window.print = printSpy;
    try {
      await exportNoteToPdf();
      expect(printSpy).toHaveBeenCalled();
    } finally {
      window.print = originalPrint;
    }
  });
});

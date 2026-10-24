// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPlatformAdapters } from "@app/platform-adapters";
import { WindowControls } from "./WindowControls";

const windowControlsMock = vi.hoisted(() => ({
  supported: true,
  close: vi.fn().mockResolvedValue(undefined),
  minimize: vi.fn().mockResolvedValue(undefined),
  maximize: vi.fn().mockResolvedValue(undefined),
  toggleFullscreen: vi.fn().mockResolvedValue(undefined),
  isFullscreen: vi.fn().mockResolvedValue(false),
  startDragging: vi.fn(),
}));

describe("WindowControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPlatformAdapters({
      windowControls: windowControlsMock,
    });
  });

  it("calls the native window operations", () => {
    render(<WindowControls />);

    fireEvent.click(screen.getByRole("button", { name: "Minimize window" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Maximize or restore window" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Close window" }));

    expect(windowControlsMock.minimize).toHaveBeenCalledOnce();
    expect(windowControlsMock.maximize).toHaveBeenCalledOnce();
    expect(windowControlsMock.close).toHaveBeenCalledOnce();
  });
});

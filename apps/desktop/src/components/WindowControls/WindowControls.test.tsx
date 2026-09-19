// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WindowControls } from "./WindowControls";

const windowApi = vi.hoisted(() => ({
  close: vi.fn(),
  minimize: vi.fn(),
  toggleMaximize: vi.fn(),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => windowApi,
}));

describe("WindowControls", () => {
  it("calls the native window operations", () => {
    render(<WindowControls />);

    fireEvent.click(screen.getByRole("button", { name: "Minimize window" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Maximize or restore window" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Close window" }));

    expect(windowApi.minimize).toHaveBeenCalledOnce();
    expect(windowApi.toggleMaximize).toHaveBeenCalledOnce();
    expect(windowApi.close).toHaveBeenCalledOnce();
  });
});

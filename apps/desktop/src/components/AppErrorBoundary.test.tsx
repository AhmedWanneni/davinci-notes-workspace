// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AppErrorBoundary } from "./AppErrorBoundary";

afterEach(() => {
  cleanup();
});

function BuggyComponent(): React.ReactElement {
  throw new Error("Simulated render crash");
}

describe("AppErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <AppErrorBoundary>
        <div data-testid="child">Safe Child Content</div>
      </AppErrorBoundary>,
    );
    expect(screen.getByTestId("child").textContent).toBe("Safe Child Content");
  });

  it("catches render errors and displays fallback UI", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <AppErrorBoundary>
        <BuggyComponent />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByText("Something went wrong loading DaVinci Notes"),
    ).toBeDefined();
    expect(screen.getByText("Simulated render crash")).toBeDefined();
    expect(screen.getByText("Reload Application")).toBeDefined();
    consoleSpy.mockRestore();
  });

  it("handles reload button click", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadMock },
    });

    render(
      <AppErrorBoundary>
        <BuggyComponent />
      </AppErrorBoundary>,
    );

    const button = screen.getByText("Reload Application");
    fireEvent.click(button);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});

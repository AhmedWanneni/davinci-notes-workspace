import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GitEmptyState } from "./GitEmptyState";

describe("GitEmptyState", () => {
  it("renders git-not-installed state correctly", () => {
    render(<GitEmptyState type="not-installed" />);
    expect(screen.getByTestId("git-not-installed")).toBeDefined();
    expect(screen.getByText("Git is not installed")).toBeDefined();
  });

  it("renders not-repo state and triggers initialize callback", () => {
    const handleInit = vi.fn();
    render(<GitEmptyState type="not-repo" onInitialize={handleInit} />);
    expect(screen.getByTestId("git-not-repo")).toBeDefined();
    expect(screen.getByText("Not a Git repository")).toBeDefined();

    const button = screen.getByRole("button", { name: "Initialize Repository" });
    fireEvent.click(button);
    expect(handleInit).toHaveBeenCalledTimes(1);
  });

  it("renders no-commits state", () => {
    render(<GitEmptyState type="no-commits" />);
    expect(screen.getByTestId("git-no-commits")).toBeDefined();
    expect(screen.getByText("No commits yet")).toBeDefined();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GitStatusRow } from "./GitStatusRow";

describe("GitStatusRow", () => {
  it("renders filename, directory, and status badge correctly", () => {
    render(
      <GitStatusRow
        change={{
          path: "notes/daily/2026-10-29.md",
          statusCode: "M",
          staged: false,
        }}
      />
    );

    expect(screen.getByText("2026-10-29.md")).toBeDefined();
    expect(screen.getByText("notes/daily")).toBeDefined();
    const badge = screen.getByText("M");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("data-status")).toBe("M");
  });

  it("handles root-level files without directory", () => {
    render(
      <GitStatusRow
        change={{
          path: "README.md",
          statusCode: "A",
          staged: true,
        }}
      />
    );

    expect(screen.getByText("README.md")).toBeDefined();
    expect(screen.queryByText("/")).toBeNull();
    expect(screen.getByText("A").getAttribute("data-status")).toBe("A");
  });

  it("invokes onClick when row is clicked", () => {
    const handleClick = vi.fn();
    render(
      <GitStatusRow
        change={{
          path: "test.txt",
          statusCode: "?",
          staged: false,
        }}
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByTestId("git-status-row-test.txt"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

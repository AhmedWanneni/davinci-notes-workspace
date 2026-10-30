import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GitCommitDetailSheet } from "./GitCommitDetailSheet";
import type { GitCommitDetail } from "../types/gitTypes";

describe("GitCommitDetailSheet", () => {
  const mockDetail: GitCommitDetail = {
    hash: "a1b2c3d4e5f6789012345678901234567890abcd",
    authorName: "Sophia Author",
    authorEmail: "sophia@davinci.internal",
    authorDate: 1729000000,
    message: "feat: add amazing feature\n\nDetailed description here.",
    files: [
      { path: "src/index.ts", status: "M", insertions: 15, deletions: 3 },
      { path: "README.md", status: "M", insertions: 2, deletions: 0 },
    ],
  };

  it("renders commit hash, author info, message, and changed files", () => {
    render(<GitCommitDetailSheet detail={mockDetail} />);

    expect(screen.getByText("Commit a1b2c3d")).toBeDefined();
    expect(screen.getByText(/Sophia Author/)).toBeDefined();
    expect(screen.getByText(/add amazing feature/)).toBeDefined();
    expect(screen.getByText("Changed Files (2)")).toBeDefined();
    expect(screen.getByText("src/index.ts")).toBeDefined();
    expect(screen.getByText("+15")).toBeDefined();
    expect(screen.getByText("-3")).toBeDefined();
  });

  it("triggers onSelectFile when a file row is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <GitCommitDetailSheet detail={mockDetail} onSelectFile={handleSelect} />
    );

    fireEvent.click(screen.getByText("src/index.ts"));
    expect(handleSelect).toHaveBeenCalledWith("src/index.ts");
  });

  it("triggers onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(<GitCommitDetailSheet detail={mockDetail} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", {
      name: "Close commit details",
    });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

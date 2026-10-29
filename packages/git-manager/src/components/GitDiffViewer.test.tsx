import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GitDiffViewer } from "./GitDiffViewer";
import type { GitFileDiff } from "../types/gitTypes";
import { useGitManagerStore } from "../store/useGitManagerStore";

describe("GitDiffViewer", () => {
  const mockDiff: GitFileDiff = {
    path: "notes/sample.md",
    originalContent: "Line 1\nLine 2",
    modifiedContent: "Line 1\nLine 2 Modified",
    patch: "@@ -1,2 +1,2 @@\n Line 1\n-Line 2\n+Line 2 Modified",
    staged: false,
  };

  it("renders path, status badge, and editor container", () => {
    render(<GitDiffViewer diff={mockDiff} />);
    expect(screen.getByText("notes/sample.md")).toBeDefined();
    expect(screen.getByText("Working Tree")).toBeDefined();
    expect(screen.getByTestId("git-diff-editor-container")).toBeDefined();
  });

  it("triggers stage when stage button clicked on unstaged diff", () => {
    const stageMock = vi.fn();
    useGitManagerStore.setState({ stagePaths: stageMock });

    render(<GitDiffViewer diff={mockDiff} />);
    const stageBtn = screen.getByRole("button", { name: "Stage" });
    fireEvent.click(stageBtn);

    expect(stageMock).toHaveBeenCalledWith(["notes/sample.md"]);
  });

  it("triggers unstage when unstage button clicked on staged diff", () => {
    const unstageMock = vi.fn();
    useGitManagerStore.setState({ unstagePaths: unstageMock });

    render(
      <GitDiffViewer
        diff={{
          ...mockDiff,
          staged: true,
        }}
      />
    );
    const unstageBtn = screen.getByRole("button", { name: "Unstage" });
    fireEvent.click(unstageBtn);

    expect(unstageMock).toHaveBeenCalledWith(["notes/sample.md"]);
  });

  it("invokes onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(<GitDiffViewer diff={mockDiff} onClose={handleClose} />);
    const closeBtn = screen.getByRole("button", { name: "Close diff" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

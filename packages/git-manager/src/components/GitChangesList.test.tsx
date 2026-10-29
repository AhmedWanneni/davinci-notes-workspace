import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GitChangesList } from "./GitChangesList";
import { useGitManagerStore } from "../store/useGitManagerStore";
import type { GitFileChange } from "../types/gitTypes";

describe("GitChangesList", () => {
  const stagedSample: GitFileChange[] = [
    { path: "src/index.ts", statusCode: "M", staged: true },
    { path: "src/new.ts", statusCode: "A", staged: true },
  ];

  const unstagedSample: GitFileChange[] = [
    { path: "README.md", statusCode: "M", staged: false },
    { path: "notes/idea.md", statusCode: "?", staged: false },
  ];

  const conflictSample: GitFileChange[] = [
    { path: "conflict.txt", statusCode: "U", staged: false },
  ];

  it("shows empty text when there are no changes", () => {
    render(<GitChangesList staged={[]} unstaged={[]} conflicts={[]} />);
    expect(screen.getByText("No changes in working directory.")).toBeDefined();
  });

  it("renders staged, unstaged, and conflict sections with correct counts", () => {
    render(
      <GitChangesList
        staged={stagedSample}
        unstaged={unstagedSample}
        conflicts={conflictSample}
      />
    );

    expect(screen.getByText("Merge Conflicts")).toBeDefined();
    expect(screen.getByText("Staged Changes")).toBeDefined();
    expect(screen.getByText("Changes")).toBeDefined();

    expect(screen.getByText("index.ts")).toBeDefined();
    expect(screen.getByText("new.ts")).toBeDefined();
    expect(screen.getByText("README.md")).toBeDefined();
    expect(screen.getByText("idea.md")).toBeDefined();
    expect(screen.getByText("conflict.txt")).toBeDefined();
  });

  it("toggles section visibility when header is clicked", () => {
    render(
      <GitChangesList
        staged={stagedSample}
        unstaged={[]}
        conflicts={[]}
      />
    );

    expect(screen.getByText("index.ts")).toBeDefined();

    const header = screen.getByText("Staged Changes");
    fireEvent.click(header);

    expect(screen.queryByText("index.ts")).toBeNull();

    fireEvent.click(header);
    expect(screen.getByText("index.ts")).toBeDefined();
  });

  it("calls onSelectFile when a status row is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <GitChangesList
        staged={stagedSample}
        unstaged={[]}
        conflicts={[]}
        onSelectFile={handleSelect}
      />
    );

    fireEvent.click(screen.getByTestId("git-status-row-src/index.ts"));
    expect(handleSelect).toHaveBeenCalledWith(stagedSample[0]);
  });

  it("triggers stage and unstage actions from store", () => {
    const stagePathsMock = vi.fn();
    const unstagePathsMock = vi.fn();
    useGitManagerStore.setState({
      stagePaths: stagePathsMock,
      unstagePaths: unstagePathsMock,
    });

    render(
      <GitChangesList
        staged={stagedSample}
        unstaged={unstagedSample}
        conflicts={[]}
      />
    );

    const stageAllBtn = screen.getByRole("button", { name: "Stage All" });
    fireEvent.click(stageAllBtn);
    expect(stagePathsMock).toHaveBeenCalledWith([]);

    const unstageAllBtn = screen.getByRole("button", { name: "Unstage All" });
    fireEvent.click(unstageAllBtn);
    expect(unstagePathsMock).toHaveBeenCalledWith([]);
  });
});

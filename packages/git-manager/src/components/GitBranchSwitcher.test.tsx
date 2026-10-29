import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitBranchSwitcher } from "./GitBranchSwitcher";
import * as gitClient from "../api/gitClient";

vi.mock("../api/gitClient", () => ({
  fetchGitBranches: vi.fn(),
  switchGitBranch: vi.fn(),
  createGitBranch: vi.fn(),
  deleteGitBranch: vi.fn(),
  stashGitChanges: vi.fn(),
}));

describe("GitBranchSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gitClient.fetchGitBranches).mockResolvedValue([
      {
        name: "main",
        isCurrent: true,
        isRemote: false,
        ahead: 0,
        behind: 0,
      },
      {
        name: "feature/notes",
        isCurrent: false,
        isRemote: false,
        ahead: 1,
        behind: 0,
      },
    ]);
  });

  it("renders trigger with current branch name", () => {
    render(<GitBranchSwitcher currentBranch="main" />);
    expect(screen.getByText("main")).toBeDefined();
    expect(screen.getByRole("button", { name: "Switch branch" })).toBeDefined();
  });

  it("opens dropdown and lists branches", async () => {
    render(<GitBranchSwitcher currentBranch="main" />);
    const trigger = screen.getByRole("button", { name: "Switch branch" });
    fireEvent.pointerDown(trigger, { button: 0 });

    await waitFor(() => {
      expect(gitClient.fetchGitBranches).toHaveBeenCalled();
    });

    expect(screen.getByText("feature/notes")).toBeDefined();
  });

  it("switches branch when an item is selected", async () => {
    render(<GitBranchSwitcher currentBranch="main" />);
    const trigger = screen.getByRole("button", { name: "Switch branch" });
    fireEvent.pointerDown(trigger, { button: 0 });

    await waitFor(() => {
      expect(screen.getByText("feature/notes")).toBeDefined();
    });

    fireEvent.click(screen.getByText("feature/notes"));
    expect(gitClient.switchGitBranch).toHaveBeenCalledWith("feature/notes");
  });
});

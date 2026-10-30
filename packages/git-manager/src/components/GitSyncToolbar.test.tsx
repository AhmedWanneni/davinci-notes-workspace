import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GitSyncToolbar } from "./GitSyncToolbar";
import { useGitSyncStore } from "../store/useGitSyncStore";
import { useGitManagerStore } from "../store/useGitManagerStore";

vi.mock("../api/gitClient", () => ({
  getGitTrackingStatus: vi.fn(),
  getGitRemotes: vi.fn(),
  fetchGitRemote: vi.fn().mockResolvedValue({ success: true, message: "Fetch complete" }),
  pullGitRemote: vi.fn().mockResolvedValue({ success: true, message: "Pull complete" }),
  pushGitRemote: vi.fn().mockResolvedValue({ success: true, message: "Push complete" }),
}));

describe("GitSyncToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGitManagerStore.setState({
      repoInfo: {
        gitAvailable: true,
        isRepo: true,
        branch: "main",
        isEmpty: false,
        isDetached: false,
      },
    });
    useGitSyncStore.setState({
      tracking: null,
      isSyncing: false,
      syncError: null,
      syncMessage: null,
    });
  });

  it("renders 'No remote tracking' when no upstream is present", () => {
    render(<GitSyncToolbar />);
    expect(screen.getByText("No remote tracking")).toBeDefined();
  });

  it("renders upstream tracking branch and ahead/behind counts", () => {
    useGitSyncStore.setState({
      tracking: {
        ahead: 2,
        behind: 3,
        upstream: "origin/main",
      },
    });

    render(<GitSyncToolbar />);
    expect(screen.getByText("origin/main")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByRole("button", { name: /pull/i })).toBeDefined();
  });

  it("triggers fetch when fetch button is clicked", async () => {
    const { fetchGitRemote } = await import("../api/gitClient");
    render(<GitSyncToolbar />);

    const fetchBtn = screen.getByRole("button", { name: "Fetch remote changes" });
    fireEvent.click(fetchBtn);

    expect(fetchGitRemote).toHaveBeenCalled();
  });

  it("renders and dismisses error banner", () => {
    useGitSyncStore.setState({
      syncError: "Network unreachable",
    });

    render(<GitSyncToolbar />);
    expect(screen.getByText("Network unreachable")).toBeDefined();

    const dismissBtn = screen.getByRole("button", { name: "Dismiss error" });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText("Network unreachable")).toBeNull();
  });
});

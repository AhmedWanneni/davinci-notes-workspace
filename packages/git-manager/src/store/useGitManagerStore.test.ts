import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGitManagerStore } from "./useGitManagerStore";
import * as gitClient from "../api/gitClient";

vi.mock("../api/gitClient");

describe("useGitManagerStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGitManagerStore.setState({
      repoInfo: null,
      isLoading: false,
      error: null,
    });
  });

  it("fetches repository info successfully", async () => {
    const mockInfo = {
      gitAvailable: true,
      isRepo: true,
      branch: "main",
      isEmpty: false,
      isDetached: false,
    };
    vi.mocked(gitClient.fetchGitRepoInfo).mockResolvedValueOnce(mockInfo);

    await useGitManagerStore.getState().refreshRepoInfo();

    const state = useGitManagerStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.repoInfo).toEqual(mockInfo);
  });

  it("handles repository initialization successfully", async () => {
    const mockInfo = {
      gitAvailable: true,
      isRepo: true,
      branch: "main",
      isEmpty: true,
      isDetached: false,
    };
    vi.mocked(gitClient.initGitRepository).mockResolvedValueOnce();
    vi.mocked(gitClient.fetchGitRepoInfo).mockResolvedValueOnce(mockInfo);

    await useGitManagerStore.getState().initializeRepo();

    expect(gitClient.initGitRepository).toHaveBeenCalledTimes(1);
    const state = useGitManagerStore.getState();
    expect(state.repoInfo).toEqual(mockInfo);
    expect(state.isLoading).toBe(false);
  });

  it("captures errors properly on failure", async () => {
    vi.mocked(gitClient.fetchGitRepoInfo).mockRejectedValueOnce(
      new Error("Command failed: git not found"),
    );

    await useGitManagerStore.getState().refreshRepoInfo();

    const state = useGitManagerStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe("Command failed: git not found");
  });
});

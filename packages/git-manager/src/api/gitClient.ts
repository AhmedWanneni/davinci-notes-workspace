import { invoke } from "@tauri-apps/api/core";
import type {
  GitCommitDetail,
  GitCommitEntry,
  GitFileDiff,
  GitRepoInfo,
} from "../types/gitTypes";

export async function fetchGitRepoInfo(): Promise<GitRepoInfo> {
  return invoke<GitRepoInfo>("get_git_repo_info");
}

export async function initGitRepository(): Promise<void> {
  return invoke<void>("init_git_repository");
}

export async function fetchGitStatus(): Promise<string> {
  return invoke<string>("git_manager_status");
}

export async function stageGitPaths(paths: string[]): Promise<void> {
  return invoke<void>("git_manager_stage", { paths });
}

export async function unstageGitPaths(paths: string[]): Promise<void> {
  return invoke<void>("git_manager_unstage", { paths });
}

export async function discardGitPaths(paths: string[]): Promise<void> {
  return invoke<void>("git_manager_discard", { paths });
}

export async function commitGit(message: string, amend = false): Promise<string> {
  return invoke<string>("git_manager_commit", { message, amend });
}

export async function fetchFileDiff(path: string, staged: boolean): Promise<GitFileDiff> {
  return invoke<GitFileDiff>("git_manager_get_file_diff", { path, staged });
}

export async function applyGitPatch(
  patch: string,
  cached: boolean,
  reverse = false
): Promise<void> {
  return invoke<void>("git_manager_apply_patch", { patch, cached, reverse });
}

export async function fetchGitLog(
  limit = 50,
  skip = 0,
  pathFilter?: string
): Promise<GitCommitEntry[]> {
  return invoke<GitCommitEntry[]>("git_manager_get_log", {
    limit,
    skip,
    pathFilter,
  });
}

export async function fetchGitCommitDetails(hash: string): Promise<GitCommitDetail> {
  return invoke<GitCommitDetail>("git_manager_get_commit_details", { hash });
}

export async function listenToGitChanges(callback: () => void): Promise<() => void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("git-changed", callback);
  } catch {
    return () => {};
  }
}

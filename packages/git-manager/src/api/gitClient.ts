import { invoke } from "@tauri-apps/api/core";
import type { GitRepoInfo } from "../types/gitTypes";

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

export async function listenToGitChanges(callback: () => void): Promise<() => void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("git-changed", callback);
  } catch {
    return () => {};
  }
}

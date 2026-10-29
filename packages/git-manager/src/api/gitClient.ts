import { invoke } from "@tauri-apps/api/core";
import type {
  GitBranchInfo,
  GitCommitDetail,
  GitCommitEntry,
  GitFileDiff,
  GitRepoInfo,
  GitRemoteInfo,
  GitTrackingStatus,
  GitSyncResult,
  GitConflictFileVersions,
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

export async function commitGit(
  message: string,
  amend = false,
): Promise<string> {
  return invoke<string>("git_manager_commit", { message, amend });
}

export async function fetchFileDiff(
  path: string,
  staged: boolean,
): Promise<GitFileDiff> {
  return invoke<GitFileDiff>("git_manager_get_file_diff", { path, staged });
}

export async function applyGitPatch(
  patch: string,
  cached: boolean,
  reverse = false,
): Promise<void> {
  return invoke<void>("git_manager_apply_patch", { patch, cached, reverse });
}

export async function fetchGitLog(
  limit = 50,
  skip = 0,
  pathFilter?: string,
): Promise<GitCommitEntry[]> {
  return invoke<GitCommitEntry[]>("git_manager_get_log", {
    limit,
    skip,
    pathFilter,
  });
}

export async function fetchGitCommitDetails(
  hash: string,
): Promise<GitCommitDetail> {
  return invoke<GitCommitDetail>("git_manager_get_commit_details", { hash });
}

export async function fetchGitBranches(): Promise<GitBranchInfo[]> {
  return invoke<GitBranchInfo[]>("git_manager_list_branches");
}

export async function switchGitBranch(branch: string): Promise<void> {
  return invoke<void>("git_manager_switch_branch", { branch });
}

export async function createGitBranch(
  branch: string,
  checkout = true,
): Promise<void> {
  return invoke<void>("git_manager_create_branch", { branch, checkout });
}

export async function deleteGitBranch(
  branch: string,
  force = false,
): Promise<void> {
  return invoke<void>("git_manager_delete_branch", { branch, force });
}

export async function stashGitChanges(message?: string): Promise<void> {
  return invoke<void>("git_manager_stash", { message });
}

export async function popGitStash(): Promise<void> {
  return invoke<void>("git_manager_stash_pop");
}

export async function getGitRemotes(): Promise<GitRemoteInfo[]> {
  return invoke<GitRemoteInfo[]>("git_manager_get_remotes");
}

export async function setGitRemote(name: string, url: string): Promise<void> {
  return invoke<void>("git_manager_set_remote", { name, url });
}

export async function getGitTrackingStatus(): Promise<GitTrackingStatus> {
  return invoke<GitTrackingStatus>("git_manager_get_tracking_status");
}

export async function fetchGitRemote(remote?: string): Promise<GitSyncResult> {
  return invoke<GitSyncResult>("git_manager_fetch", { remote });
}

export async function pullGitRemote(remote?: string): Promise<GitSyncResult> {
  return invoke<GitSyncResult>("git_manager_pull", { remote });
}

export async function pushGitRemote(
  remote?: string,
  branch?: string,
  force?: boolean,
): Promise<GitSyncResult> {
  return invoke<GitSyncResult>("git_manager_push", { remote, branch, force });
}

export async function getGitConflictDetails(
  path: string,
): Promise<GitConflictFileVersions> {
  return invoke<GitConflictFileVersions>("git_manager_get_conflict_details", {
    path,
  });
}

export async function resolveGitConflict(
  path: string,
  content: string,
): Promise<void> {
  return invoke<void>("git_manager_resolve_conflict", { path, content });
}

export async function abortGitMerge(): Promise<void> {
  return invoke<void>("git_manager_abort_merge");
}

export async function continueGitMerge(): Promise<string> {
  return invoke<string>("git_manager_continue_merge");
}

export async function cloneGitRepository(
  url: string,
  destination: string,
  token?: string,
): Promise<string> {
  return invoke<string>("git_manager_clone_repo", {
    url,
    destination,
    token: token || null,
  });
}

export async function listenToGitChanges(
  callback: () => void,
): Promise<() => void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("git-changed", callback);
  } catch {
    return () => {};
  }
}

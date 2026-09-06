import { invoke } from "@tauri-apps/api/core";

export interface LocalGitVersion {
  revision: string;
  message: string;
  timestamp: number;
}

export function listLocalGitVersions(path: string): Promise<LocalGitVersion[]> {
  return invoke("list_local_git_versions", { path });
}
export function readLocalGitVersion(
  path: string,
  revision: string,
): Promise<string> {
  return invoke("read_local_git_version", { path, revision });
}
export function restoreLocalGitVersion(
  path: string,
  revision: string,
): Promise<string> {
  return invoke("restore_local_git_version", { path, revision });
}

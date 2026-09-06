import { invoke } from "@tauri-apps/api/core";

export async function createLocalGitVersion(
  paths: string[],
  manual: boolean,
): Promise<string | null> {
  return invoke<string | null>("create_local_git_version", { paths, manual });
}

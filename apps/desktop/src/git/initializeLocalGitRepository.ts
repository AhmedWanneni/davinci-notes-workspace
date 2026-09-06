import { invoke } from "@tauri-apps/api/core";

/** Initializes local-only history after the user enables Version History. */
export async function initializeLocalGitRepository(): Promise<void> {
  await invoke("initialize_local_git_repository");
}

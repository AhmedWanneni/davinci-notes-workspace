import { invoke } from "@tauri-apps/api/core";

/** PATs cross only Tauri IPC and the OS keyring; remote SQLite config never contains them. */
export const desktopGitPatStore = {
  load: (remoteUrl: string) =>
    invoke<string | null>("load_git_pat", { remoteUrl }),
  save: (remoteUrl: string, token: string) =>
    invoke("save_git_pat", { remoteUrl, token }),
  clear: (remoteUrl: string) => invoke("clear_git_pat", { remoteUrl }),
};

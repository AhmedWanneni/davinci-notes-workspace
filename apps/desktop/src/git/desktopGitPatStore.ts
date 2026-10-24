import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

/** PATs cross only the platform secret store boundary; remote SQLite config never contains them. */
export const desktopGitPatStore = {
  load: (remoteUrl: string) =>
    hasPlatformAdapters()
      ? getPlatformAdapters().secrets.getSecret(`git_pat:${remoteUrl}`)
      : Promise.resolve(null),
  save: (remoteUrl: string, token: string) =>
    hasPlatformAdapters()
      ? getPlatformAdapters().secrets.setSecret(`git_pat:${remoteUrl}`, token)
      : Promise.resolve(),
  clear: (remoteUrl: string) =>
    hasPlatformAdapters()
      ? getPlatformAdapters().secrets.clearSecret(`git_pat:${remoteUrl}`)
      : Promise.resolve(),
};

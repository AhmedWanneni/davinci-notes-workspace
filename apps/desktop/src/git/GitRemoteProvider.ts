export interface GitRemoteProvider {
  id: "github" | "gitlab" | "bitbucket" | "self-hosted";
  host: string;
  helpUrl: string | null;
  tokenHelp: string;
}

const KNOWN_PROVIDERS: Record<string, Omit<GitRemoteProvider, "host">> = {
  "github.com": {
    id: "github",
    helpUrl: "https://github.com/settings/personal-access-tokens",
    tokenHelp:
      "Create a fine-grained, repository-scoped personal access token.",
  },
  "gitlab.com": {
    id: "gitlab",
    helpUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
    tokenHelp: "Create a repository-scoped personal access token.",
  },
  "bitbucket.org": {
    id: "bitbucket",
    helpUrl: "https://bitbucket.org/account/settings/app-passwords/",
    tokenHelp: "Create a repository-scoped access token or app password.",
  },
};

export function detectGitRemoteProvider(remoteUrl: string): GitRemoteProvider {
  let host = "";
  try {
    host = new URL(remoteUrl).hostname.toLowerCase();
  } catch {
    host = "self-hosted";
  }

  const known = KNOWN_PROVIDERS[host];
  if (known) return { ...known, host };
  return {
    id: "self-hosted",
    host,
    helpUrl: null,
    tokenHelp:
      "Create a repository-scoped personal access token on this Git server.",
  };
}

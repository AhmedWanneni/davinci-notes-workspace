import { useState } from "react";
import { Button, Input, Typography } from "@app/design-system";
import { detectGitRemoteProvider } from "../../git/GitRemoteProvider";
import { desktopGitPatStore } from "../../git/desktopGitPatStore";
import { saveCurrentVaultGitRemoteConfig } from "../../git/GitRemoteConfig";
import { validateGitRemote } from "../../git/localGitHistory";

const messages: Record<string, string> = {
  "malformed-url": "Enter a complete HTTPS repository URL.",
  "bad-token":
    "The token was rejected. Create a new repository-scoped token and try again.",
  "repository-not-found":
    "This repository does not exist or is not visible to this token.",
  "no-push-access":
    "The repository is reachable, but this token cannot push to it.",
  "local-history-empty":
    "Save a note first so this vault has local history to back up.",
  "remote-unreachable":
    "The Git server could not be reached. Check the URL and network connection.",
};

export function GitRemoteSetupPanel() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const provider = detectGitRemoteProvider(url);

  const connect = async () => {
    setStatus("");
    try {
      const validation = await validateGitRemote({
        remoteUrl: url,
        token,
        username: username || null,
      });
      if (validation.remoteState === "nonempty") {
        setStatus(
          "This remote already has content. Choose an empty repository for the first backup.",
        );
        return;
      }
      await desktopGitPatStore.save(url, token);
      await saveCurrentVaultGitRemoteConfig({
        remoteUrl: url,
        username: username || null,
      });
      setToken("");
      setStatus(
        "Connected. Your first local-history push will create the remote branch.",
      );
    } catch (error) {
      setStatus(messages[String(error)] ?? "Remote validation failed.");
    }
  };

  return (
    <section className="settings-dialog__section">
      <Typography variant="h3" size="sm">
        Git remote backup
      </Typography>
      <Typography variant="text" size="xs" color="muted">
        Paste an HTTPS repository URL and a repository-scoped token. No provider
        account connection is needed.
      </Typography>
      <Input
        aria-label="Git repository URL"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://git.example.com/team/notes.git"
      />
      <Typography variant="text" size="xs" color="muted">
        {provider.tokenHelp}
      </Typography>
      {provider.helpUrl && (
        <a href={provider.helpUrl} target="_blank" rel="noreferrer">
          Create a token on {provider.host}
        </a>
      )}
      <Input
        aria-label="Git username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Git username (only if your server requires it)"
      />
      <Input
        aria-label="Personal access token"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
      />
      <Button
        variant="primary"
        onClick={() => void connect()}
        disabled={!url || !token}
      >
        Validate and connect
      </Button>
      {status && (
        <Typography variant="text" size="xs" color="muted" role="status">
          {status}
        </Typography>
      )}
    </section>
  );
}

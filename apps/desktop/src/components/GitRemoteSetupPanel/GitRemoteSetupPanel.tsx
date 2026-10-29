import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button, Input, Typography } from "@app/design-system";
import { detectGitRemoteProvider } from "../../git/GitRemoteProvider";
import { desktopGitPatStore } from "../../git/desktopGitPatStore";
import { saveCurrentVaultGitRemoteConfig } from "../../git/GitRemoteConfig";
import { validateGitRemote } from "../../git/localGitHistory";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import styles from "./GitRemoteSetupPanel.module.scss";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const provider = detectGitRemoteProvider(url);
  const setGitEnabled = useWorkspaceStore((state) => state.setGitEnabled);

  const connect = async () => {
    setStatus("");
    setIsConnecting(true);
    try {
      const validation = await validateGitRemote({
        remoteUrl: url,
        token,
        username: username || null,
      });

      // Save PAT in OS Keychain
      await desktopGitPatStore.save(url, token);

      // Save remote URL configuration in settings table
      await saveCurrentVaultGitRemoteConfig({
        remoteUrl: url,
        username: username || null,
      });

      // Configure git remote 'origin' in the working tree
      try {
        await invoke("git_manager_set_remote", { name: "origin", url });
      } catch (err) {
        console.warn("Failed to set git remote origin:", err);
      }

      // Automatically enable Git Manager so the icon appears in the IconRail immediately
      await setGitEnabled(true);

      setToken("");
      if (validation.remoteState === "nonempty") {
        setStatus(
          "Connected! Git Manager is now active in your icon rail. The remote repository has existing commits — use Pull or Push in Git Manager to synchronize.",
        );
      } else {
        setStatus(
          "Connected! Git Manager is now active in your icon rail. Push your commits directly from the Source Control panel.",
        );
      }
    } catch (error) {
      setStatus(messages[String(error)] ?? "Remote validation failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className={styles["git-remote-panel"]}>
      <Typography variant="text" size="xs" color="muted">
        Paste an HTTPS repository URL and a repository-scoped token to configure
        remote backup and version control.
      </Typography>

      <div className={styles["git-remote-panel__field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Repository URL
        </Typography>
        <Input
          size="sm"
          aria-label="Git repository URL"
          value={url}
          disabled={isConnecting}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://github.com/user/notes.git"
        />
      </div>

      <div className={styles["git-remote-panel__field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Username (optional)
        </Typography>
        <Input
          size="sm"
          aria-label="Git username"
          value={username}
          disabled={isConnecting}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Git username (only if required by server)"
        />
      </div>

      <div className={styles["git-remote-panel__field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Personal Access Token
        </Typography>
        <Input
          size="sm"
          aria-label="Personal access token"
          type="password"
          value={token}
          disabled={isConnecting}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Personal access token"
        />
      </div>

      {(provider.tokenHelp || provider.helpUrl) && (
        <div className={styles["git-remote-panel__token-help"]}>
          {provider.tokenHelp && (
            <Typography variant="text" size="xs" color="muted">
              {provider.tokenHelp}
            </Typography>
          )}
          {provider.helpUrl && (
            <a
              href={provider.helpUrl}
              target="_blank"
              rel="noreferrer"
              className={styles["git-remote-panel__link"]}
            >
              Create a token on {provider.host} ↗
            </a>
          )}
        </div>
      )}

      <div className={styles["git-remote-panel__actions"]}>
        <Button
          size="sm"
          variant="primary"
          onClick={() => void connect()}
          disabled={!url || !token || isConnecting}
        >
          {isConnecting ? "Validating & connecting..." : "Validate and connect"}
        </Button>
      </div>

      {status && (
        <Typography
          variant="text"
          size="xs"
          color={status.startsWith("Connected") ? "muted" : "error"}
          role="status"
        >
          {status}
        </Typography>
      )}
    </div>
  );
}

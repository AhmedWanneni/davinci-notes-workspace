import { useState } from "react";
import {
  WarningCircle,
  ArrowsClockwise,
  FolderOpen,
} from "@phosphor-icons/react";
import { Button, Input, Typography } from "@app/design-system";
import { cloneGitRepository } from "@app/git-manager";
import { pickVaultFolder } from "../../vault";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { SettingsCard } from "./SettingsCard";
import styles from "./GitCloneRepoCard.module.scss";

export interface GitCloneRepoCardProps {
  onVaultSwitched: (newPath: string) => void;
}

function deriveRepoName(url: string): string {
  const clean = url.trim().replace(/\.git$/i, "");
  const parts = clean.split(/[/\\]/);
  return parts[parts.length - 1] || "";
}

export function GitCloneRepoCard({ onVaultSwitched }: GitCloneRepoCardProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [token, setToken] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setGitEnabled = useWorkspaceStore((s) => s.setGitEnabled);

  const handleBrowseDestination = async () => {
    try {
      const selected = await pickVaultFolder();
      if (!selected) return;
      const repoName = deriveRepoName(repoUrl);
      if (repoName && !selected.endsWith(repoName)) {
        setDestination(`${selected}/${repoName}`);
      } else {
        setDestination(selected);
      }
    } catch (err) {
      console.warn("Failed to pick destination folder:", err);
    }
  };

  const handleUrlChange = (val: string) => {
    setRepoUrl(val);
    if (!destination) {
      const repoName = deriveRepoName(val);
      if (repoName) {
        setDestination(repoName);
      }
    }
  };

  const handleClone = async () => {
    if (!repoUrl.trim() || !destination.trim() || isCloning) return;
    setIsCloning(true);
    setErrorMessage(null);

    try {
      const clonedPath = await cloneGitRepository(
        repoUrl.trim(),
        destination.trim(),
        token.trim() || undefined,
      );

      // Automatically enable Git manager for the newly cloned vault
      await setGitEnabled(true);

      // Switch to the newly cloned vault and close settings
      onVaultSwitched(clonedPath);
    } catch (err) {
      console.error("Failed to clone repository:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : String(err || "Failed to clone repository"),
      );
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <SettingsCard title="Open Vault from GitHub">
      <div className={styles["git-clone-card"]}>
        <Typography variant="text" size="xs" color="muted">
          Clone an existing GitHub repository to a local folder and open it as
          your active vault.
        </Typography>

        <div className={styles["git-clone-card__field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            GitHub Repository URL
          </Typography>
          <Input
            size="sm"
            aria-label="GitHub repository URL"
            value={repoUrl}
            disabled={isCloning}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://github.com/username/repository.git"
          />
        </div>

        <div className={styles["git-clone-card__field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Local Destination Folder
          </Typography>
          <div className={styles["git-clone-card__dest-row"]}>
            <div className={styles["git-clone-card__dest-input"]}>
              <Input
                size="sm"
                aria-label="Local destination folder"
                value={destination}
                disabled={isCloning}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="/path/to/local/vault"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleBrowseDestination()}
              disabled={isCloning}
              title="Browse destination folder"
            >
              <FolderOpen size={14} />
              <span>Browse</span>
            </Button>
          </div>
        </div>

        <div className={styles["git-clone-card__field"]}>
          <Typography variant="text" size="xs" color="muted" weight="medium">
            Personal Access Token (optional)
          </Typography>
          <Input
            size="sm"
            type="password"
            aria-label="Personal access token"
            value={token}
            disabled={isCloning}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_... (required for private repositories)"
          />
        </div>

        {errorMessage && (
          <div className={styles["git-clone-card__error"]}>
            <WarningCircle size={16} weight="fill" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className={styles["git-clone-card__actions"]}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleClone()}
            disabled={isCloning || !repoUrl.trim() || !destination.trim()}
          >
            {isCloning ? (
              <>
                <ArrowsClockwise size={14} className={styles["spin"]} />
                <span>Cloning Repository...</span>
              </>
            ) : (
              <span>Clone and Open Vault</span>
            )}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}

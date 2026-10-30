import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { GitRemoteSetupPanel } from "../GitRemoteSetupPanel";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { GitCloneRepoCard } from "./GitCloneRepoCard";
import styles from "./SettingsDialog.module.scss";

export interface GitSettingsTabProps {
  vaultPath: string | null;
  onVaultSwitched: (newPath: string) => void;
}

export function GitSettingsTab({ onVaultSwitched }: GitSettingsTabProps) {
  const gitEnabled = useWorkspaceStore((state) => state.gitEnabled);
  const setGitEnabled = useWorkspaceStore((state) => state.setGitEnabled);

  return (
    <div className={styles["settings-tab-content"]}>
      {/* 1. Open Vault from GitHub */}
      <GitCloneRepoCard onVaultSwitched={onVaultSwitched} />

      {/* 2. Current Vault Version Control */}
      <SettingsCard title="Current Vault Version Control">
        <SettingsRow
          title="Enable Git Source Control"
          description="Show Git Source Control in the icon rail and enable tracking for this vault."
        >
          <button
            type="button"
            className={`${styles["settings-toggle"]} ${
              gitEnabled ? styles["is-active"] : ""
            }`}
            onClick={() => void setGitEnabled(!gitEnabled)}
            role="switch"
            aria-checked={gitEnabled}
            aria-label="Toggle Git Source Control"
          >
            <span className={styles["settings-toggle-thumb"]} />
          </button>
        </SettingsRow>

        <GitRemoteSetupPanel />
      </SettingsCard>
    </div>
  );
}

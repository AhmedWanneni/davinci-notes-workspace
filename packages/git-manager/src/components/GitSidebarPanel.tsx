import { useEffect } from "react";
import { GitBranch, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { GitEmptyState } from "./GitEmptyState";
import styles from "./GitSidebarPanel.module.scss";

export function GitSidebarPanel() {
  const {
    repoInfo,
    isLoading,
    refreshRepoInfo,
    initializeRepo,
  } = useGitManagerStore();

  useEffect(() => {
    void refreshRepoInfo();
  }, [refreshRepoInfo]);

  if (isLoading && !repoInfo) {
    return (
      <div className={styles["git-sidebar-panel"]}>
        <div className={styles["git-sidebar-panel__loading"]}>
          Loading repository info...
        </div>
      </div>
    );
  }

  if (!repoInfo?.gitAvailable) {
    return (
      <div className={styles["git-sidebar-panel"]}>
        <GitEmptyState type="not-installed" />
      </div>
    );
  }

  if (!repoInfo?.isRepo) {
    return (
      <div className={styles["git-sidebar-panel"]}>
        <GitEmptyState
          type="not-repo"
          onInitialize={initializeRepo}
          isInitializing={isLoading}
        />
      </div>
    );
  }

  return (
    <div className={styles["git-sidebar-panel"]} data-testid="git-sidebar-panel">
      <header className={styles["git-sidebar-panel__header"]}>
        <div className={styles["git-sidebar-panel__branch-info"]}>
          <GitBranch size={16} weight="regular" className={styles["git-sidebar-panel__branch-icon"]} />
          <span className={styles["git-sidebar-panel__branch-name"]}>
            {repoInfo.branch || (repoInfo.isDetached ? "Detached HEAD" : "main")}
          </span>
        </div>
        <div className={styles["git-sidebar-panel__actions"]}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refreshRepoInfo()}
            disabled={isLoading}
            aria-label="Refresh Git status"
          >
            <ArrowsClockwise size={14} weight="regular" />
          </Button>
        </div>
      </header>

      <div className={styles["git-sidebar-panel__content"]}>
        {repoInfo.isEmpty && <GitEmptyState type="no-commits" />}
      </div>
    </div>
  );
}

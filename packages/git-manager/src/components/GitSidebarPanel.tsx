import { useEffect, useRef } from "react";
import { GitBranch, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { listenToGitChanges } from "../api/gitClient";
import { GitEmptyState } from "./GitEmptyState";
import { GitChangesList } from "./GitChangesList";
import styles from "./GitSidebarPanel.module.scss";

export function GitSidebarPanel() {
  const {
    repoInfo,
    staged,
    unstaged,
    conflicts,
    isLoading,
    refreshRepoInfo,
    refreshStatus,
    initializeRepo,
  } = useGitManagerStore();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void refreshRepoInfo();
  }, [refreshRepoInfo]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listenToGitChanges(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void refreshStatus();
      }, 200);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      unlisten?.();
    };
  }, [refreshStatus]);

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
            onClick={() => {
              void refreshRepoInfo();
              void refreshStatus();
            }}
            disabled={isLoading}
            aria-label="Refresh Git status"
          >
            <ArrowsClockwise size={14} weight="regular" />
          </Button>
        </div>
      </header>

      <div className={styles["git-sidebar-panel__content"]}>
        {repoInfo.isEmpty && staged.length === 0 && unstaged.length === 0 ? (
          <GitEmptyState type="no-commits" />
        ) : (
          <GitChangesList
            staged={staged}
            unstaged={unstaged}
            conflicts={conflicts}
          />
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { GitBranch, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { listenToGitChanges } from "../api/gitClient";
import { GitEmptyState } from "./GitEmptyState";
import { GitCommitBox } from "./GitCommitBox";
import { GitChangesList } from "./GitChangesList";
import { GitDiffViewer } from "./GitDiffViewer";
import { GitHistoryGraph } from "./GitHistoryGraph";
import { GitCommitDetailSheet } from "./GitCommitDetailSheet";
import styles from "./GitSidebarPanel.module.scss";

export function GitSidebarPanel() {
  const {
    repoInfo,
    staged,
    unstaged,
    conflicts,
    activeDiff,
    graphNodes,
    activeCommitDetail,
    viewMode,
    isLoading,
    setViewMode,
    refreshRepoInfo,
    refreshStatus,
    initializeRepo,
    openDiff,
    closeDiff,
    fetchHistory,
    openCommitDetail,
    closeCommitDetail,
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

  if (activeDiff) {
    return (
      <div className={styles["git-sidebar-panel"]} data-testid="git-sidebar-panel">
        <GitDiffViewer diff={activeDiff} onClose={closeDiff} />
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

      <div className={styles["git-sidebar-panel__view-tabs"]}>
        <Button
          variant={viewMode === "changes" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("changes")}
        >
          Changes
        </Button>
        <Button
          variant={viewMode === "history" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            setViewMode("history");
            void fetchHistory();
          }}
        >
          History
        </Button>
      </div>

      <div className={styles["git-sidebar-panel__content"]}>
        {viewMode === "history" ? (
          activeCommitDetail ? (
            <GitCommitDetailSheet
              detail={activeCommitDetail}
              onClose={closeCommitDetail}
              onSelectFile={(path) => void openDiff(path, true)}
            />
          ) : (
            <GitHistoryGraph
              nodes={graphNodes}
              onSelectCommit={(node) => void openCommitDetail(node.commit.hash)}
            />
          )
        ) : repoInfo.isEmpty && staged.length === 0 && unstaged.length === 0 ? (
          <GitEmptyState type="no-commits" />
        ) : (
          <>
            <GitCommitBox />
            <GitChangesList
              staged={staged}
              unstaged={unstaged}
              conflicts={conflicts}
              onSelectFile={(change) => void openDiff(change.path, change.staged)}
            />
          </>
        )}
      </div>
    </div>
  );
}

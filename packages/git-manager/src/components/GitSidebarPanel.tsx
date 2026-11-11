import { useEffect, useRef, useState } from "react";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { listenToGitChanges } from "../api/gitClient";
import { GitEmptyState } from "./GitEmptyState";
import { GitDiffViewer } from "./GitDiffViewer";
import { GitCommitDetailSheet } from "./GitCommitDetailSheet";
import { GitChangesSection } from "./GitChangesSection";
import { GitGraphSection } from "./GitGraphSection";
import { GitConflictResolver } from "./GitConflictResolver";
import { useGitConflictStore } from "../store/useGitConflictStore";
import type { GitFileChange } from "../types/gitTypes";
import styles from "./GitSidebarPanel.module.scss";

export interface GitSidebarPanelProps {
  onOpenDiff?: (change: GitFileChange) => void;
}

export function GitSidebarPanel({ onOpenDiff }: GitSidebarPanelProps) {
  const {
    repoInfo,
    staged,
    unstaged,
    conflicts,
    activeDiff,
    graphNodes,
    activeCommitDetail,
    isLoading,
    refreshRepoInfo,
    refreshStatus,
    initializeRepo,
    openDiff,
    closeDiff,
    fetchHistory,
    openCommitDetail,
    closeCommitDetail,
  } = useGitManagerStore();

  const [isChangesOpen, setIsChangesOpen] = useState(true);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const activeConflict = useGitConflictStore((s) => s.activeConflict);
  const openConflict = useGitConflictStore((s) => s.openConflict);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void refreshRepoInfo();
    void fetchHistory();
  }, [refreshRepoInfo, fetchHistory]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void listenToGitChanges(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        void refreshStatus();
        void fetchHistory();
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
  }, [refreshStatus, fetchHistory]);

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

  if (activeConflict) {
    return (
      <div
        className={styles["git-sidebar-panel"]}
        data-testid="git-sidebar-panel"
      >
        <GitConflictResolver />
      </div>
    );
  }

  // Fallback for standalone / unit tests when onOpenDiff is not supplied
  if (!onOpenDiff && activeDiff) {
    return (
      <div
        className={styles["git-sidebar-panel"]}
        data-testid="git-sidebar-panel"
      >
        <GitDiffViewer diff={activeDiff} onClose={closeDiff} />
      </div>
    );
  }

  const handleSelectFile = (change: GitFileChange) => {
    if (change.statusCode === "U") {
      void openConflict(change.path);
    } else if (onOpenDiff) {
      onOpenDiff(change);
    } else {
      void openDiff(change.path, change.staged);
    }
  };

  const handleRefresh = () => {
    void refreshRepoInfo();
    void refreshStatus();
    void fetchHistory();
  };

  return (
    <div
      className={styles["git-sidebar-panel"]}
      data-testid="git-sidebar-panel"
    >
      {/* 1. CHANGES SECTION */}
      <GitChangesSection
        isOpen={isChangesOpen}
        onToggle={() => setIsChangesOpen((prev) => !prev)}
        staged={staged}
        unstaged={unstaged}
        conflicts={conflicts}
        onRefresh={handleRefresh}
        onSelectFile={handleSelectFile}
        onToggleGraph={() => setIsGraphOpen((prev) => !prev)}
      />

      {/* 2. GRAPH SECTION (toggleable via header branch/graph icon) */}
      {isGraphOpen && (
        <GitGraphSection
          nodes={graphNodes}
          branch={repoInfo.branch ?? ""}
          isDetached={repoInfo.isDetached}
          onRefresh={handleRefresh}
          onSelectCommit={(node) => void openCommitDetail(node.commit.hash)}
        />
      )}

      {/* Commit Detail Sheet overlay if commit selected */}
      {activeCommitDetail && (
        <GitCommitDetailSheet
          detail={activeCommitDetail}
          onClose={closeCommitDetail}
          onSelectFile={(path) => {
            if (onOpenDiff) {
              onOpenDiff({
                path,
                staged: false,
                statusCode: "M",
              });
            } else {
              void openDiff(path, true);
            }
          }}
        />
      )}
    </div>
  );
}

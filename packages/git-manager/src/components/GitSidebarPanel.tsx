import { useEffect, useRef, useState } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
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
  const [isAgentReviewOpen, setIsAgentReviewOpen] = useState(false);
  const [isGitlensOpen, setIsGitlensOpen] = useState(false);

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
      />

      {/* 2. AGENT REVIEW SECTION */}
      <div className={styles["git-accordion-section"]}>
        <div
          className={styles["git-accordion-header"]}
          onClick={() => setIsAgentReviewOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
        >
          <div className={styles["git-accordion-title"]}>
            {isAgentReviewOpen ? (
              <CaretDown size={12} />
            ) : (
              <CaretRight size={12} />
            )}
            <span>Agent Review</span>
          </div>
        </div>
        {isAgentReviewOpen && (
          <div className={styles["git-placeholder-body"]}>
            No AI reviews pending.
          </div>
        )}
      </div>

      {/* 3. GRAPH SECTION */}
      <GitGraphSection
        nodes={graphNodes}
        branch={repoInfo.branch}
        isDetached={repoInfo.isDetached}
        onRefresh={handleRefresh}
        onSelectCommit={(node) => void openCommitDetail(node.commit.hash)}
      />

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

      {/* 4. GITLENS SECTION */}
      <div className={styles["git-accordion-section"]}>
        <div
          className={styles["git-accordion-header"]}
          onClick={() => setIsGitlensOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
        >
          <div className={styles["git-accordion-title"]}>
            {isGitlensOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
            <span>GitLens</span>
          </div>
        </div>
        {isGitlensOpen && (
          <div className={styles["git-placeholder-body"]}>
            GitLens inspections active.
          </div>
        )}
      </div>
    </div>
  );
}

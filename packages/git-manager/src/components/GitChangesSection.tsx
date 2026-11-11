import {
  CaretDown,
  CaretRight,
  ListDashes,
  SquareSplitHorizontal,
  Sparkle,
  DownloadSimple,
  GitFork,
  Check,
  ArrowClockwise,
  DotsThree,
} from "@phosphor-icons/react";
import type { GitFileChange } from "../types/gitTypes";
import { useGitSyncStore } from "../store/useGitSyncStore";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { GitCommitBox } from "./GitCommitBox";
import { GitChangesList } from "./GitChangesList";
import styles from "./GitSidebarPanel.module.scss";

export interface GitChangesSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  conflicts: GitFileChange[];
  onRefresh: () => void;
  onSelectFile: (change: GitFileChange) => void;
  onToggleGraph?: () => void;
}

export function GitChangesSection({
  isOpen,
  onToggle,
  staged,
  unstaged,
  conflicts,
  onRefresh,
  onSelectFile,
  onToggleGraph,
}: GitChangesSectionProps) {
  const { pull, isSyncing } = useGitSyncStore();
  const { stagePaths } = useGitManagerStore();

  const handlePull = async () => {
    await pull();
    onRefresh();
  };

  const handleOpenAllChanges = () => {
    const first = unstaged[0] || staged[0] || conflicts[0];
    if (first) onSelectFile(first);
  };

  return (
    <div className={styles["git-accordion-section"]}>
      <div
        className={styles["git-accordion-header"]}
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <div className={styles["git-accordion-title"]}>
          {isOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
          <span>CHANGES</span>
        </div>
        <div
          className={styles["git-accordion-actions"]}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={styles["toolbar-btn"]}
            title="View as Tree / List"
            aria-label="View as Tree / List"
          >
            <ListDashes size={16} />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={handleOpenAllChanges}
            title="Open All Changes"
            aria-label="Open All Changes"
          >
            <SquareSplitHorizontal size={16} />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            title="Generate Commit Message"
            aria-label="Generate Commit Message"
          >
            <Sparkle size={16} />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={() => void handlePull()}
            disabled={isSyncing}
            title="Pull Changes"
            aria-label="Pull Changes"
          >
            <DownloadSimple
              size={16}
              className={isSyncing ? styles["spin"] : undefined}
            />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={onToggleGraph}
            title="Toggle Git Graph"
            aria-label="Toggle Git Graph"
          >
            <GitFork size={16} />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={() => {
              const btn = document.querySelector<HTMLButtonElement>(
                '[data-testid="git-commit-submit-btn"]',
              );
              btn?.click();
            }}
            title="Commit"
            aria-label="Commit"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={onRefresh}
            title="Refresh"
            aria-label="Refresh"
          >
            <ArrowClockwise size={16} />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={() => void stagePaths([])}
            title="More Actions"
            aria-label="More Actions"
          >
            <DotsThree size={16} weight="bold" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={styles["git-accordion-body"]}>
          <GitCommitBox />
          <GitChangesList
            staged={staged}
            unstaged={unstaged}
            conflicts={conflicts}
            onSelectFile={onSelectFile}
          />
        </div>
      )}
    </div>
  );
}

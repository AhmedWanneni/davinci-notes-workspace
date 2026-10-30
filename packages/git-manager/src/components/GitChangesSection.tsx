import { CaretDown, CaretRight, ArrowsClockwise } from "@phosphor-icons/react";
import type { GitFileChange } from "../types/gitTypes";
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
}

export function GitChangesSection({
  isOpen,
  onToggle,
  staged,
  unstaged,
  conflicts,
  onRefresh,
  onSelectFile,
}: GitChangesSectionProps) {
  return (
    <div className={styles["git-accordion-section"]}>
      <div
        className={styles["git-accordion-header"]}
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <div className={styles["git-accordion-title"]}>
          {isOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
          <span>Changes</span>
        </div>
        <div
          className={styles["git-accordion-actions"]}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={onRefresh}
            title="Refresh"
            aria-label="Refresh"
          >
            <ArrowsClockwise size={13} />
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

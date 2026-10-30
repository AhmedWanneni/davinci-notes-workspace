import { useState } from "react";
import {
  CaretDown,
  CaretRight,
  Crosshair,
  ArrowDown,
  ArrowUp,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import type { GitGraphNode } from "../types/gitTypes";
import { GitBranchSwitcher } from "./GitBranchSwitcher";
import { GitHistoryGraph } from "./GitHistoryGraph";
import { useGitSyncStore } from "../store/useGitSyncStore";
import styles from "./GitSidebarPanel.module.scss";

export interface GitGraphSectionProps {
  nodes: GitGraphNode[];
  branch: string;
  isDetached?: boolean;
  onRefresh: () => void;
  onSelectCommit?: (node: GitGraphNode) => void;
}

export function GitGraphSection({
  nodes,
  branch,
  isDetached,
  onRefresh,
  onSelectCommit,
}: GitGraphSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { pull, push, isSyncing, refreshTracking } = useGitSyncStore();

  const handlePull = async () => {
    await pull();
    onRefresh();
  };

  const handlePush = async () => {
    await push();
    onRefresh();
  };

  return (
    <div className={styles["git-accordion-section"]}>
      <div
        className={styles["git-accordion-header"]}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
      >
        <div className={styles["git-accordion-title"]}>
          {isOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
          <span>Graph</span>
        </div>

        <div
          className={styles["git-accordion-actions"]}
          onClick={(e) => e.stopPropagation()}
        >
          <span className={styles["auto-badge"]}>Auto</span>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            title="Focus Current Branch"
            aria-label="Focus Current Branch"
          >
            <Crosshair size={13} />
          </button>
          <GitBranchSwitcher
            currentBranch={branch || (isDetached ? "Detached HEAD" : "main")}
            onBranchSwitched={() => {
              onRefresh();
              void refreshTracking();
            }}
          />
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={() => void handlePull()}
            disabled={isSyncing}
            title="Pull"
            aria-label="Pull"
          >
            <ArrowDown
              size={13}
              className={isSyncing ? styles["spin"] : undefined}
            />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={() => void handlePush()}
            disabled={isSyncing}
            title="Push"
            aria-label="Push"
          >
            <ArrowUp
              size={13}
              className={isSyncing ? styles["spin"] : undefined}
            />
          </button>
          <button
            type="button"
            className={styles["toolbar-btn"]}
            onClick={onRefresh}
            title="Refresh Graph"
            aria-label="Refresh Graph"
          >
            <ArrowsClockwise size={13} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={styles["git-graph-body"]}>
          <GitHistoryGraph
            nodes={nodes}
            showHeader={false}
            onSelectCommit={onSelectCommit}
          />
        </div>
      )}
    </div>
  );
}

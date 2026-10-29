import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { GitGraphNode } from "../types/gitTypes";
import styles from "./GitHistoryGraph.module.scss";

export interface GitHistoryGraphProps {
  nodes: GitGraphNode[];
  selectedHash?: string;
  showHeader?: boolean;
  onSelectCommit?: (node: GitGraphNode) => void;
}

const LANE_COLORS = [
  "var(--color-text-accent)",
  "var(--color-text-warning)",
  "var(--color-text-success)",
  "var(--color-text-info, #3b82f6)",
  "var(--color-text-purple, #a855f7)",
];

export function GitHistoryGraph({
  nodes,
  selectedHash,
  showHeader = true,
  onSelectCommit,
}: GitHistoryGraphProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10,
    initialRect: { width: 400, height: 600 },
  });

  const maxLane = nodes.reduce((max, n) => Math.max(max, n.lane), 0);
  const svgWidth = Math.max((maxLane + 1) * 16 + 8, 24);

  return (
    <div
      className={styles["git-history-graph"]}
      data-testid="git-history-graph"
    >
      {showHeader && (
        <header className={styles["git-history-graph__header"]}>
          <span>Commit History ({nodes.length})</span>
        </header>
      )}

      <div ref={parentRef} className={styles["git-history-graph__viewport"]}>
        <div
          className={styles["git-history-graph__inner"]}
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const node = nodes[virtualRow.index];
            const isSelected = selectedHash === node.commit.hash;
            const nodeX = node.lane * 16 + 10;
            const nodeColor = LANE_COLORS[node.lane % LANE_COLORS.length];
            const shortHash = node.commit.hash.slice(0, 7);

            return (
              <div
                key={node.commit.hash}
                className={`${styles["git-history-row"]} ${
                  isSelected ? styles["is-selected"] : ""
                }`}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onSelectCommit?.(node)}
                data-testid={`git-commit-row-${shortHash}`}
              >
                <svg
                  className={styles["git-history-row__graph"]}
                  style={{ width: `${svgWidth}px` }}
                >
                  {/* Connection lines to parents */}
                  {node.connections.map((conn, cIdx) => {
                    const toX = conn.toLane * 16 + 10;
                    return (
                      <line
                        key={`conn-${cIdx}`}
                        x1={nodeX}
                        y1={14}
                        x2={toX}
                        y2={28}
                        stroke={nodeColor}
                        strokeWidth="1.5"
                      />
                    );
                  })}
                  {/* Commit node circle */}
                  <circle cx={nodeX} cy={14} r={4} fill={nodeColor} />
                </svg>

                <div className={styles["git-history-row__content"]}>
                  {node.commit.refs && (
                    <span className={styles["git-history-row__refs"]}>
                      [{node.commit.refs}]
                    </span>
                  )}
                  <span
                    className={styles["git-history-row__subject"]}
                    title={node.commit.subject}
                  >
                    {node.commit.subject}
                  </span>
                </div>

                <div className={styles["git-history-row__meta"]}>
                  <span className={styles["git-history-row__author"]}>
                    {node.commit.authorName}
                  </span>
                  <span className={styles["git-history-row__hash"]}>
                    {shortHash}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  CaretDown,
  CaretRight,
  Sparkle,
  Clock,
  Play,
  Pause,
  ArrowClockwise,
} from "@phosphor-icons/react";
import type { RollingSummaryItem, SummaryInterval } from "../useLiveSummaries";
import styles from "../ListeningView.module.scss";

export interface RollingSummariesAccordionProps {
  summaries: RollingSummaryItem[];
  activeSummary: string;
  isSummarizing: boolean;
  statusMessage?: string | null;
  interval: SummaryInterval;
  isPaused: boolean;
  onIntervalChange: (interval: SummaryInterval) => void;
  onSummarizeNow: () => void;
  onTogglePause: () => void;
}

export function RollingSummariesAccordion({
  summaries,
  activeSummary,
  isSummarizing,
  statusMessage,
  interval,
  isPaused,
  onIntervalChange,
  onSummarizeNow,
  onTogglePause,
}: RollingSummariesAccordionProps) {
  // Only the latest summary is expanded by default; older ones are collapsed.
  // We do not auto-scroll or steal focus.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (summaries.length > 0) {
      const latest = summaries[summaries.length - 1];
      setExpandedId(latest.id);
    }
  }, [summaries.length]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles["rolling-summaries-container"]} data-testid="rolling-summaries-accordion">
      <div className={styles["summary-controls-row"]}>
        <div className={styles["interval-select-group"]}>
          <label htmlFor="summary-interval-select" className={styles["control-label"]}>
            <Clock size={12} />
            <span>Interval</span>
          </label>
          <select
            id="summary-interval-select"
            className={styles["interval-select"]}
            value={interval}
            onChange={(e) => onIntervalChange(e.target.value as SummaryInterval)}
            data-testid="summary-interval-select"
          >
            <option value="1m">1 min</option>
            <option value="2m">2 min (default)</option>
            <option value="5m">5 min</option>
            <option value="manual">Manual only</option>
          </select>
        </div>

        <div className={styles["summary-action-buttons"]}>
          <button
            type="button"
            className={styles["summary-tool-btn"]}
            onClick={onSummarizeNow}
            disabled={isSummarizing}
            title="Summarize now"
            data-testid="summarize-now-btn"
          >
            <ArrowClockwise size={13} className={isSummarizing ? styles["spin"] : ""} />
            <span>Summarize now</span>
          </button>
          <button
            type="button"
            className={
              isPaused
                ? `${styles["summary-tool-btn"]} ${styles["summary-tool-btn--active"]}`
                : styles["summary-tool-btn"]
            }
            onClick={onTogglePause}
            title={isPaused ? "Resume AI Listening" : "Pause AI Listening"}
            data-testid="toggle-pause-ai-btn"
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={styles["summary-status-banner"]} data-testid="summary-status-banner">
          <span>{statusMessage}</span>
        </div>
      )}

      <div className={styles["accordion-list"]}>
        {summaries.length === 0 ? (
          <div className={styles["empty-summary-placeholder"]}>
            <Sparkle size={15} />
            <span>
              {isSummarizing
                ? "Synthesizing first live summary segment..."
                : isPaused
                  ? "AI summaries paused."
                  : "Live summaries generate every " + interval + " when speech is detected."}
            </span>
          </div>
        ) : (
          summaries.map((item, index) => {
            const isLatest = index === summaries.length - 1;
            const isExpanded = expandedId === item.id;
            const displayTime =
              item.timeRange ||
              (item as any).timeLabel ||
              "Interval summary";

            return (
              <div
                key={item.id}
                className={
                  isLatest
                    ? `${styles["summary-card"]} ${styles["summary-card--latest"]}`
                    : styles["summary-card"]
                }
                data-testid={`summary-item-${item.id}`}
              >
                <button
                  type="button"
                  className={styles["summary-card-header"]}
                  onClick={() => toggleExpand(item.id)}
                  aria-expanded={isExpanded}
                >
                  <div className={styles["summary-card-title-group"]}>
                    {isExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                    <span className={styles["summary-time-badge"]}>{displayTime}</span>
                    {isLatest && <span className={styles["latest-tag"]}>Latest</span>}
                  </div>
                </button>

                {isExpanded && (
                  <div className={styles["summary-card-body"]}>
                    <p className={styles["summary-text"]}>
                      {isLatest && isSummarizing && !item.summary
                        ? activeSummary
                        : item.summary || (item as any).text}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatSummaryTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default RollingSummariesAccordion;

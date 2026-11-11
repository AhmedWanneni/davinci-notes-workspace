import React from "react";
import {
  Sparkle,
  PushPin,
  NotePencil,
  ChatCircleDots,
} from "@phosphor-icons/react";
import styles from "../ListeningView.module.scss";

export interface LiveSummaryCardProps {
  summary: string;
  isStreaming?: boolean;
  onChipClick?: (prompt: string) => void;
}

export function LiveSummaryCard({
  summary,
  isStreaming = false,
  onChipClick,
}: LiveSummaryCardProps) {
  return (
    <div
      className={styles["live-summary-card"]}
      data-testid="live-summary-card"
    >
      <div className={styles["live-summary-card__header"]}>
        <div className={styles["live-summary-card__sparkle"]}>
          <Sparkle size={20} weight="fill" />
        </div>
        <div className={styles["live-summary-card__greeting"]}>
          <h3 className={styles["greeting-title"]}>Hi AHMED!</h3>
          <p className={styles["greeting-subtitle"]}>
            Get ready for your meeting
          </p>
        </div>
      </div>

      <div className={styles["live-summary-card__body"]}>
        {summary ? (
          <p className={styles["live-summary-card__text"]}>
            {summary}
            {isStreaming && <span className={styles["cursor-pulse"]}>▋</span>}
          </p>
        ) : (
          <p className={styles["live-summary-card__placeholder"]}>
            {isStreaming
              ? "Listening to conversation and synthesizing live summary..."
              : "Live summary will generate automatically as the conversation progresses."}
          </p>
        )}
      </div>

      <div className={styles["quick-action-chips"]}>
        <button
          type="button"
          className={styles["action-chip"]}
          onClick={() =>
            onChipClick?.("Identify key initiatives from this discussion")
          }
        >
          <PushPin size={13} weight="fill" />
          <span>Key initiatives</span>
        </button>

        <button
          type="button"
          className={styles["action-chip"]}
          onClick={() => onChipClick?.("Summarize this meeting channel so far")}
        >
          <NotePencil size={13} weight="fill" />
          <span>Summarize the channel</span>
        </button>

        <button
          type="button"
          className={styles["action-chip"]}
          onClick={() =>
            onChipClick?.("Extract product feedback from this meeting")
          }
        >
          <ChatCircleDots size={13} weight="fill" />
          <span>Product feedback</span>
        </button>
      </div>
    </div>
  );
}

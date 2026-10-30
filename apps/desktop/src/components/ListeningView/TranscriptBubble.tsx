import React from "react";
import type { TranscriptSegmentItem } from "./listeningTypes";
import styles from "./ListeningView.module.scss";

export interface TranscriptBubbleProps {
  segment: TranscriptSegmentItem;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function TranscriptBubble({ segment }: TranscriptBubbleProps) {
  const isMe = segment.speaker === "me";
  const speakerLabel = isMe
    ? "You"
    : segment.speaker === "meeting"
      ? "Meeting"
      : "System";

  return (
    <article
      className={`${styles["transcript-bubble"]} ${isMe ? styles["transcript-bubble--me"] : styles["transcript-bubble--other"]}`}
      data-testid="transcript-bubble"
    >
      <header className={styles["transcript-bubble__meta"]}>
        <span className={styles["transcript-bubble__speaker"]}>
          {speakerLabel}
        </span>
        <time className={styles["transcript-bubble__time"]}>
          {formatTimestamp(segment.startMs)}
        </time>
        {!segment.isFinal && (
          <span
            className={styles["transcript-bubble__streaming-dot"]}
            title="Transcribing..."
          />
        )}
      </header>
      <p className={styles["transcript-bubble__text"]}>{segment.text}</p>
    </article>
  );
}

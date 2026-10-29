import React, { useEffect, useRef } from "react";
import { Broadcast } from "@phosphor-icons/react";
import type { TranscriptSegmentItem } from "./listeningTypes";
import { TranscriptBubble } from "./TranscriptBubble";
import styles from "./ListeningView.module.scss";

export interface TranscriptFeedProps {
  segments: TranscriptSegmentItem[];
  isRecording: boolean;
}

export function TranscriptFeed({ segments, isRecording }: TranscriptFeedProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [segments.length]);

  if (segments.length === 0) {
    return (
      <div
        className={styles["transcript-feed__empty"]}
        data-testid="transcript-empty-state"
      >
        <Broadcast
          size={32}
          weight="light"
          className={styles["transcript-feed__empty-icon"]}
        />
        <h3 className={styles["transcript-feed__empty-title"]}>
          {isRecording ? "Listening to conversation..." : "Ready to listen"}
        </h3>
        <p className={styles["transcript-feed__empty-desc"]}>
          {isRecording
            ? "Live transcription will appear here in real-time as participants speak."
            : "Click 'Start Recording' to capture microphone and system audio with real-time transcription."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles["transcript-feed"]}
      role="feed"
      aria-label="Live meeting transcript"
    >
      {segments.map((seg) => (
        <TranscriptBubble key={seg.id} segment={seg} />
      ))}
      <div ref={scrollEndRef} />
    </div>
  );
}

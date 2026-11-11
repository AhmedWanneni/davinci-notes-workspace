import React, { useEffect, useRef, useState, useCallback } from "react";
import { Broadcast, ArrowDown } from "@phosphor-icons/react";
import type { TranscriptSegmentItem } from "./listeningTypes";
import { TranscriptBubble } from "./TranscriptBubble";
import styles from "./ListeningView.module.scss";

export interface TranscriptFeedProps {
  segments: TranscriptSegmentItem[];
  isRecording: boolean;
  className?: string;
}

export function TranscriptFeed({
  segments,
  isRecording,
  className = "",
}: TranscriptFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const userScrolledUpRef = useRef(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrolledUp = distanceToBottom > 45;
    userScrolledUpRef.current = scrolledUp;
    setIsScrolledUp(scrolledUp);
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      scrollEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    }
  }, [segments.length]);

  const scrollToBottom = () => {
    userScrolledUpRef.current = false;
    setIsScrolledUp(false);
    scrollEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  };

  if (segments.length === 0) {
    return (
      <div
        className={`${styles["transcript-feed__empty"]} ${className}`}
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
            ? "Live transcription segments stream here in real time as participants speak."
            : "Turn on the microphone to begin live speech-to-text capture."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles["transcript-feed-wrapper"]}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`${styles["transcript-feed"]} ${className}`}
        role="feed"
        aria-label="Live meeting transcript"
        data-testid="transcript-feed-container"
      >
        {segments.map((seg) => (
          <TranscriptBubble key={seg.id} segment={seg} />
        ))}
        <div ref={scrollEndRef} />
      </div>

      {isScrolledUp && (
        <button
          type="button"
          className={styles["jump-to-latest-btn"]}
          onClick={scrollToBottom}
          data-testid="jump-to-latest-btn"
        >
          <ArrowDown size={12} weight="bold" />
          <span>Latest transcript</span>
        </button>
      )}
    </div>
  );
}

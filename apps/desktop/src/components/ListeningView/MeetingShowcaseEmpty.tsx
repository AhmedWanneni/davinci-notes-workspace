import React from "react";
import { Record } from "@phosphor-icons/react";
import styles from "./ListeningView.module.scss";

export interface MeetingShowcaseEmptyProps {
  onStartRecording?: () => void;
}

export function MeetingShowcaseEmpty({
  onStartRecording,
}: MeetingShowcaseEmptyProps) {
  return (
    <div
      className={styles["meeting-empty-showcase"]}
      data-testid="meeting-empty-showcase"
    >
      <div className={styles["chat-bubble-previews"]}>
        <div className={styles["preview-bubble"]}>
          <span className={styles["preview-avatar"]}>K</span>
          <div className={styles["preview-lines"]}>
            <span className={styles["line-long"]} />
            <span className={styles["line-short"]} />
          </div>
        </div>
        <div
          className={`${styles["preview-bubble"]} ${styles["preview-bubble--wide"]}`}
        >
          <span className={styles["preview-avatar"]}>A</span>
          <div className={styles["preview-lines"]}>
            <span className={styles["line-full"]} />
            <span className={styles["line-med"]} />
          </div>
        </div>
        <div className={styles["preview-bubble"]}>
          <span className={styles["preview-avatar"]}>R</span>
          <div className={styles["preview-lines"]}>
            <span className={styles["line-long"]} />
          </div>
        </div>
      </div>

      <h2 className={styles["showcase-title"]}>
        Let a voice agent take your meetings
      </h2>
      <p className={styles["showcase-subtitle"]}>
        Create a voice agent to attend meetings on your behalf, or explore
        existing agents.
      </p>

      {onStartRecording && (
        <button
          type="button"
          className={`${styles["btn"]} ${styles["btn--primary"]}`}
          onClick={onStartRecording}
          style={{ marginTop: "var(--space-3)" }}
          data-testid="showcase-start-recording-btn"
        >
          <Record size={16} weight="fill" />
          <span>Start Recording</span>
        </button>
      )}
    </div>
  );
}

import React from "react";
import { Record, Pause, Play, Stop, Trash } from "@phosphor-icons/react";
import type { ListeningStatus } from "./listeningConstants";
import { AudioMeter } from "./AudioMeter";
import styles from "./ListeningView.module.scss";

export interface ListeningHeaderProps {
  status: ListeningStatus;
  title: string;
  durationMs: number;
  micLevel: number;
  systemLevel: number;
  onTitleChange: (title: string) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function ListeningHeader({
  status,
  title,
  durationMs,
  micLevel,
  systemLevel,
  onTitleChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: ListeningHeaderProps) {
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isProcessing = status === "processing";
  const isLive = isRecording || isPaused;

  return (
    <header className={styles["listening-header"]}>
      <div className={styles["listening-header__meta"]}>
        <input
          type="text"
          className={styles["listening-header__title-input"]}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Meeting title..."
          aria-label="Meeting Title"
          disabled={isProcessing}
        />

        <div className={styles["listening-header__status-badge"]}>
          {isRecording && (
            <span
              className={`${styles["status-pill"]} ${styles["status-pill--recording"]}`}
            >
              <span className={styles["status-pill__dot"]} />
              REC {formatDuration(durationMs)}
            </span>
          )}
          {isPaused && (
            <span
              className={`${styles["status-pill"]} ${styles["status-pill--paused"]}`}
            >
              PAUSED {formatDuration(durationMs)}
            </span>
          )}
          {status === "idle" && (
            <span
              className={`${styles["status-pill"]} ${styles["status-pill--idle"]}`}
            >
              IDLE
            </span>
          )}
          {isProcessing && (
            <span
              className={`${styles["status-pill"]} ${styles["status-pill--processing"]}`}
            >
              SAVING...
            </span>
          )}
        </div>
      </div>

      <div className={styles["listening-header__controls"]}>
        {isLive && (
          <AudioMeter
            micLevel={micLevel}
            systemLevel={systemLevel}
            isRecording={isRecording}
          />
        )}

        {status === "idle" && (
          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--primary"]}`}
            onClick={onStart}
            data-testid="start-recording-btn"
          >
            <Record size={16} weight="fill" />
            <span>Start Recording</span>
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--secondary"]}`}
            onClick={onPause}
            title="Pause recording"
            data-testid="pause-recording-btn"
          >
            <Pause size={16} weight="bold" />
            <span>Pause</span>
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--secondary"]}`}
            onClick={onResume}
            title="Resume recording"
            data-testid="resume-recording-btn"
          >
            <Play size={16} weight="bold" />
            <span>Resume</span>
          </button>
        )}

        {isLive && (
          <>
            <button
              type="button"
              className={`${styles["btn"]} ${styles["btn--danger-text"]}`}
              onClick={onStop}
              title="Stop and save notes"
              data-testid="stop-recording-btn"
            >
              <Stop size={16} weight="fill" />
              <span>Stop & Save</span>
            </button>
            <button
              type="button"
              className={`${styles["btn"]} ${styles["btn--ghost"]}`}
              onClick={onDiscard}
              title="Discard recording"
              data-testid="discard-recording-btn"
            >
              <Trash size={16} weight="regular" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

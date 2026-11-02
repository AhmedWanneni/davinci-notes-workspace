import React from "react";
import { Record, Pause, Play, Stop, Trash } from "@phosphor-icons/react";
import type { ListeningStatus } from "./listeningConstants";
import styles from "./ListeningView.module.scss";

export interface VisualizerControlsProps {
  status: ListeningStatus;
  isRecording: boolean;
  isPaused: boolean;
  isLive: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
}

export function VisualizerControls({
  status,
  isRecording,
  isPaused,
  isLive,
  onStart,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: VisualizerControlsProps) {
  return (
    <div className={styles["audio-row-controls"]}>
      {status === "idle" && (
        <button
          type="button"
          className={`${styles["btn"]} ${styles["btn--primary"]}`}
          onClick={onStart}
          data-testid="start-recording-btn"
        >
          <Record size={16} weight="fill" />
          <span>Record</span>
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
            title="Stop and save note"
            data-testid="stop-recording-btn"
          >
            <Stop size={16} weight="fill" />
            <span>Stop</span>
          </button>
          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--ghost"]}`}
            onClick={onDiscard}
            title="Discard recording"
            data-testid="discard-recording-btn"
          >
            <Trash size={16} />
          </button>
        </>
      )}
    </div>
  );
}

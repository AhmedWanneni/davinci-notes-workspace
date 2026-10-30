import React from "react";
import styles from "./ListeningView.module.scss";

export interface AudioMeterProps {
  micLevel: number;
  systemLevel: number;
  isRecording: boolean;
  className?: string;
}

export function AudioMeter({
  micLevel,
  systemLevel,
  isRecording,
  className,
}: AudioMeterProps) {
  // Clamp levels between 0 and 1
  const clampedMic = isRecording ? Math.min(1, Math.max(0, micLevel)) : 0;
  const clampedSystem = isRecording ? Math.min(1, Math.max(0, systemLevel)) : 0;

  return (
    <div
      className={`${styles["audio-meter"]} ${className ?? ""}`}
      role="group"
      aria-label="Audio input level meters"
    >
      <div
        className={styles["audio-meter__channel"]}
        title={`Mic: ${Math.round(clampedMic * 100)}%`}
      >
        <span className={styles["audio-meter__label"]}>MIC</span>
        <div className={styles["audio-meter__track"]}>
          <div
            className={styles["audio-meter__fill"]}
            style={{ width: `${Math.round(clampedMic * 100)}%` }}
            aria-valuenow={Math.round(clampedMic * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>

      <div
        className={styles["audio-meter__channel"]}
        title={`Sys: ${Math.round(clampedSystem * 100)}%`}
      >
        <span className={styles["audio-meter__label"]}>SYS</span>
        <div className={styles["audio-meter__track"]}>
          <div
            className={styles["audio-meter__fill"]}
            style={{ width: `${Math.round(clampedSystem * 100)}%` }}
            aria-valuenow={Math.round(clampedSystem * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>
    </div>
  );
}

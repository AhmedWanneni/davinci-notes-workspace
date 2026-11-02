import React from "react";
import { Broadcast, Sparkle } from "@phosphor-icons/react";
import { Toggle } from "@app/design-system";
import type { ListeningStatus } from "./listeningConstants";
import { VisualizerControls } from "./VisualizerControls";
import styles from "./ListeningView.module.scss";

export interface ListeningVisualizerProps {
  status: ListeningStatus;
  title: string;
  durationMs: number;
  micLevel: number;
  systemLevel: number;
  isTranscriptVisible: boolean;
  isAIListeningActive: boolean;
  aiStatus?: "idle" | "streaming" | "throttled" | "error";
  aiError?: string | null;
  onTitleChange: (title: string) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
  onToggleTranscript: (checked: boolean) => void;
  onToggleAIListening: (checked: boolean) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function ListeningVisualizer({
  status,
  title,
  durationMs,
  micLevel,
  systemLevel,
  isTranscriptVisible,
  isAIListeningActive,
  aiStatus = "idle",
  aiError,
  onTitleChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onDiscard,
  onToggleTranscript,
  onToggleAIListening,
}: ListeningVisualizerProps) {
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isLive = isRecording || isPaused;

  // 48 acoustic waveform bars across full width
  const totalLevel = isRecording
    ? Math.min(1, Math.max(0.12, micLevel + systemLevel))
    : 0.05;

  // Progress ratio across waveform (sweeps live as recording progresses)
  const progressRatio = isLive
    ? Math.min(
        1,
        ((durationMs / 1000) % 60) / 60 || (durationMs > 0 ? 0.05 : 0),
      )
    : 0;

  const barHeights = Array.from({ length: 48 }, (_, i) => {
    if (!isRecording) {
      // Natural, elegant acoustic soundwave silhouette curve
      const idleWave =
        Math.sin((i / 48) * Math.PI * 3) * 5 +
        Math.cos((i / 48) * Math.PI) * 4 +
        10;
      return Math.round(Math.max(5, Math.min(26, idleWave)));
    }
    const wave = Math.sin((i / 48) * Math.PI) * totalLevel;
    const jitter = Math.sin(i * 1.5 + Date.now() / 200) * 0.25 * totalLevel;
    return Math.max(5, Math.min(28, Math.round((wave + jitter) * 28)));
  });

  return (
    <div
      className={styles["listening-visualizer"]}
      data-testid="listening-visualizer"
    >
      {/* Row 1: Title input on left, Transcript & AI Listening toggles on same row */}
      <div className={styles["listening-visualizer__top-row"]}>
        <div className={styles["listening-visualizer__title-wrapper"]}>
          <input
            type="text"
            className={styles["listening-visualizer__title-input"]}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Meeting title..."
            aria-label="Meeting Title"
          />
        </div>

        <div className={styles["listening-visualizer__options-row"]}>
          <div className={styles["toggle-control-item"]}>
            <Broadcast size={15} />
            <span className={styles["toggle-label"]}>Transcript</span>
            <Toggle
              checked={isTranscriptVisible}
              onCheckedChange={onToggleTranscript}
              aria-label="Toggle live transcript"
              data-testid="transcript-toggle"
            />
          </div>

          <div className={styles["toggle-control-item"]}>
            <Sparkle
              size={15}
              weight={isAIListeningActive ? "fill" : "regular"}
            />
            <span className={styles["toggle-label"]}>AI Listening</span>
            <Toggle
              checked={isAIListeningActive}
              onCheckedChange={onToggleAIListening}
              aria-label="Toggle AI Listening"
              data-testid="ai-listening-toggle"
            />
          </div>

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

          {isAIListeningActive && aiStatus === "streaming" && (
            <span className={styles["ai-status-indicator"]}>Streaming...</span>
          )}
          {isAIListeningActive && aiStatus === "error" && (
            <span className={styles["ai-status-indicator--error"]}>
              {aiError || "AI unavailable"}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Full-width audio recording bar with controls and live waveform progress */}
      <div className={styles["listening-visualizer__audio-row"]}>
        <VisualizerControls
          status={status}
          isRecording={isRecording}
          isPaused={isPaused}
          isLive={isLive}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
          onStop={onStop}
          onDiscard={onDiscard}
        />

        <div className={styles["audio-duration-badge"]}>
          {formatDuration(durationMs)}
        </div>

        {/* Full-width waveform track with live acoustic progress */}
        <div
          className={styles["full-width-waveform-container"]}
          aria-label="Live audio level waveform"
          data-testid="audio-waveform-bars"
        >
          <div className={styles["waveform-bars-track"]}>
            {barHeights.map((h, idx) => {
              const barRatio = idx / 48;
              const isPassed = isLive && barRatio <= progressRatio;
              return (
                <span
                  key={idx}
                  className={`${styles["waveform-bar"]} ${
                    isPassed
                      ? styles["is-passed"]
                      : isRecording
                        ? styles["is-active"]
                        : ""
                  }`}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>

          {isLive && (
            <div
              className={styles["waveform-progress-head"]}
              style={{ left: `${Math.round(progressRatio * 100)}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

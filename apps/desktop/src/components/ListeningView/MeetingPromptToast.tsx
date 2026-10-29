import React from "react";
import { Ear, X } from "@phosphor-icons/react";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import styles from "./MeetingPromptToast.module.scss";

export interface MeetingPromptToastProps {
  event: NormalizedCalendarEvent;
  onStartListening: (event: NormalizedCalendarEvent) => void;
  onDismiss: (eventId: string) => void;
}

export function MeetingPromptToast({
  event,
  onStartListening,
  onDismiss,
}: MeetingPromptToastProps) {
  return (
    <aside
      className={styles["meeting-prompt-toast"]}
      role="alert"
      aria-live="polite"
      data-testid="meeting-prompt-toast"
    >
      <div className={styles["meeting-prompt-toast__header"]}>
        <div className={styles["meeting-prompt-toast__icon-wrapper"]}>
          <Ear size={16} weight="bold" />
        </div>
        <div className={styles["meeting-prompt-toast__content"]}>
          <h4 className={styles["meeting-prompt-toast__title"]}>
            Meeting starting: {event.title || "Untitled"}
          </h4>
          <p className={styles["meeting-prompt-toast__subtitle"]}>
            Would you like DaVinci to listen and take notes?
          </p>
        </div>
        <button
          type="button"
          className={styles["meeting-prompt-toast__close-btn"]}
          onClick={() => onDismiss(event.id)}
          aria-label="Dismiss meeting prompt"
        >
          <X size={14} weight="regular" />
        </button>
      </div>

      <div className={styles["meeting-prompt-toast__actions"]}>
        <button
          type="button"
          className={`${styles["btn"]} ${styles["btn--primary"]}`}
          onClick={() => onStartListening(event)}
        >
          Take AI Notes
        </button>
        <button
          type="button"
          className={`${styles["btn"]} ${styles["btn--ghost"]}`}
          onClick={() => onDismiss(event.id)}
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}

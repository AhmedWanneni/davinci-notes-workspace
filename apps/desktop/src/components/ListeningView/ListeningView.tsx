import React, { useState } from "react";
import {
  Sparkle,
  CheckSquare,
  Link as LinkIcon,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { ListeningHeader } from "./ListeningHeader";
import { TranscriptFeed } from "./TranscriptFeed";
import { useListeningSession } from "./useListeningSession";
import styles from "./ListeningView.module.scss";

export interface ListeningViewProps {
  initialTitle?: string;
  onSaveToVault?: (title: string, markdown: string) => Promise<void>;
}

export function ListeningView({ initialTitle }: ListeningViewProps) {
  const {
    status,
    title,
    durationMs,
    micLevel,
    systemLevel,
    segments,
    setTitle,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
  } = useListeningSession(initialTitle);

  const [chatPrompt, setChatPrompt] = useState("");
  const isRecording = status === "recording";

  return (
    <section
      className={styles["listening-view"]}
      aria-label="AI Listening Session"
    >
      <ListeningHeader
        status={status}
        title={title}
        durationMs={durationMs}
        micLevel={micLevel}
        systemLevel={systemLevel}
        onTitleChange={setTitle}
        onStart={() => void startSession()}
        onPause={() => void pauseSession()}
        onResume={() => void resumeSession()}
        onStop={() => void stopSession()}
        onDiscard={() => void discardSession()}
      />

      <div className={styles["listening-view__body"]}>
        <div className={styles["listening-view__transcript-pane"]}>
          <div className={styles["pane-header"]}>
            <h2 className={styles["pane-header__title"]}>Live Transcript</h2>
            <span className={styles["pane-header__count"]}>
              {segments.length} {segments.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <TranscriptFeed segments={segments} isRecording={isRecording} />
        </div>

        <aside className={styles["listening-view__notes-pane"]}>
          <div className={styles["pane-header"]}>
            <div className={styles["pane-header__title-group"]}>
              <Sparkle
                size={16}
                weight="fill"
                className={styles["pane-header__sparkle"]}
              />
              <h2 className={styles["pane-header__title"]}>
                AI Notes & Grounding
              </h2>
            </div>
          </div>

          <div className={styles["listening-view__notes-content"]}>
            <div className={styles["notes-card"]}>
              <h3 className={styles["notes-card__title"]}>
                <CheckSquare size={14} weight="bold" />
                Action Items
              </h3>
              <p className={styles["notes-card__empty"]}>
                {isRecording
                  ? "Action items will be detected automatically..."
                  : "No action items identified yet."}
              </p>
            </div>

            <div className={styles["notes-card"]}>
              <h3 className={styles["notes-card__title"]}>
                <LinkIcon size={14} weight="bold" />
                Suggested Vault Links
              </h3>
              <p className={styles["notes-card__empty"]}>
                {isRecording
                  ? "Searching vault notes matching meeting context..."
                  : "Related notes will appear here as you discuss topics."}
              </p>
            </div>
          </div>

          <footer className={styles["listening-view__chat-footer"]}>
            <form
              className={styles["chat-input-form"]}
              onSubmit={(e) => {
                e.preventDefault();
                setChatPrompt("");
              }}
            >
              <input
                type="text"
                className={styles["chat-input-form__input"]}
                placeholder="Ask about this meeting or vault notes..."
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                aria-label="Meeting query"
              />
              <button
                type="submit"
                className={styles["chat-input-form__submit"]}
                disabled={!chatPrompt.trim()}
                aria-label="Send query"
              >
                <PaperPlaneRight size={14} weight="fill" />
              </button>
            </form>
          </footer>
        </aside>
      </div>
    </section>
  );
}

import React, { useState, useEffect } from "react";
import { Sparkle, CheckSquare, PaperPlaneRight } from "@phosphor-icons/react";
import { ListeningHeader } from "./ListeningHeader";
import { TranscriptFeed } from "./TranscriptFeed";
import { SuggestedLinksPanel } from "./SuggestedLinksPanel";
import { useListeningSession } from "./useListeningSession";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import styles from "./ListeningView.module.scss";

export interface ListeningViewProps {
  initialTitle?: string;
  initialAudioPath?: string;
  onNavigateToNote?: (path: string) => void;
}

export function ListeningView({
  initialTitle,
  initialAudioPath,
  onNavigateToNote,
}: ListeningViewProps) {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const {
    status,
    title,
    durationMs,
    micLevel,
    systemLevel,
    segments,
    suggestedLinks,
    actionItems,
    setTitle,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
    acceptLink,
    dismissLink,
    retranscribeAudio,
  } = useListeningSession(initialTitle);

  const [chatPrompt, setChatPrompt] = useState("");
  const isRecording = status === "recording";

  useEffect(() => {
    if (initialAudioPath) {
      void retranscribeAudio(initialAudioPath);
    }
  }, [initialAudioPath, retranscribeAudio]);

  useEffect(() => {
    const handleReRun = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      const audioPath = customEvent.detail?.path;
      if (audioPath) {
        void retranscribeAudio(audioPath);
      }
    };
    window.addEventListener("davinci:re-run-audio-transcription", handleReRun);
    return () => {
      window.removeEventListener(
        "davinci:re-run-audio-transcription",
        handleReRun,
      );
    };
  }, [retranscribeAudio]);

  const handleStopAndSave = async () => {
    const savedPath = await stopSession(allNotePaths);
    if (savedPath && onNavigateToNote) {
      onNavigateToNote(savedPath);
    }
  };

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
        onStop={() => void handleStopAndSave()}
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
                Action Items ({actionItems.length})
              </h3>
              {actionItems.length === 0 ? (
                <p className={styles["notes-card__empty"]}>
                  {isRecording
                    ? "Action items will be detected automatically..."
                    : "No action items identified yet."}
                </p>
              ) : (
                <ul
                  className={styles["suggested-links-list"]}
                  aria-label="Action items"
                >
                  {actionItems.map((item, idx) => (
                    <li key={idx} className={styles["suggested-link-item"]}>
                      <span className={styles["suggested-link-item__body"]}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <SuggestedLinksPanel
              links={suggestedLinks}
              isRecording={isRecording}
              onAccept={acceptLink}
              onDismiss={dismissLink}
            />
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

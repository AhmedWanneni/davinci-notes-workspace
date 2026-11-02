import React, { Suspense, useEffect } from "react";
import { FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { MeetingsSidebar } from "./MeetingsSidebar";
import { ListeningVisualizer } from "./ListeningVisualizer";
import { TranscriptFeed } from "./TranscriptFeed";
import { useListeningSession } from "./useListeningSession";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import styles from "./ListeningView.module.scss";

const LazyAIListeningPanel = React.lazy(() =>
  import("./AIListeningPanel").then((m) => ({ default: m.AIListeningPanel })),
);

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
    isTranscriptVisible,
    isAIListeningActive,
    liveSummary,
    answers,
    questions,
    aiStatus,
    aiError,
    setIsTranscriptVisible,
    setIsAIListeningActive,
    saveAnswer,
    dismissAnswer,
    saveQuestion,
    dismissQuestion,
    triggerAIStep,
    setTitle,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    discardSession,
    retranscribeAudio,
  } = useListeningSession(initialTitle);

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
    <div
      className={styles["recording-workspace"]}
      aria-label="Meeting Recording Workspace"
      data-testid="recording-workspace"
    >
      <MeetingsSidebar />

      <main className={styles["recording-main-col"]}>
        <div className={styles["recording-top-action-bar"]}>
          <button type="button" className={styles["action-bar-btn"]}>
            <FunnelSimple size={14} weight="bold" />
            <span>Filters</span>
          </button>
          <button
            type="button"
            className={styles["action-bar-icon-btn"]}
            aria-label="Search meetings"
          >
            <MagnifyingGlass size={16} />
          </button>
        </div>

        <ListeningVisualizer
          status={status}
          title={title}
          durationMs={durationMs}
          micLevel={micLevel}
          systemLevel={systemLevel}
          isTranscriptVisible={isTranscriptVisible}
          isAIListeningActive={isAIListeningActive}
          aiStatus={aiStatus}
          aiError={aiError}
          onTitleChange={setTitle}
          onStart={() => void startSession()}
          onPause={() => void pauseSession()}
          onResume={() => void resumeSession()}
          onStop={() => void handleStopAndSave()}
          onDiscard={() => void discardSession()}
          onToggleTranscript={setIsTranscriptVisible}
          onToggleAIListening={setIsAIListeningActive}
        />

        <div className={styles["recording-content-area"]}>
          {isTranscriptVisible ? (
            <TranscriptFeed segments={segments} isRecording={isRecording} />
          ) : (
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
                Create a voice agent to attend meetings on your behalf, or
                explore existing agents.
              </p>
            </div>
          )}
        </div>
      </main>

      {isAIListeningActive && (
        <Suspense
          fallback={
            <aside className={styles["ai-listening-panel--loading"]}>
              Loading AI Listening...
            </aside>
          }
        >
          <LazyAIListeningPanel
            summary={liveSummary}
            answers={answers}
            questions={questions}
            isStreaming={aiStatus === "streaming"}
            onSaveAnswer={saveAnswer}
            onDismissAnswer={dismissAnswer}
            onSaveQuestion={saveQuestion}
            onDismissQuestion={dismissQuestion}
            onSubmitPrompt={() => void triggerAIStep()}
          />
        </Suspense>
      )}
    </div>
  );
}
export default ListeningView;

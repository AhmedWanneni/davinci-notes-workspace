import React, { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { Broadcast } from "@phosphor-icons/react";
import { MeetingsSidebar } from "./MeetingsSidebar";
import { ListeningVisualizer } from "./ListeningVisualizer";
import { TranscriptFeed } from "./TranscriptFeed";
import { AllMeetingsView } from "./AllMeetingsView";
import { MeetingDetailView } from "./MeetingDetailView";
import { MeetingAssistantPanel } from "./MeetingAssistantPanel";
import { AIListeningPrivacyModal } from "./AIListeningPrivacyModal";
import { RecordingTopBar } from "./RecordingTopBar";
import { parseMeetingMarkdown, type ParsedMeetingItem } from "./meetingsParser";
import { useListeningSession } from "./useListeningSession";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { readNote } from "../../vault/vaultCommands";
import styles from "./ListeningView.module.scss";

const LazyAIListeningPanel = React.lazy(() =>
  import("./AIListeningPanel").then((m) => ({ default: m.AIListeningPanel })),
);

export interface ListeningViewProps {
  initialTitle?: string;
  initialAudioPath?: string;
  onNavigateToNote?: (path: string) => void;
  onOpenSettings?: () => void;
}

export function ListeningView({
  initialTitle,
  initialAudioPath,
  onNavigateToNote,
  onOpenSettings,
}: ListeningViewProps) {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const vaultPath = useWorkspaceStore((state) => state.vaultPath);

  const [currentView, setCurrentView] = useState<"record" | "all-meetings" | "detail">("record");
  const [selectedMeeting, setSelectedMeeting] = useState<ParsedMeetingItem | null>(null);
  const [meetingNotesList, setMeetingNotesList] = useState<ParsedMeetingItem[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [activeProvider] = useState<string>("gemini");
  const [hasAcknowledgedPrivacy, setHasAcknowledgedPrivacy] = useState(false);

  const session = useListeningSession(initialTitle);
  const isRecording = session.status === "recording";

  const meetingPaths = useMemo(
    () => allNotePaths.filter((p) => p.startsWith("Meetings/") && p.endsWith(".md")),
    [allNotePaths],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const items: ParsedMeetingItem[] = [];
      for (const p of meetingPaths) {
        try {
          const payload = await readNote(p);
          if (payload?.content) items.push(parseMeetingMarkdown(p, payload.content));
        } catch {
          // Gracefully continue
        }
      }
      if (!cancelled) {
        items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setMeetingNotesList(items);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meetingPaths]);

  useEffect(() => {
    if (initialAudioPath) void session.retranscribeAudio(initialAudioPath);
  }, [initialAudioPath, session]);

  const handleStopAndSave = async () => {
    const savedPath = await session.stopSession(allNotePaths);
    if (savedPath && onNavigateToNote) onNavigateToNote(savedPath);
  };

  const handleToggleAIListening = useCallback(
    (active: boolean) => {
      if (!active) {
        session.setIsAIListeningActive(false);
        return;
      }
      if (!activeProvider.toLowerCase().includes("ollama") && !hasAcknowledgedPrivacy) {
        setIsPrivacyModalOpen(true);
        return;
      }
      session.setIsAIListeningActive(true);
    },
    [activeProvider, hasAcknowledgedPrivacy, session],
  );

  const handleConfirmPrivacy = useCallback(() => {
    setHasAcknowledgedPrivacy(true);
    setIsPrivacyModalOpen(false);
    session.setIsAIListeningActive(true);
  }, [session]);

  return (
    <div
      className={styles["recording-workspace"]}
      aria-label="Meeting Recording Workspace"
      data-testid="recording-workspace"
    >
      <MeetingsSidebar
        activeChannel={currentView === "record" ? "record" : "all-meetings"}
        onSelectChannel={(ch) => setCurrentView(ch)}
        onOpenSettings={onOpenSettings}
      />

      {currentView === "detail" && selectedMeeting ? (
        <MeetingDetailView
          meeting={selectedMeeting}
          vaultPath={vaultPath}
          onBack={() => setCurrentView("all-meetings")}
          onOpenNote={onNavigateToNote}
          onOpenSettings={onOpenSettings}
        />
      ) : currentView === "all-meetings" ? (
        <>
          <AllMeetingsView
            meetings={meetingNotesList}
            onSelectMeeting={(m) => {
              setSelectedMeeting(m);
              setCurrentView("detail");
            }}
            onStartNewRecording={() => setCurrentView("record")}
            onOpenSettings={onOpenSettings}
            isAssistantOpen={isAssistantOpen}
            onToggleAssistant={() => setIsAssistantOpen((p) => !p)}
          />
          {isAssistantOpen && (
            <MeetingAssistantPanel
              meetings={meetingNotesList}
              channelName="All Meetings"
              onClose={() => setIsAssistantOpen(false)}
            />
          )}
        </>
      ) : (
        <main className={styles["recording-main-col"]}>
          <RecordingTopBar onOpenSettings={onOpenSettings} />

          <ListeningVisualizer
            status={session.status}
            title={session.title}
            durationMs={session.durationMs}
            micLevel={session.micLevel}
            systemLevel={session.systemLevel}
            isTranscriptVisible={session.isTranscriptVisible}
            isAIListeningActive={session.isAIListeningActive}
            aiStatus={session.aiStatus}
            aiError={session.aiError}
            onTitleChange={session.setTitle}
            onStart={() => void session.startSession()}
            onPause={() => void session.pauseSession()}
            onResume={() => void session.resumeSession()}
            onStop={() => void handleStopAndSave()}
            onDiscard={() => void session.discardSession()}
            onToggleTranscript={session.setIsTranscriptVisible}
            onToggleAIListening={handleToggleAIListening}
          />

          <div className={styles["recording-content-area"]}>
            {session.isTranscriptVisible ? (
              <TranscriptFeed segments={session.segments} isRecording={isRecording} />
            ) : (
              <div className={styles["transcript-paused-banner"]}>
                <Broadcast size={22} className={styles["paused-icon"]} />
                <p className={styles["paused-text"]}>Live transcript is currently hidden.</p>
                <button
                  type="button"
                  className={`${styles["btn"]} ${styles["btn--secondary"]}`}
                  onClick={() => session.setIsTranscriptVisible(true)}
                  data-testid="show-transcript-btn"
                >
                  Show Live Transcript
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {currentView === "record" && session.isAIListeningActive && (
        <Suspense
          fallback={
            <aside className={styles["ai-listening-panel--loading"]}>
              Loading AI Listening...
            </aside>
          }
        >
          <LazyAIListeningPanel
            summary={session.liveSummary}
            answers={session.answers}
            questions={session.questions}
            isStreaming={session.aiStatus === "streaming"}
            onSaveAnswer={session.saveAnswer}
            onDismissAnswer={session.dismissAnswer}
            onSaveQuestion={session.saveQuestion}
            onDismissQuestion={session.dismissQuestion}
            onSubmitPrompt={() => void session.triggerAIStep()}
            rollingSummaries={session.rollingSummaries}
            summaryInterval={session.summaryInterval}
            onIntervalChange={session.setSummaryInterval}
            onSummarizeNow={session.summarizeNow}
            isAIListeningPaused={session.isAIListeningPaused}
            onTogglePauseAI={session.togglePauseAI}
            summaryStatusMessage={session.summaryStatusMessage}
            chatMessages={session.chatMessages}
            isChatExecuting={session.isChatExecuting}
            onAskChatQuestion={session.askChatQuestion}
            agentConversationId={session.agentConversationId}
          />
        </Suspense>
      )}

      <AIListeningPrivacyModal
        isOpen={isPrivacyModalOpen}
        provider={activeProvider}
        onConfirm={handleConfirmPrivacy}
        onCancel={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
export default ListeningView;

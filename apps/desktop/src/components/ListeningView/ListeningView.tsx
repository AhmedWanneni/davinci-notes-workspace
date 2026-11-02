import React, { Suspense, useEffect, useState, useMemo } from "react";
import { FunnelSimple, MagnifyingGlass, Gear } from "@phosphor-icons/react";
import { MeetingsSidebar } from "./MeetingsSidebar";
import { ListeningVisualizer } from "./ListeningVisualizer";
import { TranscriptFeed } from "./TranscriptFeed";
import { AllMeetingsView } from "./AllMeetingsView";
import { MeetingDetailView } from "./MeetingDetailView";
import { MeetingAssistantPanel } from "./MeetingAssistantPanel";
import { MeetingShowcaseEmpty } from "./MeetingShowcaseEmpty";
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

  const session = useListeningSession(initialTitle);
  const isRecording = session.status === "recording";

  // Load meeting notes from vault's Meetings/ folder
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
          if (payload?.content) {
            items.push(parseMeetingMarkdown(p, payload.content));
          }
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
    if (initialAudioPath) {
      void session.retranscribeAudio(initialAudioPath);
    }
  }, [initialAudioPath, session]);

  const handleStopAndSave = async () => {
    const savedPath = await session.stopSession(allNotePaths);
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
          <div className={styles["recording-top-action-bar"]}>
            <button type="button" className={styles["action-bar-btn"]}>
              <FunnelSimple size={14} weight="bold" />
              <span>Filters</span>
            </button>
            <div className={styles["top-bar-right-actions"]}>
              <button
                type="button"
                className={styles["action-bar-icon-btn"]}
                aria-label="Search meetings"
              >
                <MagnifyingGlass size={16} />
              </button>
              {onOpenSettings && (
                <button
                  type="button"
                  className={styles["action-bar-icon-btn"]}
                  onClick={onOpenSettings}
                  title="Recording & AI Settings"
                  data-testid="record-view-settings-btn"
                >
                  <Gear size={16} />
                </button>
              )}
            </div>
          </div>

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
            onToggleAIListening={session.setIsAIListeningActive}
          />

          <div className={styles["recording-content-area"]}>
            {session.isTranscriptVisible ? (
              <TranscriptFeed segments={session.segments} isRecording={isRecording} />
            ) : (
              <MeetingShowcaseEmpty />
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
          />
        </Suspense>
      )}
    </div>
  );
}
export default ListeningView;

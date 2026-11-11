import React, { useState } from "react";
import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  Sparkle,
  ChatCircleText,
  ArrowSquareOut,
  Gear,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import type { ParsedMeetingItem } from "./meetingsParser";
import { MeetingAudioPlayer } from "./MeetingAudioPlayer";
import { MeetingInsightsGrid } from "./MeetingInsightsGrid";
import { resolveAudioSrc } from "./resolveAudioSrc";
import { useMeetingAIUpdater } from "./useMeetingAIUpdater";
import styles from "./ListeningView.module.scss";

export interface MeetingDetailViewProps {
  meeting: ParsedMeetingItem;
  vaultPath?: string | null;
  onBack: () => void;
  onOpenNote?: (path: string) => void;
  onOpenSettings?: () => void;
}

export function MeetingDetailView({
  meeting,
  vaultPath,
  onBack,
  onOpenNote,
  onOpenSettings,
}: MeetingDetailViewProps) {
  const [currentMeeting, setCurrentMeeting] = useState<ParsedMeetingItem>(meeting);
  const [activeTab, setActiveTab] = useState<"ai-thoughts" | "transcript">("ai-thoughts");

  const { isUpdating, updateError, updateAIInsights } = useMeetingAIUpdater(setCurrentMeeting);
  const audioSrc = resolveAudioSrc(vaultPath, currentMeeting.audioFileName);

  return (
    <div className={styles["meeting-detail-view"]} data-testid="meeting-detail-view">
      <header className={styles["meeting-detail-header"]}>
        <div className={styles["detail-header-left"]}>
          <button
            type="button"
            className={styles["back-btn"]}
            onClick={onBack}
            data-testid="detail-back-btn"
          >
            <ArrowLeft size={16} />
            <span>All Meetings</span>
          </button>
          <div className={styles["detail-title-group"]}>
            <h1 className={styles["detail-title"]}>{currentMeeting.title}</h1>
            <div className={styles["detail-meta-row"]}>
              {currentMeeting.date && (
                <span className={styles["meta-item"]}>
                  <CalendarBlank size={13} />
                  <span>{currentMeeting.date} {currentMeeting.time || ""}</span>
                </span>
              )}
              {currentMeeting.durationSeconds > 0 && (
                <span className={styles["meta-item"]}>
                  <Clock size={13} />
                  <span>{Math.round(currentMeeting.durationSeconds / 60)} min</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles["detail-header-right"]}>
          {onOpenNote && (
            <button
              type="button"
              className={styles["action-btn"]}
              onClick={() => onOpenNote(currentMeeting.path)}
              title="Open raw markdown note"
              data-testid="open-as-note-btn"
            >
              <ArrowSquareOut size={15} />
              <span>Open Note</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              className={styles["icon-action-btn"]}
              onClick={onOpenSettings}
              title="Recording & AI Settings"
              data-testid="detail-settings-btn"
            >
              <Gear size={16} />
            </button>
          )}
        </div>
      </header>

      {audioSrc && (
        <section className={styles["detail-audio-section"]} aria-label="Meeting Audio Record">
          <MeetingAudioPlayer
            audioSrc={audioSrc}
            durationSeconds={currentMeeting.durationSeconds}
          />
        </section>
      )}

      <div className={styles["detail-tabs-bar"]}>
        <div className={styles["tabs-left"]}>
          <button
            type="button"
            className={`${styles["detail-tab-btn"]} ${activeTab === "ai-thoughts" ? styles["is-active"] : ""}`}
            onClick={() => setActiveTab("ai-thoughts")}
            data-testid="tab-ai-thoughts"
          >
            <Sparkle size={15} weight={activeTab === "ai-thoughts" ? "fill" : "regular"} />
            <span>AI Thoughts & Insights</span>
          </button>

          <button
            type="button"
            className={`${styles["detail-tab-btn"]} ${activeTab === "transcript" ? styles["is-active"] : ""}`}
            onClick={() => setActiveTab("transcript")}
            data-testid="tab-transcript"
          >
            <ChatCircleText size={15} />
            <span>Transcript ({currentMeeting.transcript.length})</span>
          </button>
        </div>

        {activeTab === "ai-thoughts" && currentMeeting.transcript.length > 0 && (
          <button
            type="button"
            className={`${styles["action-bar-btn"]} ${isUpdating ? styles["is-active"] : ""}`}
            onClick={() => void updateAIInsights(currentMeeting)}
            disabled={isUpdating}
            title="Re-run AI analysis on transcript"
            data-testid="update-ai-insights-btn"
          >
            <ArrowsClockwise size={14} className={isUpdating ? styles["spin-icon"] : ""} />
            <span>{isUpdating ? "Analyzing with AI..." : "Update AI Insights"}</span>
          </button>
        )}
      </div>

      {updateError && (
        <div className={styles["ai-update-error-banner"]}>
          {updateError}
        </div>
      )}

      <div className={styles["detail-content-area"]}>
        {activeTab === "ai-thoughts" ? (
          <MeetingInsightsGrid meeting={currentMeeting} />
        ) : (
          <div className={styles["detail-transcript-feed"]} data-testid="detail-transcript-content">
            {currentMeeting.transcript.length === 0 ? (
              <div className={styles["empty-transcript-msg"]}>
                *No speech transcription recorded for this meeting.*
              </div>
            ) : (
              currentMeeting.transcript.map((item, idx) => (
                <div key={idx} className={styles["detail-transcript-bubble"]}>
                  <div className={styles["bubble-header"]}>
                    <span className={styles["bubble-speaker"]}>{item.speaker}</span>
                    <span className={styles["bubble-offset"]}>{item.offset}</span>
                  </div>
                  <p className={styles["bubble-text"]}>{item.text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

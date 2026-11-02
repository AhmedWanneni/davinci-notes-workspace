import React, { useState } from "react";
import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  Sparkle,
  CheckSquare,
  ChatCircleText,
  Question,
  ShareNetwork,
  ArrowSquareOut,
  Gear,
} from "@phosphor-icons/react";
import type { ParsedMeetingItem } from "./meetingsParser";
import { MeetingAudioPlayer } from "./MeetingAudioPlayer";
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
  const [activeTab, setActiveTab] = useState<"ai-thoughts" | "transcript">("ai-thoughts");

  // Determine local audio URL if audioFileName exists
  const audioSrc = meeting.audioFileName && vaultPath
    ? `asset://${vaultPath.replace(/^\//, "")}/attachments/${meeting.audioFileName}`
    : null;

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
            <h1 className={styles["detail-title"]}>{meeting.title}</h1>
            <div className={styles["detail-meta-row"]}>
              {meeting.date && (
                <span className={styles["meta-item"]}>
                  <CalendarBlank size={13} />
                  <span>{meeting.date} {meeting.time || ""}</span>
                </span>
              )}
              {meeting.durationSeconds > 0 && (
                <span className={styles["meta-item"]}>
                  <Clock size={13} />
                  <span>{Math.round(meeting.durationSeconds / 60)} min</span>
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
              onClick={() => onOpenNote(meeting.path)}
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

      {/* Audio Recording Player Section */}
      {audioSrc && (
        <section className={styles["detail-audio-section"]} aria-label="Meeting Audio Record">
          <MeetingAudioPlayer
            audioSrc={audioSrc}
            durationSeconds={meeting.durationSeconds}
          />
        </section>
      )}

      {/* Navigation tabs for AI Thoughts vs Transcript */}
      <div className={styles["detail-tabs-bar"]}>
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
          <span>Transcript ({meeting.transcript.length})</span>
        </button>
      </div>

      <div className={styles["detail-content-area"]}>
        {activeTab === "ai-thoughts" ? (
          <div className={styles["ai-thoughts-grid"]} data-testid="ai-thoughts-content">
            {/* Executive Summary */}
            <div className={styles["insight-card"]}>
              <div className={styles["insight-card__header"]}>
                <Sparkle size={16} weight="fill" className={styles["sparkle-icon"]} />
                <h3 className={styles["insight-card__title"]}>Executive Summary</h3>
              </div>
              <p className={styles["insight-card__body"]}>
                {meeting.summary || "No executive summary recorded for this meeting."}
              </p>
            </div>

            {/* Action Items */}
            {meeting.actionItems.length > 0 && (
              <div className={styles["insight-card"]}>
                <div className={styles["insight-card__header"]}>
                  <CheckSquare size={16} weight="bold" />
                  <h3 className={styles["insight-card__title"]}>Action Items ({meeting.actionItems.length})</h3>
                </div>
                <ul className={styles["action-items-list"]}>
                  {meeting.actionItems.map((item, idx) => (
                    <li key={idx} className={styles["action-item-row"]}>
                      <span className={styles["action-checkbox"]}>☐</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Q&A / Suggested Answers */}
            {meeting.answers.length > 0 && (
              <div className={styles["insight-card"]}>
                <div className={styles["insight-card__header"]}>
                  <ChatCircleText size={16} weight="bold" />
                  <h3 className={styles["insight-card__title"]}>Discussion Q&A ({meeting.answers.length})</h3>
                </div>
                <div className={styles["qa-items-list"]}>
                  {meeting.answers.map((qa, idx) => (
                    <div key={idx} className={styles["qa-row"]}>
                      <div className={styles["qa-q"]}><strong>Q:</strong> {qa.question}</div>
                      <div className={styles["qa-a"]}><strong>A:</strong> {qa.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Follow-up Questions */}
            {meeting.questions.length > 0 && (
              <div className={styles["insight-card"]}>
                <div className={styles["insight-card__header"]}>
                  <Question size={16} weight="bold" />
                  <h3 className={styles["insight-card__title"]}>Suggested Follow-up Questions</h3>
                </div>
                <ul className={styles["questions-list"]}>
                  {meeting.questions.map((q, idx) => (
                    <li key={idx} className={styles["question-row"]}>
                      <span>•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Vault Notes */}
            {meeting.relatedNotes.length > 0 && (
              <div className={styles["insight-card"]}>
                <div className={styles["insight-card__header"]}>
                  <ShareNetwork size={16} />
                  <h3 className={styles["insight-card__title"]}>Related Notes ({meeting.relatedNotes.length})</h3>
                </div>
                <ul className={styles["related-notes-list"]}>
                  {meeting.relatedNotes.map((rn, idx) => (
                    <li key={idx} className={styles["related-note-item"]}>
                      <span className={styles["wikilink-pill"]}>[[{rn.title}]]</span>
                      {rn.reason && <span className={styles["reason-text"]}>— {rn.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className={styles["detail-transcript-feed"]} data-testid="detail-transcript-content">
            {meeting.transcript.length === 0 ? (
              <p className={styles["empty-text"]}>No transcript entries captured.</p>
            ) : (
              meeting.transcript.map((seg, idx) => (
                <div key={idx} className={styles["detail-transcript-bubble"]}>
                  <div className={styles["bubble-meta"]}>
                    <span className={styles["bubble-speaker"]}>{seg.speaker}</span>
                    <span className={styles["bubble-time"]}>{seg.offset}</span>
                  </div>
                  <div className={styles["bubble-body"]}>{seg.text}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

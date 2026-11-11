import React from "react";
import {
  Sparkle,
  CheckSquare,
  ChatCircleText,
  Question,
  ShareNetwork,
} from "@phosphor-icons/react";
import type { ParsedMeetingItem } from "./meetingsParser";
import styles from "./ListeningView.module.scss";

export interface MeetingInsightsGridProps {
  meeting: ParsedMeetingItem;
}

export function MeetingInsightsGrid({ meeting }: MeetingInsightsGridProps) {
  return (
    <div className={styles["ai-thoughts-grid"]} data-testid="ai-thoughts-content">
      <div className={styles["insight-card"]}>
        <div className={styles["insight-card__header"]}>
          <Sparkle size={16} weight="fill" className={styles["sparkle-icon"]} />
          <h3 className={styles["insight-card__title"]}>Executive Summary</h3>
        </div>
        <p className={styles["insight-card__body"]}>
          {meeting.summary ||
            "No executive summary recorded for this meeting. Click 'Update AI Insights' to generate one."}
        </p>
      </div>

      {meeting.actionItems.length > 0 && (
        <div className={styles["insight-card"]}>
          <div className={styles["insight-card__header"]}>
            <CheckSquare size={16} weight="bold" />
            <h3 className={styles["insight-card__title"]}>
              Action Items ({meeting.actionItems.length})
            </h3>
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

      {meeting.answers.length > 0 && (
        <div className={styles["insight-card"]}>
          <div className={styles["insight-card__header"]}>
            <ChatCircleText size={16} weight="bold" />
            <h3 className={styles["insight-card__title"]}>
              Discussion Q&A ({meeting.answers.length})
            </h3>
          </div>
          <div className={styles["qa-items-list"]}>
            {meeting.answers.map((qa, idx) => (
              <div key={idx} className={styles["qa-row"]}>
                <div className={styles["qa-q"]}>
                  <strong>Q:</strong> {qa.question}
                </div>
                <div className={styles["qa-a"]}>
                  <strong>A:</strong> {qa.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meeting.questions.length > 0 && (
        <div className={styles["insight-card"]}>
          <div className={styles["insight-card__header"]}>
            <Question size={16} weight="bold" />
            <h3 className={styles["insight-card__title"]}>
              Suggested Follow-up Questions
            </h3>
          </div>
          <ul className={styles["questions-list"]}>
            {meeting.questions.map((q, idx) => (
              <li key={idx} className={styles["question-item"]}>
                • {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {meeting.relatedNotes.length > 0 && (
        <div className={styles["insight-card"]}>
          <div className={styles["insight-card__header"]}>
            <ShareNetwork size={16} weight="bold" />
            <h3 className={styles["insight-card__title"]}>Related Vault Notes</h3>
          </div>
          <div className={styles["related-links-grid"]}>
            {meeting.relatedNotes.map((rn, idx) => (
              <div key={idx} className={styles["related-link-card"]}>
                <span className={styles["related-title"]}>[[{rn.title}]]</span>
                {rn.reason && <p className={styles["related-reason"]}>{rn.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

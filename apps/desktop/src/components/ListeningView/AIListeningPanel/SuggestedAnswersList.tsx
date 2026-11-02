import React from "react";
import { X, ChatCircleText, BookmarkSimple } from "@phosphor-icons/react";
import type { AIListeningAnswerItem } from "@app/ai-agent";
import styles from "../ListeningView.module.scss";

export interface SuggestedAnswersListProps {
  answers: AIListeningAnswerItem[];
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function SuggestedAnswersList({
  answers,
  onSave,
  onDismiss,
}: SuggestedAnswersListProps) {
  const visibleAnswers = answers.filter((a) => a.status !== "dismissed");
  if (visibleAnswers.length === 0) return null;

  return (
    <div
      className={styles["ai-items-section"]}
      data-testid="suggested-answers-section"
    >
      <div className={styles["ai-items-section__header"]}>
        <ChatCircleText size={14} weight="bold" />
        <h4 className={styles["ai-items-section__title"]}>Suggested Answers</h4>
        <span className={styles["ai-items-section__count"]}>
          {visibleAnswers.length}
        </span>
      </div>

      <ul className={styles["ai-items-list"]}>
        {visibleAnswers.map((item) => (
          <li
            key={item.id}
            className={`${styles["ai-item-card"]} ${
              item.status === "saved" ? styles["is-saved"] : ""
            }`}
            data-testid={`answer-card-${item.id}`}
          >
            <div className={styles["ai-item-card__meta"]}>
              <span className={styles["ai-item-time"]}>
                {formatTime(item.timestamp)}
              </span>
              {item.status === "saved" && (
                <span className={styles["saved-tag"]}>Saved to note</span>
              )}
            </div>

            <div className={styles["ai-item-question"]}>
              <strong>Q:</strong> {item.question}
            </div>
            <div className={styles["ai-item-answer"]}>
              <strong>A:</strong> {item.answer}
            </div>

            <div className={styles["ai-item-card__actions"]}>
              {item.status !== "saved" && (
                <button
                  type="button"
                  className={styles["ai-btn--save"]}
                  onClick={() => onSave(item.id)}
                  title="Save answer to meeting note"
                  data-testid={`save-answer-${item.id}`}
                >
                  <BookmarkSimple size={13} weight="bold" />
                  <span>Save to note</span>
                </button>
              )}
              <button
                type="button"
                className={styles["ai-btn--dismiss"]}
                onClick={() => onDismiss(item.id)}
                title="Dismiss suggested answer"
                data-testid={`dismiss-answer-${item.id}`}
              >
                <X size={13} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

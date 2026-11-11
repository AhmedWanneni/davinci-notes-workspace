import React from "react";
import { Question, X, BookmarkSimple } from "@phosphor-icons/react";
import type { AIListeningFollowupQuestion } from "@app/ai-agent";
import styles from "../ListeningView.module.scss";

export interface SuggestedQuestionsListProps {
  questions: AIListeningFollowupQuestion[];
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function SuggestedQuestionsList({
  questions,
  onSave,
  onDismiss,
}: SuggestedQuestionsListProps) {
  const visibleQuestions = questions.filter((q) => q.status !== "dismissed");
  if (visibleQuestions.length === 0) return null;

  return (
    <div
      className={styles["ai-items-section"]}
      data-testid="suggested-questions-section"
    >
      <div className={styles["ai-items-section__header"]}>
        <Question size={14} weight="bold" />
        <h4 className={styles["ai-items-section__title"]}>
          Suggested Questions
        </h4>
        <span className={styles["ai-items-section__count"]}>
          {visibleQuestions.length}
        </span>
      </div>

      <ul className={styles["ai-items-list"]}>
        {visibleQuestions.map((item) => (
          <li
            key={item.id}
            className={`${styles["ai-item-card"]} ${
              item.status === "saved" ? styles["is-saved"] : ""
            }`}
            data-testid={`question-card-${item.id}`}
          >
            <div className={styles["ai-item-card__meta"]}>
              <span className={styles["ai-item-time"]}>
                {formatTime(item.timestamp)}
              </span>
              {item.status === "saved" && (
                <span className={styles["saved-tag"]}>Saved to note</span>
              )}
            </div>

            <p className={styles["ai-item-question-text"]}>{item.question}</p>

            <div className={styles["ai-item-card__actions"]}>
              {item.status !== "saved" && (
                <button
                  type="button"
                  className={styles["ai-btn--save"]}
                  onClick={() => onSave(item.id)}
                  title="Save question to meeting note"
                  data-testid={`save-question-${item.id}`}
                >
                  <BookmarkSimple size={13} weight="bold" />
                  <span>Save to note</span>
                </button>
              )}
              <button
                type="button"
                className={styles["ai-btn--dismiss"]}
                onClick={() => onDismiss(item.id)}
                title="Dismiss question"
                data-testid={`dismiss-question-${item.id}`}
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

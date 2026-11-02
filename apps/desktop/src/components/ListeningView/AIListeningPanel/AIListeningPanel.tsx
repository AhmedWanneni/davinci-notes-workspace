import React from "react";
import { Robot, ChatCircleText, Plus } from "@phosphor-icons/react";
import type {
  AIListeningAnswerItem,
  AIListeningFollowupQuestion,
} from "@app/ai-agent";
import { LiveSummaryCard } from "./LiveSummaryCard";
import { SuggestedAnswersList } from "./SuggestedAnswersList";
import { SuggestedQuestionsList } from "./SuggestedQuestionsList";
import { AIListeningInput } from "./AIListeningInput";
import styles from "../ListeningView.module.scss";

export interface AIListeningPanelProps {
  summary: string;
  answers: AIListeningAnswerItem[];
  questions: AIListeningFollowupQuestion[];
  isStreaming?: boolean;
  channelName?: string;
  onSaveAnswer: (id: string) => void;
  onDismissAnswer: (id: string) => void;
  onSaveQuestion: (id: string) => void;
  onDismissQuestion: (id: string) => void;
  onSubmitPrompt: (query: string) => void;
  className?: string;
}

export function AIListeningPanel({
  summary,
  answers,
  questions,
  isStreaming = false,
  channelName = "Voice Agent Meetings",
  onSaveAnswer,
  onDismissAnswer,
  onSaveQuestion,
  onDismissQuestion,
  onSubmitPrompt,
  className = "",
}: AIListeningPanelProps) {
  return (
    <aside
      className={`${styles["ai-listening-panel"]} ${className}`}
      aria-label="AI Listening Live Assistant"
      data-testid="ai-listening-panel"
    >
      <header className={styles["ai-listening-panel__header"]}>
        <div className={styles["ai-assistant-badge"]}>
          <div className={styles["ai-assistant-badge__avatar"]}>
            <Robot size={18} weight="fill" />
          </div>
          <span className={styles["ai-assistant-badge__name"]}>Ask Fred</span>
        </div>

        <div className={styles["ai-assistant-header-actions"]}>
          <button
            type="button"
            className={styles["header-action-btn"]}
            title="Chat history"
          >
            <ChatCircleText size={16} />
          </button>
          <button
            type="button"
            className={styles["header-action-btn"]}
            title="New conversation"
            onClick={() => onSubmitPrompt("")}
          >
            <Plus size={16} />
          </button>
        </div>
      </header>

      <div className={styles["ai-listening-panel__scroll-content"]}>
        <LiveSummaryCard
          summary={summary}
          isStreaming={isStreaming}
          onChipClick={(chipPrompt) => onSubmitPrompt(chipPrompt)}
        />

        <SuggestedAnswersList
          answers={answers}
          onSave={onSaveAnswer}
          onDismiss={onDismissAnswer}
        />

        <SuggestedQuestionsList
          questions={questions}
          onSave={onSaveQuestion}
          onDismiss={onDismissQuestion}
        />
      </div>

      <footer className={styles["ai-listening-panel__footer"]}>
        <AIListeningInput
          channelName={channelName}
          onSubmit={onSubmitPrompt}
          disabled={isStreaming}
        />
      </footer>
    </aside>
  );
}
export default AIListeningPanel;

import React, { useState } from "react";
import { Plus, Stack, Microphone, ArrowUp, Hash } from "@phosphor-icons/react";
import styles from "../ListeningView.module.scss";

export interface AIListeningInputProps {
  channelName?: string;
  onSubmit: (query: string) => void;
  disabled?: boolean;
}

export function AIListeningInput({
  channelName = "Voice Agent Meetings",
  onSubmit,
  disabled = false,
}: AIListeningInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || disabled) return;
    onSubmit(prompt.trim());
    setPrompt("");
  };

  return (
    <form
      className={styles["ai-listening-input-card"]}
      onSubmit={handleSubmit}
      data-testid="ai-listening-input-form"
    >
      <div className={styles["ai-listening-input-card__header"]}>
        <span className={styles["channel-chip"]}>
          <Hash size={12} weight="bold" />
          <span>{channelName}</span>
        </span>
      </div>

      <div className={styles["ai-listening-input-card__body"]}>
        <input
          type="text"
          className={styles["ai-input-field"]}
          placeholder="Ask anything. Type / to run AI skills."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled}
          aria-label="Ask Fred or query meeting"
          data-testid="ai-listening-query-input"
        />
      </div>

      <div className={styles["ai-listening-input-card__footer"]}>
        <div className={styles["ai-input-tools-left"]}>
          <button
            type="button"
            className={styles["tool-icon-btn"]}
            title="Attach or add skill"
            disabled={disabled}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            className={styles["tool-icon-btn"]}
            title="AI skills catalog"
            disabled={disabled}
          >
            <Stack size={15} />
          </button>
        </div>

        <div className={styles["ai-input-tools-right"]}>
          <button
            type="button"
            className={styles["tool-icon-btn"]}
            title="Voice query"
            disabled={disabled}
          >
            <Microphone size={15} />
          </button>
          <button
            type="submit"
            className={styles["submit-arrow-btn"]}
            disabled={!prompt.trim() || disabled}
            aria-label="Send query"
            data-testid="ai-listening-send-btn"
          >
            <ArrowUp size={14} weight="bold" />
          </button>
        </div>
      </div>
    </form>
  );
}

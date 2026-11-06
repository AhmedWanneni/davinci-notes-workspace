import { ArrowUp, Pause } from "@phosphor-icons/react";
import styles from "./AgentPromptBar.module.scss";

interface AgentPromptActionsProps {
  isStreaming: boolean;
  onCancel?: () => void;
  onSend: () => void;
}

export function AgentPromptActions({
  isStreaming,
  onCancel,
  onSend,
}: AgentPromptActionsProps) {
  return (
    <div className={styles["prompt-bar__actions"]}>
      {isStreaming ? (
        <button
          type="button"
          className={styles["prompt-bar__stop-btn"]}
          onClick={onCancel}
          aria-label="Stop agent"
          title="Stop agent"
          data-testid="agent-pause-button"
        >
          <Pause size={14} weight="fill" />
        </button>
      ) : (
        <button
          type="button"
          className={styles["prompt-bar__send-btn"]}
          onClick={onSend}
          aria-label="Send message"
        >
          <ArrowUp size={18} weight="bold" />
        </button>
      )}
    </div>
  );
}

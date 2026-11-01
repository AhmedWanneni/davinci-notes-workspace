import {
  Microphone,
  CaretDown,
  Waveform,
  ArrowUp,
  Stop,
} from "@phosphor-icons/react";
import styles from "./AgentPromptBar.module.scss";

interface AgentPromptActionsProps {
  isStreaming: boolean;
  canSend: boolean;
  onVoiceClick?: () => void;
  onCancel?: () => void;
  onSend: () => void;
}

export function AgentPromptActions({
  isStreaming,
  canSend,
  onVoiceClick,
  onCancel,
  onSend,
}: AgentPromptActionsProps) {
  return (
    <div className={styles["prompt-bar__actions"]}>
      <button
        type="button"
        className={styles["prompt-bar__mic-btn"]}
        onClick={onVoiceClick}
        aria-label="Voice input"
        title="Voice input"
      >
        <Microphone size={17} weight="regular" />
        <CaretDown size={9} weight="bold" />
      </button>

      {isStreaming ? (
        <button
          type="button"
          className={styles["prompt-bar__stop-btn"]}
          onClick={onCancel}
          aria-label="Stop generation"
        >
          <Stop size={14} weight="fill" />
        </button>
      ) : canSend ? (
        <button
          type="button"
          className={styles["prompt-bar__send-btn"]}
          onClick={onSend}
          aria-label="Send message"
        >
          <ArrowUp size={16} weight="bold" />
        </button>
      ) : (
        <button
          type="button"
          className={styles["prompt-bar__waveform-btn"]}
          onClick={onVoiceClick}
          aria-label="Start voice mode"
          title="Voice mode"
        >
          <Waveform size={17} weight="bold" />
        </button>
      )}
    </div>
  );
}

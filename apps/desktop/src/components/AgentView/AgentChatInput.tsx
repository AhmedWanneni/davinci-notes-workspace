import { useState, type KeyboardEvent } from "react";
import { Button, Checkbox, Typography } from "@app/design-system";
import { PaperPlaneTilt, Stop } from "@phosphor-icons/react";

export interface AgentChatInputProps {
  onSend: (prompt: string) => void;
  onCancel?: () => void;
  isStreaming: boolean;
  autoApply: boolean;
  onToggleAutoApply: (enabled: boolean) => void;
  disabled?: boolean;
}

export function AgentChatInput({
  onSend,
  onCancel,
  isStreaming,
  autoApply,
  onToggleAutoApply,
  disabled,
}: AgentChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (disabled || !input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="agent-chat-input">
      <div className="agent-chat-input__toolbar">
        <label className="agent-chat-input__auto-apply-label">
          <Checkbox checked={autoApply} onCheckedChange={(val) => onToggleAutoApply(Boolean(val))} />
          <Typography variant="text" size="xs" color="muted">
            Auto-apply changes (record to Undo history)
          </Typography>
        </label>
      </div>

      <div className="agent-chat-input__box">
        <textarea
          className="agent-chat-input__textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or request changes (e.g. 'Summarize meeting notes in Finance', 'Make a to-do list')..."
          rows={2}
          disabled={disabled}
          aria-label="Agent prompt input"
        />

        <div className="agent-chat-input__actions">
          {isStreaming ? (
            <Button variant="secondary" size="sm" onClick={onCancel} aria-label="Stop generating">
              <Stop size={14} weight="fill" /> Stop
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              aria-label="Send prompt"
            >
              <PaperPlaneTilt size={14} weight="bold" /> Send
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { Copy, Check, PencilSimple, ArrowClockwise } from "@phosphor-icons/react";

export interface AgentMessageActionsProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

export function AgentMessageActions({
  role,
  content,
  isStreaming = false,
  onEdit,
  onRegenerate,
}: AgentMessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures in restricted environments
    }
  }, [content]);

  if (isStreaming) return null;

  return (
    <div className="agent-message-actions" role="toolbar" aria-label="Message actions">
      <button
        type="button"
        className="agent-message-action-btn"
        onClick={handleCopy}
        title={copied ? "Copied" : "Copy markdown"}
        aria-label="Copy markdown"
      >
        {copied ? <Check size={13} weight="bold" /> : <Copy size={13} />}
      </button>

      {role === "user" && onEdit && (
        <button
          type="button"
          className="agent-message-action-btn"
          onClick={onEdit}
          title="Edit message"
          aria-label="Edit message"
        >
          <PencilSimple size={13} />
        </button>
      )}

      {role === "assistant" && onRegenerate && (
        <button
          type="button"
          className="agent-message-action-btn"
          onClick={onRegenerate}
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <ArrowClockwise size={13} />
        </button>
      )}
    </div>
  );
}

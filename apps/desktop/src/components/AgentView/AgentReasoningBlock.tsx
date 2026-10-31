import { useState, useRef, useEffect } from "react";
import { Brain, CaretRight, CaretDown, CircleNotch } from "@phosphor-icons/react";

export interface AgentReasoningBlockProps {
  content: string;
  isStreaming?: boolean;
}

export function AgentReasoningBlock({
  content,
  isStreaming = false,
}: AgentReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(isStreaming);
  const wasStreamingRef = useRef(isStreaming);

  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      setIsOpen(false);
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  return (
    <div
      className="agent-reasoning-block"
      data-streaming={isStreaming || undefined}
      data-open={isOpen || undefined}
    >
      <button
        type="button"
        className="agent-reasoning-block__header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="agent-reasoning-block__icon">
          {isStreaming ? (
            <CircleNotch size={14} className="agent-reasoning-block__spinner" />
          ) : (
            <Brain size={14} />
          )}
        </span>
        <span className="agent-reasoning-block__title">
          {isStreaming ? "Thinking..." : "Thought process"}
        </span>
        <span className="agent-reasoning-block__caret">
          {isOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
        </span>
      </button>

      {isOpen && (
        <div className="agent-reasoning-block__content">
          <div className="agent-reasoning-block__inner">{content}</div>
        </div>
      )}
    </div>
  );
}

import { AgentMarkdownContent } from "./AgentMarkdownContent";
import { AgentToolCard } from "./AgentToolCard";
import { AgentMessageActions } from "./AgentMessageActions";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentMessageBubbleProps {
  message: ChatMessageItem;
  onNavigateNote?: (notePath: string) => void;
  onEditMessage?: (id: string, newText: string) => void;
  onRegenerateMessage?: (id: string) => void;
  onViewDiff?: (path: string) => void;
}

export function AgentMessageBubble({
  message,
  onNavigateNote,
  onEditMessage,
  onRegenerateMessage,
  onViewDiff,
}: AgentMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`agent-message agent-message--${message.role}`}
      data-streaming={message.isStreaming || undefined}
    >
      <div className="agent-message__row">
        {message.content && (
          <div className="agent-message__body">
            {isUser ? (
              <div className="agent-message__user-bubble">
                {message.content}
              </div>
            ) : (
              <AgentMarkdownContent
                content={message.content}
                isStreaming={message.isStreaming}
                onNavigateNote={onNavigateNote}
              />
            )}
            {message.isStreaming && (
              <span className="agent-message__cursor" aria-hidden="true" />
            )}
          </div>
        )}

        <AgentMessageActions
          role={message.role}
          content={message.content}
          isStreaming={message.isStreaming}
          onEdit={
            onEditMessage
              ? () => onEditMessage(message.id, message.content)
              : undefined
          }
          onRegenerate={
            onRegenerateMessage
              ? () => onRegenerateMessage(message.id)
              : undefined
          }
        />
      </div>

      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="agent-message__tools">
          {message.toolCalls.map((tc) => {
            const result = message.toolResults?.find(
              (r) => r.toolCallId === tc.id,
            );
            return (
              <AgentToolCard
                key={tc.id}
                toolCall={tc}
                result={result}
                isStreaming={message.isStreaming}
                onViewDiff={onViewDiff}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

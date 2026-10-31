import { useState } from "react";
import { AgentMarkdownContent } from "./AgentMarkdownContent";
import { AgentToolCard } from "./AgentToolCard";
import { AgentMessageActions } from "./AgentMessageActions";
import { AgentImageViewerModal } from "./AgentImageViewerModal";
import { AgentMentionChip } from "./AgentMentionChip";
import type { ChatMessageItem, ChatAttachmentItem } from "./agentTypes";

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
  const [zoomedAttachment, setZoomedAttachment] =
    useState<ChatAttachmentItem | null>(null);
  const isUser = message.role === "user";

  return (
    <div
      className={`agent-message agent-message--${message.role}`}
      data-streaming={message.isStreaming || undefined}
    >
      <div className="agent-message__row">
        {message.mentions && message.mentions.length > 0 && (
          <div className="agent-message__mentions">
            {message.mentions.map((m) => (
              <AgentMentionChip key={m.id} mention={m} />
            ))}
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="agent-message__attachments">
            {message.attachments.map((att) => (
              <button
                key={att.id}
                type="button"
                className="agent-message__attachment-btn"
                onClick={() => setZoomedAttachment(att)}
                title={`Click to zoom ${att.name}`}
              >
                <img
                  src={att.url}
                  alt={att.name}
                  className="agent-message__attachment-img"
                />
              </button>
            ))}
          </div>
        )}

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

      <AgentImageViewerModal
        attachment={zoomedAttachment}
        onClose={() => setZoomedAttachment(null)}
      />
    </div>
  );
}

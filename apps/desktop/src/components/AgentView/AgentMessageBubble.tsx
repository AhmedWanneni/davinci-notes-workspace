import { useState, useCallback } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { AgentMarkdownContent } from "./AgentMarkdownContent";
import { AgentToolCallList } from "./AgentToolCallList";
import { AgentSaveNoteModal } from "./AgentSaveNoteModal";
import { AgentExecutionLogs } from "./AgentExecutionLogs";
import { AgentMessageActions } from "./AgentMessageActions";
import { AgentEditedFilesBar } from "./AgentEditedFilesBar";
import { useWordByWordStream } from "./useWordByWordStream";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentMessageBubbleProps {
  message: ChatMessageItem;
  onNavigateNote?: (notePath: string) => void;
  onNavigateFolder?: (folderPath: string) => void;
  onRegenerate?: () => void;
  onStreamComplete?: () => void;
}

export function AgentMessageBubble({
  message,
  onNavigateNote,
  onNavigateFolder,
  onRegenerate,
  onStreamComplete,
}: AgentMessageBubbleProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalContent, setSaveModalContent] = useState("");

  const isUser = message.role === "user";
  const handleStreamComplete = useCallback(() => {
    onStreamComplete?.();
  }, [onStreamComplete]);

  const displayedContent = useWordByWordStream(
    message.content,
    !isUser && message.isStreaming,
    handleStreamComplete,
  );

  const handleOpenSaveModal = (snippet?: string) => {
    setSaveModalContent(snippet || message.content);
    setSaveModalOpen(true);
  };

  return (
    <div
      className={`agent-message agent-message--${message.role}`}
      data-streaming={message.isStreaming || undefined}
    >
      {isUser ? (
        <div className="agent-message__user-container">
          {message.images && message.images.length > 0 && (
            <div className="agent-message__user-images">
              {message.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`User attachment ${idx + 1}`}
                  className="agent-message__user-image"
                />
              ))}
            </div>
          )}
          {message.content && (
            <div className="agent-message__user-bubble">{message.content}</div>
          )}
        </div>
      ) : (
        <div className="agent-message__body">
          {message.logs && message.logs.length > 0 && (
            <AgentExecutionLogs
              logs={message.logs}
              isStreaming={message.isStreaming}
            />
          )}

          {message.isStreaming && !message.content ? (
            <div className="agent-thinking">
              <Sparkle
                size={15}
                weight="fill"
                className="agent-thinking__icon"
              />
              <span className="agent-thinking__text">Thinking...</span>
            </div>
          ) : (
            <>
              {message.images && message.images.length > 0 && (
                <div className="agent-message__images-gallery">
                  {message.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Generated"
                      className="agent-message__assistant-image"
                    />
                  ))}
                </div>
              )}

              <AgentEditedFilesBar
                message={message}
                onNavigateNote={onNavigateNote}
              />

              <AgentMarkdownContent
                content={displayedContent}
                isStreaming={message.isStreaming}
                onNavigateNote={onNavigateNote}
                onNavigateFolder={onNavigateFolder}
                onSaveAsNote={handleOpenSaveModal}
              />

              {message.isStreaming ? (
                <div className="agent-thinking agent-thinking--inline">
                  <Sparkle
                    size={13}
                    weight="fill"
                    className="agent-thinking__icon"
                  />
                  <span className="agent-thinking__text">Thinking...</span>
                </div>
              ) : (
                <AgentMessageActions
                  content={message.content}
                  onRegenerate={onRegenerate}
                  onOpenSaveModal={() => handleOpenSaveModal()}
                />
              )}
            </>
          )}
        </div>
      )}

      <AgentToolCallList
        toolCalls={message.toolCalls || []}
        toolResults={message.toolResults}
        onNavigateNote={onNavigateNote}
        onNavigateFolder={onNavigateFolder}
      />

      <AgentSaveNoteModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        content={saveModalContent}
      />
    </div>
  );
}

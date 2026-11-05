import { useState, useRef, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  SpeakerHigh,
  ThumbsUp,
  ThumbsDown,
  ArrowsClockwise,
  UploadSimple,
  DotsThree,
  Sparkle,
  FolderSimple,
} from "@phosphor-icons/react";
import { AgentMarkdownContent } from "./AgentMarkdownContent";
import { AgentToolCallList } from "./AgentToolCallList";
import { AgentSaveNoteModal } from "./AgentSaveNoteModal";
import { AgentExecutionLogs } from "./AgentExecutionLogs";
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
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalContent, setSaveModalContent] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const isUser = message.role === "user";
  const handleStreamComplete = useCallback(() => {
    onStreamComplete?.();
  }, [onStreamComplete]);
  const displayedContent = useWordByWordStream(
    message.content,
    !isUser && message.isStreaming,
    handleStreamComplete,
  );

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleSpeak = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.content);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenSaveModal = (snippet?: string) => {
    setSaveModalContent(snippet || message.content);
    setSaveModalOpen(true);
    setMenuOpen(false);
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
                <div className="agent-message__actions">
                  <button
                    type="button"
                    className="agent-message__action-btn"
                    onClick={() => void handleCopy()}
                    aria-label="Copy message"
                    title={copied ? "Copied!" : "Copy"}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button
                    type="button"
                    className="agent-message__action-btn"
                    onClick={handleSpeak}
                    aria-label="Read aloud"
                    title="Read aloud"
                  >
                    <SpeakerHigh size={14} />
                  </button>
                  <button
                    type="button"
                    className="agent-message__action-btn"
                    aria-label="Share message"
                    title="Share"
                  >
                    <UploadSimple size={14} />
                  </button>
                  <button
                    type="button"
                    className={`agent-message__action-btn ${feedback === "up" ? "is-active" : ""}`}
                    onClick={() =>
                      setFeedback((f) => (f === "up" ? null : "up"))
                    }
                    aria-label="Good response"
                    title="Good response"
                  >
                    <ThumbsUp
                      size={14}
                      weight={feedback === "up" ? "fill" : "regular"}
                    />
                  </button>
                  <button
                    type="button"
                    className={`agent-message__action-btn ${feedback === "down" ? "is-active" : ""}`}
                    onClick={() =>
                      setFeedback((f) => (f === "down" ? null : "down"))
                    }
                    aria-label="Bad response"
                    title="Bad response"
                  >
                    <ThumbsDown
                      size={14}
                      weight={feedback === "down" ? "fill" : "regular"}
                    />
                  </button>
                  {onRegenerate && (
                    <button
                      type="button"
                      className="agent-message__action-btn"
                      onClick={onRegenerate}
                      aria-label="Regenerate"
                      title="Regenerate response"
                    >
                      <ArrowsClockwise size={14} />
                    </button>
                  )}
                  <div className="agent-message__more-wrap" ref={menuRef}>
                    <button
                      type="button"
                      className="agent-message__action-btn"
                      onClick={() => setMenuOpen((v) => !v)}
                      aria-label="More options"
                      title="More options"
                    >
                      <DotsThree size={16} weight="bold" />
                    </button>
                    {menuOpen && (
                      <div className="agent-message__dropdown-menu" role="menu">
                        <button
                          type="button"
                          className="agent-message__dropdown-item"
                          onClick={() => handleOpenSaveModal()}
                        >
                          <FolderSimple size={14} />
                          <span>Save to Note...</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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

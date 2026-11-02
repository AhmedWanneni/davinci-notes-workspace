import React, { useRef, useEffect } from "react";
import {
  Robot,
  ChatCircleText,
  Plus,
  X,
  Sparkle,
  PushPin,
  NotePencil,
  ChatCircleDots,
} from "@phosphor-icons/react";
import type { ParsedMeetingItem } from "./meetingsParser";
import { useMeetingAssistant } from "./useMeetingAssistant";
import { AIListeningInput } from "./AIListeningPanel/AIListeningInput";
import styles from "./ListeningView.module.scss";

export interface MeetingAssistantPanelProps {
  meetings: ParsedMeetingItem[];
  channelName?: string;
  userName?: string;
  onClose?: () => void;
  className?: string;
}

export function MeetingAssistantPanel({
  meetings,
  channelName = "All Meetings",
  userName = "AHMED",
  onClose,
  className = "",
}: MeetingAssistantPanelProps) {
  const { messages, isStreaming, sendMessage, clearMessages } =
    useMeetingAssistant(meetings);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <aside
      className={`${styles["ai-listening-panel"]} ${styles["meeting-assistant-panel"]} ${className}`}
      aria-label="Ask Fred Meeting Assistant"
      data-testid="meeting-assistant-panel"
    >
      <header className={styles["ai-listening-panel__header"]}>
        <div className={styles["ai-assistant-badge"]}>
          <div className={styles["ai-assistant-badge__avatar"]}>
            <Robot size={18} weight="fill" />
          </div>
          <span className={styles["ai-assistant-badge__name"]}>Ask Fred</span>
        </div>

        <div className={styles["ai-assistant-header-actions"]}>
          <button
            type="button"
            className={styles["header-action-btn"]}
            title="Chat history"
            aria-label="Chat history"
          >
            <ChatCircleText size={16} />
          </button>
          <button
            type="button"
            className={styles["header-action-btn"]}
            title="New conversation"
            aria-label="New conversation"
            onClick={clearMessages}
            data-testid="assistant-new-chat-btn"
          >
            <Plus size={16} />
          </button>
          {onClose && (
            <button
              type="button"
              className={styles["header-action-btn"]}
              title="Close assistant"
              aria-label="Close assistant"
              onClick={onClose}
              data-testid="assistant-close-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <div className={styles["ai-listening-panel__scroll-content"]}>
        <div className={styles["assistant-greeting-card"]}>
          <div className={styles["assistant-greeting-header"]}>
            <div className={styles["sparkle-icon-wrap"]}>
              <Sparkle size={22} weight="fill" />
            </div>
            <div className={styles["greeting-titles"]}>
              <h3 className={styles["greeting-title"]}>Hi {userName}!</h3>
              <p className={styles["greeting-subtitle"]}>
                Get ready for your meeting
              </p>
            </div>
          </div>

          <div className={styles["quick-action-chips"]}>
            <button
              type="button"
              className={styles["action-chip"]}
              onClick={() => sendMessage("Key initiatives")}
              data-testid="chip-key-initiatives"
            >
              <PushPin size={13} weight="fill" />
              <span>Key initiatives</span>
            </button>

            <button
              type="button"
              className={styles["action-chip"]}
              onClick={() => sendMessage("Summarize the channel")}
              data-testid="chip-summarize"
            >
              <NotePencil size={13} weight="fill" />
              <span>Summarize the channel</span>
            </button>

            <button
              type="button"
              className={styles["action-chip"]}
              onClick={() => sendMessage("Product feedback")}
              data-testid="chip-feedback"
            >
              <ChatCircleDots size={13} weight="fill" />
              <span>Product feedback</span>
            </button>
          </div>
        </div>

        {messages.length > 0 && (
          <div
            className={styles["assistant-chat-feed"]}
            data-testid="assistant-chat-feed"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles["assistant-message-row"]} ${
                  msg.role === "user"
                    ? styles["assistant-message-row--user"]
                    : styles["assistant-message-row--assistant"]
                }`}
                data-testid={`message-${msg.role}`}
              >
                {msg.role === "assistant" && (
                  <div className={styles["assistant-msg-avatar"]}>
                    <Robot size={15} weight="fill" />
                  </div>
                )}
                <div className={styles["assistant-message-bubble"]}>
                  <div className={styles["assistant-message-text"]}>
                    {msg.content}
                  </div>
                  <span className={styles["assistant-message-time"]}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isStreaming && (
              <div
                className={`${styles["assistant-message-row"]} ${styles["assistant-message-row--assistant"]}`}
              >
                <div className={styles["assistant-msg-avatar"]}>
                  <Robot size={15} weight="fill" />
                </div>
                <div className={styles["assistant-message-bubble"]}>
                  <span className={styles["cursor-pulse"]}>Thinking... ▋</span>
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        )}
      </div>

      <footer className={styles["ai-listening-panel__footer"]}>
        <AIListeningInput
          channelName={channelName}
          onSubmit={sendMessage}
          disabled={isStreaming}
        />
      </footer>
    </aside>
  );
}

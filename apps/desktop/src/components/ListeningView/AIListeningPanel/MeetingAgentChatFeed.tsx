import React, { useState } from "react";
import { PaperPlaneTilt, Sparkle, User, ArrowSquareOut } from "@phosphor-icons/react";
import type { ChatMessageItem } from "../../AgentView/agentTypes";
import { useAgentStore } from "../../AgentView/useAgentStore";
import { useWorkspaceStore } from "../../../state/useWorkspaceStore";
import { getActiveRecordAgentLabel } from "../resolveRecordPageAIProvider";
import styles from "../ListeningView.module.scss";

export interface MeetingAgentChatFeedProps {
  messages: ChatMessageItem[];
  isExecuting: boolean;
  onAskQuestion: (query: string) => Promise<void>;
  conversationId: string;
}

export function MeetingAgentChatFeed({
  messages,
  isExecuting,
  onAskQuestion,
  conversationId,
}: MeetingAgentChatFeedProps) {
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query || isExecuting) return;
    setInputVal("");
    await onAskQuestion(query);
  };

  const selectedCliAgent = useAgentStore((s) => s.selectedCliAgent);
  const selectedModel = useAgentStore((s) => s.selectedModel);
  const selectConversation = useAgentStore((s) => s.selectConversation);
  const openNote = useWorkspaceStore((s) => s.openNote);

  const activeAgentLabel = getActiveRecordAgentLabel();
  void selectedCliAgent;
  void selectedModel;

  const handleOpenInAgentPage = () => {
    if (conversationId) {
      selectConversation(conversationId);
    }
    openNote("davinci://agent");
  };

  return (
    <div className={styles["meeting-agent-chat-section"]} data-testid="meeting-agent-chat-feed">
      <div className={styles["chat-section-header"]}>
        <div className={styles["chat-header-title"]}>
          <Sparkle size={14} weight="fill" />
          <span>Ask Agent ({activeAgentLabel})</span>
        </div>
        <button
          type="button"
          className={styles["agent-page-link"]}
          title={`Open synced thread ${conversationId || ""} in AI Agent page`}
          onClick={handleOpenInAgentPage}
          data-testid="open-in-agent-page-btn"
        >
          <ArrowSquareOut size={12} />
          <span>davinci://agent</span>
        </button>
      </div>

      <div className={styles["chat-messages-container"]} data-testid="meeting-chat-messages">
        {messages.length === 0 ? (
          <p className={styles["empty-chat-hint"]}>
            Ask questions about this meeting. Agent searches raw transcript and summaries with full
            vault tools.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? `${styles["agent-bubble"]} ${styles["agent-bubble--user"]}`
                  : `${styles["agent-bubble"]} ${styles["agent-bubble--assistant"]}`
              }
              data-testid={`agent-msg-${m.role}`}
            >
              <div className={styles["bubble-header"]}>
                {m.role === "user" ? (
                  <User size={12} weight="bold" />
                ) : (
                  <Sparkle size={12} weight="fill" />
                )}
                <span className={styles["bubble-sender"]}>
                  {m.role === "user" ? "You" : "Agent"}
                </span>
              </div>
              <p className={styles["bubble-text"]}>{m.content}</p>
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className={styles["bubble-tools-badge"]}>
                  <span>Used {m.toolCalls.map((t) => t.tool).join(", ")}</span>
                </div>
              )}
            </div>
          ))
        )}
        {isExecuting && (
          <div className={`${styles["agent-bubble"]} ${styles["agent-bubble--assistant"]}`}>
            <span className={styles["thinking-pulse"]}>Agent searching transcript & thinking…</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles["chat-input-form"]}>
        <input
          type="text"
          className={styles["chat-input-field"]}
          placeholder="Ask a question about the meeting…"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isExecuting}
          data-testid="agent-chat-input"
        />
        <button
          type="submit"
          className={styles["chat-send-btn"]}
          disabled={isExecuting || !inputVal.trim()}
          aria-label="Send question to agent"
          data-testid="agent-chat-send-btn"
        >
          <PaperPlaneTilt size={14} weight="fill" />
        </button>
      </form>
    </div>
  );
}

export default MeetingAgentChatFeed;

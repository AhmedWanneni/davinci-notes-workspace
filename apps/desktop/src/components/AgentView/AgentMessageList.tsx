import type { RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentStarterPrompts } from "./AgentStarterPrompts";
import { AgentCliStatusCard } from "./AgentCliStatusCard";
import type { ChatMessageItem } from "./agentTypes";

export const VIRTUALIZATION_THRESHOLD = 20;

export interface AgentMessageListProps {
  messages: ChatMessageItem[];
  scrollRef: RefObject<HTMLDivElement | null>;
  vaultName?: string;
  onSendMessage: (prompt: string) => void;
  onEditMessage: (id: string, text: string) => void;
  onRegenerateMessage: (id: string) => void;
  cliSession?: {
    agentName: string;
    status: "running" | "done" | "error";
    logs: string[];
  } | null;
  cancelActiveCliSession?: () => Promise<void>;
}

export function AgentMessageList({
  messages,
  scrollRef,
  vaultName,
  onSendMessage,
  onEditMessage,
  onRegenerateMessage,
  cliSession,
  cancelActiveCliSession,
}: AgentMessageListProps) {
  const isVirtualized = messages.length >= VIRTUALIZATION_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 100,
    overscan: 5,
    enabled: isVirtualized,
  });

  if (messages.length === 0) {
    return (
      <div className="agent-view__messages" ref={scrollRef}>
        <AgentStarterPrompts
          vaultName={vaultName || ""}
          onSelectPrompt={onSendMessage}
        />
        {cliSession && (
          <AgentCliStatusCard
            agentName={cliSession.agentName}
            status={cliSession.status}
            logs={cliSession.logs}
            onCancel={cancelActiveCliSession}
          />
        )}
      </div>
    );
  }

  return (
    <div className="agent-view__messages" ref={scrollRef}>
      {isVirtualized ? (
        <div
          className="agent-view__virtual-container"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((vItem) => {
            const msg = messages[vItem.index];
            return (
              <div
                key={msg.id}
                data-index={vItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vItem.start}px)`,
                }}
              >
                <AgentMessageBubble
                  message={msg}
                  onEditMessage={onEditMessage}
                  onRegenerateMessage={onRegenerateMessage}
                />
              </div>
            );
          })}
        </div>
      ) : (
        messages.map((msg) => (
          <AgentMessageBubble
            key={msg.id}
            message={msg}
            onEditMessage={onEditMessage}
            onRegenerateMessage={onRegenerateMessage}
          />
        ))
      )}

      {cliSession && (
        <AgentCliStatusCard
          agentName={cliSession.agentName}
          status={cliSession.status}
          logs={cliSession.logs}
          onCancel={cancelActiveCliSession}
        />
      )}
    </div>
  );
}

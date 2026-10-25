import { Typography } from "@app/design-system";
import { Wrench, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentMessageBubbleProps {
  message: ChatMessageItem;
}

export function AgentMessageBubble({ message }: AgentMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`agent-message agent-message--${message.role}`}
      data-streaming={message.isStreaming || undefined}
    >
      <div className="agent-message__header">
        <Typography variant="text" size="xs" weight="medium" color="muted">
          {isUser ? "You" : "Agent"}
        </Typography>
        <Typography variant="text" size="xs" color="muted">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Typography>
      </div>

      {message.content && (
        <div className="agent-message__body">
          <Typography variant="text" size="sm">
            {message.content}
          </Typography>
        </div>
      )}

      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="agent-message__tools">
          {message.toolCalls.map((tc) => {
            const result = message.toolResults?.find((r) => r.toolCallId === tc.id);
            const isError = result?.isError;
            return (
              <div key={tc.id} className="agent-tool-card" data-error={isError || undefined}>
                <div className="agent-tool-card__header">
                  <Wrench size={13} weight="bold" />
                  <Typography variant="text" size="xs" weight="medium">
                    {tc.name}
                  </Typography>
                  {result && (
                    <span className="agent-tool-card__status">
                      {isError ? (
                        <WarningCircle size={13} weight="fill" className="agent-tool-card__icon--error" />
                      ) : (
                        <CheckCircle size={13} weight="fill" className="agent-tool-card__icon--success" />
                      )}
                    </span>
                  )}
                </div>
                <pre className="agent-tool-card__args">{JSON.stringify(tc.arguments, null, 2)}</pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

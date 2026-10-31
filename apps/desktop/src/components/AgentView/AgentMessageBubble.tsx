import {
  Wrench,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { AgentMarkdownContent } from "./AgentMarkdownContent";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentMessageBubbleProps {
  message: ChatMessageItem;
  onNavigateNote?: (notePath: string) => void;
}

function formatToolCallSummary(
  name: string,
  args: Record<string, unknown>,
): string {
  if (name === "read_note" && args.path) return `Read "${args.path}"`;
  if (name === "search_vault" && args.query)
    return `Search vault for "${args.query}"`;
  if (name === "create_note" && args.path) return `Create note "${args.path}"`;
  if (name === "edit_note" && args.path) return `Edit note "${args.path}"`;
  if (name === "delete_note" && args.path) return `Delete note "${args.path}"`;
  if (name === "move_note" && args.fromPath && args.toPath)
    return `Move "${args.fromPath}" → "${args.toPath}"`;
  if (name === "web_search" && args.query) return `Web search: "${args.query}"`;
  if (name === "calendar_list_events") return "Check calendar events";
  if (name === "calendar_create_event" && args.summary)
    return `Add calendar event: "${args.summary}"`;
  if (name === "calendar_sync_tasks")
    return "Export task reminders to Calendar";
  if (name === "wiki_synthesize_topic" && args.topic)
    return `Synthesize wiki topic: "${args.topic}"`;
  if (name === "wiki_update_index") return "Update Wiki Index (MOC)";
  return name;
}

export function AgentMessageBubble({
  message,
  onNavigateNote,
}: AgentMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`agent-message agent-message--${message.role}`}
      data-streaming={message.isStreaming || undefined}
    >
      {message.content && (
        <div className="agent-message__body">
          {isUser ? (
            <div className="agent-message__user-bubble">
              {message.content}
            </div>
          ) : (
            <AgentMarkdownContent
              content={message.content}
              onNavigateNote={onNavigateNote}
            />
          )}
          {message.isStreaming && (
            <span className="agent-message__cursor" aria-hidden="true" />
          )}
        </div>
      )}

      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="agent-message__tools">
          {message.toolCalls.map((tc) => {
            const result = message.toolResults?.find(
              (r) => r.toolCallId === tc.id,
            );
            const isError = result?.isError;
            return (
              <details
                key={tc.id}
                className="agent-tool-card"
                data-error={isError || undefined}
              >
                <summary className="agent-tool-card__header">
                  <span className="agent-tool-card__icon" aria-hidden="true">
                    <Wrench size={13} weight="bold" />
                  </span>
                  <span className="agent-tool-card__name">
                    {formatToolCallSummary(
                      tc.name,
                      (tc.arguments ?? {}) as Record<string, unknown>,
                    )}
                  </span>
                  {result && (
                    <span className="agent-tool-card__status">
                      {isError ? (
                        <WarningCircle
                          size={13}
                          weight="fill"
                          className="agent-tool-card__icon--error"
                        />
                      ) : (
                        <CheckCircle
                          size={13}
                          weight="fill"
                          className="agent-tool-card__icon--success"
                        />
                      )}
                    </span>
                  )}
                </summary>
                <pre className="agent-tool-card__args">
                  {JSON.stringify(tc.arguments, null, 2)}
                </pre>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { Wrench, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { AgentToolCall, AgentToolResult } from "@app/ai-api";

export interface AgentToolCallListProps {
  toolCalls: AgentToolCall[];
  toolResults?: AgentToolResult[];
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

export function AgentToolCallList({
  toolCalls,
  toolResults = [],
}: AgentToolCallListProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="agent-message__tools">
      {toolCalls.map((tc) => {
        const result = toolResults.find((r) => r.toolCallId === tc.id);
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
  );
}

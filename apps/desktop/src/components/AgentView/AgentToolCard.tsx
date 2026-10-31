import { useState } from "react";
import {
  Wrench,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  FileText,
  MagnifyingGlass,
  Globe,
  CaretRight,
  CaretDown,
} from "@phosphor-icons/react";
import type { AgentToolCall, AgentToolResult } from "./agentTypes";

export interface AgentToolCardProps {
  toolCall: AgentToolCall;
  result?: AgentToolResult;
  isStreaming?: boolean;
  onViewDiff?: (notePath: string) => void;
}

function getToolIcon(name: string) {
  if (name.includes("search")) return <MagnifyingGlass size={13} weight="bold" />;
  if (name.includes("note") || name.includes("file")) return <FileText size={13} weight="bold" />;
  if (name.includes("web")) return <Globe size={13} weight="bold" />;
  return <Wrench size={13} weight="bold" />;
}

function formatToolSummary(name: string, args: Record<string, unknown>): { title: string; targetPath?: string } {
  if (name === "read_note" && args.path) return { title: `Read "${args.path}"`, targetPath: String(args.path) };
  if (name === "search_vault" && args.query) return { title: `Search vault for "${args.query}"` };
  if (name === "create_note" && args.path) return { title: `Create note "${args.path}"`, targetPath: String(args.path) };
  if (name === "edit_note" && args.path) return { title: `Edit note "${args.path}"`, targetPath: String(args.path) };
  if (name === "delete_note" && args.path) return { title: `Delete note "${args.path}"`, targetPath: String(args.path) };
  if (name === "move_note" && args.fromPath && args.toPath) return { title: `Move "${args.fromPath}" → "${args.toPath}"` };
  if (name === "web_search" && args.query) return { title: `Web search "${args.query}"` };
  return { title: name };
}

export function AgentToolCard({
  toolCall,
  result,
  isStreaming = false,
  onViewDiff,
}: AgentToolCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const args = (toolCall.arguments ?? {}) as Record<string, unknown>;
  const { title, targetPath } = formatToolSummary(toolCall.name, args);
  const isError = result?.isError;
  const isPending = !result && isStreaming;

  return (
    <div
      className="agent-tool-card"
      data-status={isPending ? "pending" : isError ? "error" : "success"}
      data-open={isOpen || undefined}
    >
      <div className="agent-tool-card__header">
        <button
          type="button"
          className="agent-tool-card__toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <span className="agent-tool-card__icon">{getToolIcon(toolCall.name)}</span>
          <span className="agent-tool-card__title">{title}</span>
          <span className="agent-tool-card__caret">
            {isOpen ? <CaretDown size={11} /> : <CaretRight size={11} />}
          </span>
        </button>

        <div className="agent-tool-card__status-wrap">
          {targetPath && onViewDiff && (
            <button
              type="button"
              className="agent-tool-card__diff-btn"
              onClick={() => onViewDiff(targetPath)}
              title="View diff"
            >
              View diff
            </button>
          )}

          <span className="agent-tool-card__status-icon">
            {isPending ? (
              <CircleNotch size={13} className="agent-tool-card__spinner" />
            ) : isError ? (
              <WarningCircle size={13} weight="fill" className="agent-tool-card__icon--error" />
            ) : (
              <CheckCircle size={13} weight="fill" className="agent-tool-card__icon--success" />
            )}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="agent-tool-card__body">
          <pre className="agent-tool-card__args">
            {JSON.stringify({ arguments: args, output: result?.output }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

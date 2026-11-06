import { FileText, ArrowRight } from "@phosphor-icons/react";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentEditedFilesBarProps {
  message: ChatMessageItem;
  onNavigateNote?: (notePath: string) => void;
}

export function getEditedNotesFromMessage(message: ChatMessageItem): string[] {
  const result = new Set<string>();

  for (const tc of message.toolCalls || []) {
    if (tc.name === "edit_note" || tc.name === "append_to_note") {
      const p = String(tc.arguments?.path || "").trim();
      if (p) result.add(p);
    }
  }

  if (result.size === 0 && message.content && message.role === "assistant") {
    const editMatch =
      /(?:(?:updated|edited|modified|appended to)\s+(?:the\s+)?(?:(?:note|file)\s+)?["'‘“]?([a-zA-Z0-9_./-]+\.md|[a-zA-Z0-9_./-]+))/i.exec(
        message.content,
      );
    if (editMatch && editMatch[1]) {
      const raw = editMatch[1].replace(/["'’”.,!]+$/g, "");
      if (raw.endsWith(".md") || raw.includes("/")) {
        result.add(raw);
      }
    }
  }

  return Array.from(result);
}

export function AgentEditedFilesBar({
  message,
  onNavigateNote,
}: AgentEditedFilesBarProps) {
  const editedNotes = getEditedNotesFromMessage(message);
  if (editedNotes.length === 0) return null;

  return (
    <div className="agent-edited-files" data-testid="agent-edited-files-bar">
      <div className="agent-edited-files__header">
        <FileText
          size={14}
          weight="duotone"
          className="agent-edited-files__icon"
        />
        <span className="agent-edited-files__title">
          Edited file{editedNotes.length > 1 ? "s" : ""}:
        </span>
      </div>
      <div className="agent-edited-files__items">
        {editedNotes.map((notePath) => (
          <button
            key={notePath}
            type="button"
            className="agent-edited-files__link"
            onClick={() => onNavigateNote?.(notePath)}
            aria-label={`Open note "${notePath}"`}
            title={`Open note "${notePath}" in editor`}
          >
            <span className="agent-edited-files__name">{notePath}</span>
            <span className="agent-edited-files__action">
              Open note <ArrowRight size={11} weight="bold" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

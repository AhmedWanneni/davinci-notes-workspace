import { X, FileText, Folder } from "@phosphor-icons/react";
import type { MentionItem } from "./agentTypes";

export interface AgentMentionChipProps {
  mention: MentionItem;
  onRemove?: (id: string) => void;
}

export function AgentMentionChip({ mention, onRemove }: AgentMentionChipProps) {
  return (
    <div className="agent-mention-chip">
      {mention.type === "folder" ? (
        <Folder size={12} className="agent-mention-chip__icon" />
      ) : (
        <FileText size={12} className="agent-mention-chip__icon" />
      )}
      <span className="agent-mention-chip__label" title={mention.path}>
        {mention.label}
      </span>
      {onRemove && (
        <button
          type="button"
          className="agent-mention-chip__remove"
          onClick={() => onRemove(mention.id)}
          aria-label={`Remove ${mention.label}`}
        >
          <X size={10} weight="bold" />
        </button>
      )}
    </div>
  );
}

import { X } from "@phosphor-icons/react";
import type { ChatAttachmentItem } from "./agentTypes";

export interface AgentImageThumbnailProps {
  attachment: ChatAttachmentItem;
  onRemove?: (id: string) => void;
  onClick?: (attachment: ChatAttachmentItem) => void;
}

export function AgentImageThumbnail({
  attachment,
  onRemove,
  onClick,
}: AgentImageThumbnailProps) {
  return (
    <div className="agent-image-thumbnail">
      <button
        type="button"
        className="agent-image-thumbnail__btn"
        onClick={() => onClick?.(attachment)}
        title={attachment.name}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="agent-image-thumbnail__img"
        />
      </button>

      {onRemove && (
        <button
          type="button"
          className="agent-image-thumbnail__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(attachment.id);
          }}
          aria-label={`Remove image ${attachment.name}`}
          title="Remove image"
        >
          <X size={11} weight="bold" />
        </button>
      )}
    </div>
  );
}

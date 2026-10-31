import { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import type { ChatAttachmentItem } from "./agentTypes";

export interface AgentImageViewerModalProps {
  attachment: ChatAttachmentItem | null;
  onClose: () => void;
}

export function AgentImageViewerModal({
  attachment,
  onClose,
}: AgentImageViewerModalProps) {
  useEffect(() => {
    if (!attachment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attachment, onClose]);

  if (!attachment) return null;

  return (
    <div
      className="agent-image-modal"
      role="dialog"
      aria-modal="true"
      aria-label={attachment.name}
      onClick={onClose}
    >
      <div
        className="agent-image-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="agent-image-modal__close"
          onClick={onClose}
          aria-label="Close image viewer"
        >
          <X size={18} weight="bold" />
        </button>
        <img
          src={attachment.url}
          alt={attachment.name}
          className="agent-image-modal__img"
        />
        <div className="agent-image-modal__caption">{attachment.name}</div>
      </div>
    </div>
  );
}

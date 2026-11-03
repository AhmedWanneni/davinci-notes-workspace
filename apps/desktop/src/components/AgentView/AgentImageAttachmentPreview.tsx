import { X } from "@phosphor-icons/react";
import type { PromptAttachmentItem } from "./usePromptAttachments";
import styles from "./AgentPromptBar.module.scss";

export interface AgentImageAttachmentPreviewProps {
  images: string[];
  items?: PromptAttachmentItem[];
  onRemove: (index: number) => void;
  onRemoveItem?: (id: string) => void;
}

export function AgentImageAttachmentPreview({
  images,
  items = [],
  onRemove,
  onRemoveItem,
}: AgentImageAttachmentPreviewProps) {
  if (images.length === 0 && items.length === 0) return null;

  return (
    <div
      className={styles["prompt-bar__images-strip"]}
      aria-label="Prompt attachments"
    >
      {images.map((img, idx) => (
        <div key={`img-${idx}`} className={styles["prompt-bar__image-thumb-wrap"]}>
          <img
            src={img}
            alt={`Attachment ${idx + 1}`}
            className={styles["prompt-bar__image-thumb"]}
          />
          <button
            type="button"
            className={styles["prompt-bar__image-remove-btn"]}
            onClick={() => onRemove(idx)}
            aria-label="Remove image"
            title="Remove image"
          >
            <X size={12} weight="bold" />
          </button>
        </div>
      ))}

      {items.map((item) => (
        <div
          key={item.id}
          className={styles["prompt-bar__attachment-card"]}
          title={item.name}
        >
          <span className={styles["prompt-bar__attachment-title"]}>
            {item.name}
          </span>
          <span className={styles["prompt-bar__attachment-badge"]}>
            {item.badge}
          </span>
          {onRemoveItem && (
            <button
              type="button"
              className={styles["prompt-bar__image-remove-btn"]}
              onClick={() => onRemoveItem(item.id)}
              aria-label={`Remove ${item.name}`}
              title={`Remove ${item.name}`}
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

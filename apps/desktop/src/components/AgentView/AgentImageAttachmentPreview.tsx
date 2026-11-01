import { X } from "@phosphor-icons/react";
import styles from "./AgentPromptBar.module.scss";

export interface AgentImageAttachmentPreviewProps {
  images: string[];
  onRemove: (index: number) => void;
}

export function AgentImageAttachmentPreview({
  images,
  onRemove,
}: AgentImageAttachmentPreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className={styles["prompt-bar__images-strip"]}>
      {images.map((img, idx) => (
        <div key={idx} className={styles["prompt-bar__image-thumb-wrap"]}>
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
    </div>
  );
}

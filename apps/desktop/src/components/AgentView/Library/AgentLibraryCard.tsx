import {
  Check,
  Circle,
  PencilSimple,
  Trash,
  PaperPlaneTilt,
  Eye,
  FileText,
} from "@phosphor-icons/react";
import type { LibraryItem } from "@app/ai-agent";
import styles from "./AgentLibraryCard.module.scss";

export interface AgentLibraryCardProps {
  item: LibraryItem;
  projectName?: string;
  isSelected?: boolean;
  onToggleSelect: () => void;
  onUseInPrompt: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
  onOpenNote?: (filePath: string) => void;
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp || typeof timestamp !== "number" || isNaN(timestamp))
    return "Recently";
  const diff = Date.now() - timestamp;
  if (diff < 0) return "Just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function AgentLibraryCard({
  item,
  projectName = "General",
  isSelected = false,
  onToggleSelect,
  onUseInPrompt,
  onEdit,
  onDelete,
  onViewDetails,
  onOpenNote,
}: AgentLibraryCardProps) {
  if (!item) return null;
  const typeClass =
    item.type === "prompt"
      ? styles["type-prompt"]
      : item.type === "skill"
        ? styles["type-skill"]
        : styles["type-rule"];

  return (
    <div
      className={`${styles["library-card"]} ${isSelected ? styles["is-selected"] : ""}`}
      role="article"
      aria-label={`${item.type}: ${item.title}`}
    >
      <div className={styles["library-card__top"]}>
        <h3
          className={styles["library-card__title"]}
          onClick={onEdit}
          style={{ cursor: "pointer" }}
          title="Click to open and edit in editor"
        >
          {item.title}
        </h3>
        <button
          type="button"
          className={`${styles["library-card__select-btn"]} ${isSelected ? styles["is-checked"] : ""}`}
          onClick={onToggleSelect}
          aria-label={
            isSelected ? `Deselect ${item.title}` : `Select ${item.title}`
          }
          title={isSelected ? "Deselect item" : "Select item"}
        >
          {isSelected ? (
            <Check size={12} weight="bold" />
          ) : (
            <Circle size={10} />
          )}
        </button>
      </div>

      <div className={styles["library-card__meta"]}>
        <span className={`${styles["library-card__badge"]} ${typeClass}`}>
          {item.type}
        </span>
        <span
          className={styles["library-card__project-tag"]}
          title={`Project: ${projectName}`}
        >
          {projectName}
        </span>
        {item.filePath && (
          <span
            className={styles["library-card__path-tag"]}
            title={`Open file: ${item.filePath}`}
            onClick={() => onOpenNote?.(item.filePath!)}
          >
            {item.filePath}
          </span>
        )}
      </div>

      <p className={styles["library-card__description"]}>
        {item.description || item.content}
      </p>

      <div className={styles["library-card__footer"]}>
        <span className={styles["library-card__time"]}>
          Updated{" "}
          {formatRelativeTime(item.updatedAt || item.createdAt || Date.now())}
        </span>
        <div className={styles["library-card__actions"]}>
          {item.filePath && onOpenNote && (
            <button
              type="button"
              className={styles["library-card__action-btn"]}
              onClick={() => onOpenNote(item.filePath!)}
              title={`Open ${item.filePath} in editor`}
              aria-label={`Open ${item.title} in editor`}
            >
              <FileText size={12} />
            </button>
          )}
          <button
            type="button"
            className={`${styles["library-card__action-btn"]} ${styles["is-primary"]}`}
            onClick={onUseInPrompt}
            title="Use in prompt"
            aria-label={`Use ${item.title} in prompt`}
          >
            <PaperPlaneTilt size={12} weight="fill" />
          </button>
          <button
            type="button"
            className={styles["library-card__action-btn"]}
            onClick={onEdit}
            title="Edit in editor"
            aria-label={`Edit ${item.title}`}
          >
            <PencilSimple size={12} />
          </button>
          {onViewDetails && (
            <button
              type="button"
              className={styles["library-card__action-btn"]}
              onClick={onViewDetails}
              title="View details"
              aria-label={`View ${item.title}`}
            >
              <Eye size={12} />
            </button>
          )}
          <button
            type="button"
            className={`${styles["library-card__action-btn"]} ${styles["is-danger"]}`}
            onClick={onDelete}
            title="Delete item"
            aria-label={`Delete ${item.title}`}
          >
            <Trash size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

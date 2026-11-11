import {
  Check,
  Circle,
  FileText,
  PaperPlaneTilt,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import type { LibraryItem } from "@app/ai-agent";
import styles from "./AgentLibraryBoard.module.scss";

export interface AgentLibraryListRowProps {
  item: LibraryItem;
  projectName: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUseInPrompt: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenNote: (path: string) => void;
}

export function AgentLibraryListRow({
  item,
  projectName,
  isSelected,
  onToggleSelect,
  onUseInPrompt,
  onEdit,
  onDelete,
  onOpenNote,
}: AgentLibraryListRowProps) {
  return (
    <div
      className={`${styles["library-board__list-row"]} ${isSelected ? styles["is-selected"] : ""}`}
    >
      <div className={styles["library-board__list-left"]}>
        <button
          type="button"
          className={styles["library-card__select-btn"]}
          onClick={onToggleSelect}
          aria-label={
            isSelected ? `Deselect ${item.title}` : `Select ${item.title}`
          }
        >
          {isSelected ? (
            <Check size={12} weight="bold" />
          ) : (
            <Circle size={10} />
          )}
        </button>
        <span
          className={styles["library-board__list-title"]}
          onClick={onEdit}
          style={{ cursor: "pointer" }}
          title="Click to open and edit in editor"
        >
          {item.title}
        </span>
        <span className={styles["library-card__project-tag"]}>
          {projectName}
        </span>
        {item.filePath && (
          <span
            className={styles["library-card__path-tag"]}
            title={`Open file: ${item.filePath}`}
            onClick={() => onOpenNote(item.filePath!)}
          >
            {item.filePath}
          </span>
        )}
      </div>
      <div className={styles["library-card__actions"]}>
        {item.filePath && (
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
  );
}

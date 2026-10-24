import React, { useState, useRef, useEffect } from "react";
import type { KanbanCard } from "./kanbanTypes";
import { renderInlineMarkdown, type InlineRenderOptions } from "./renderInlineMarkdown";
import styles from "./KanbanCardComponent.module.scss";

export interface KanbanCardProps extends InlineRenderOptions {
  card: KanbanCard;
  laneId: string;
  isFocused?: boolean;
  isEditing?: boolean;
  editingDraft?: string;
  onToggleComplete: (cardId: string) => void;
  onStartEdit: (cardId: string, currentTitle: string) => void;
  onSaveEdit: (cardId: string, newTitle: string) => void;
  onCancelEdit: () => void;
  onDeleteCard: (cardId: string) => void;
  onDragStart: (e: React.DragEvent, cardId: string, laneId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick: (cardId: string) => void;
}

export function KanbanCardComponent({
  card,
  laneId,
  isFocused = false,
  isEditing = false,
  editingDraft,
  onToggleComplete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteCard,
  onDragStart,
  onDragEnd,
  onClick,
  onLinkClick,
  onTagClick,
}: KanbanCardProps) {
  const [draft, setDraft] = useState(editingDraft ?? card.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(editingDraft ?? card.title);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, editingDraft, card.title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSaveEdit(card.id, draft.trim() || card.title);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      onSaveEdit(card.id, draft.trim() || card.title);
    }
  };

  const cardClasses = [
    styles["kanban-card"],
    isFocused ? styles["is-focused"] : "",
    card.completed ? styles["is-completed"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClasses}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, card.id, laneId)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(card.id)}
      onDoubleClick={() => onStartEdit(card.id, card.title)}
      tabIndex={0}
      data-card-id={card.id}
      data-lane-id={laneId}
    >
      <div className={styles["card-header-row"]}>
        <input
          type="checkbox"
          checked={card.completed}
          className={styles["card-checkbox"]}
          onChange={() => onToggleComplete(card.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Mark task ${card.title} as ${card.completed ? "incomplete" : "complete"}`}
        />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className={styles["card-edit-input"]}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className={styles["card-title"]}>
            {renderInlineMarkdown(card.title, { onLinkClick, onTagClick })}
          </div>
        )}

        {!isEditing && (
          <button
            type="button"
            className={styles["card-delete-button"]}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCard(card.id);
            }}
            aria-label="Delete card"
            title="Delete card"
          >
            ✕
          </button>
        )}
      </div>

      {!isEditing && card.body && (
        <div className={styles["card-body-preview"]}>
          {renderInlineMarkdown(card.body, { onLinkClick, onTagClick })}
        </div>
      )}
    </div>
  );
}

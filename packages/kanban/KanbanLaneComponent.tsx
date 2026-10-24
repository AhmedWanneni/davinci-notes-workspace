import React, { useState, useRef, useEffect } from "react";
import type { KanbanLane } from "./kanbanTypes";
import { KanbanCardComponent } from "./KanbanCardComponent";
import type { InlineRenderOptions } from "./renderInlineMarkdown";
import styles from "./KanbanLaneComponent.module.scss";

export interface KanbanLaneProps extends InlineRenderOptions {
  lane: KanbanLane;
  focusedCardId?: string | null;
  editingCardId?: string | null;
  editingCardDraft?: string;
  onRenameLane: (laneId: string, newTitle: string) => void;
  onDeleteLane: (laneId: string) => void;
  onAddCard: (laneId: string, title: string) => void;
  onToggleComplete: (cardId: string) => void;
  onStartEditCard: (cardId: string, currentTitle: string) => void;
  onSaveEditCard: (cardId: string, newTitle: string) => void;
  onCancelEditCard: () => void;
  onDeleteCard: (cardId: string) => void;
  onCardClick: (cardId: string) => void;
  onCardDragStart: (e: React.DragEvent, cardId: string, laneId: string) => void;
  onLaneDragStart: (e: React.DragEvent, laneId: string) => void;
  onDropOnLane: (e: React.DragEvent, targetLaneId: string) => void;
  onDropOnCard: (e: React.DragEvent, targetLaneId: string, targetCardId: string) => void;
}

export function KanbanLaneComponent({
  lane,
  focusedCardId,
  editingCardId,
  editingCardDraft,
  onRenameLane,
  onDeleteLane,
  onAddCard,
  onToggleComplete,
  onStartEditCard,
  onSaveEditCard,
  onCancelEditCard,
  onDeleteCard,
  onCardClick,
  onCardDragStart,
  onLaneDragStart,
  onDropOnLane,
  onDropOnCard,
  onLinkClick,
  onTagClick,
}: KanbanLaneProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(lane.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const addCardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (isAddingCard) {
      addCardInputRef.current?.focus();
    }
  }, [isAddingCard]);

  const handleRenameSubmit = () => {
    const clean = renameDraft.trim();
    if (clean && clean !== lane.title) {
      onRenameLane(lane.id, clean);
    }
    setIsRenaming(false);
  };

  const handleDeleteClick = () => {
    if (lane.cards.length > 0) {
      const ok = window.confirm(
        `Lane "${lane.title}" contains ${lane.cards.length} card(s). Delete lane and all cards?`,
      );
      if (!ok) return;
    }
    onDeleteLane(lane.id);
  };

  const handleAddCardSubmit = () => {
    const clean = newCardTitle.trim();
    if (clean) {
      onAddCard(lane.id, clean);
      setNewCardTitle("");
    }
    setIsAddingCard(false);
  };

  return (
    <div
      className={styles["kanban-lane"]}
      data-lane-id={lane.id}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => onDropOnLane(e, lane.id)}
    >
      <div
        className={styles["lane-header"]}
        draggable={!isRenaming}
        onDragStart={(e) => onLaneDragStart(e, lane.id)}
      >
        <div className={styles["lane-title-group"]}>
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              className={styles["lane-title-input"]}
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setRenameDraft(lane.title);
                  setIsRenaming(false);
                }
              }}
              onBlur={handleRenameSubmit}
            />
          ) : (
            <span
              className={styles["lane-title"]}
              onDoubleClick={() => setIsRenaming(true)}
              title="Double click to rename"
            >
              {lane.title}
            </span>
          )}
          <span className={styles["lane-count"]}>{lane.cards.length}</span>
        </div>

        <div className={styles["lane-actions"]}>
          <button
            type="button"
            className={styles["lane-action-button"]}
            onClick={() => setIsRenaming(true)}
            aria-label="Rename lane"
            title="Rename lane"
          >
            ✎
          </button>
          <button
            type="button"
            className={styles["lane-action-button"]}
            onClick={handleDeleteClick}
            aria-label="Delete lane"
            title="Delete lane"
          >
            ✕
          </button>
        </div>
      </div>

      <div className={styles["lane-cards-list"]}>
        {lane.cards.map((card) => (
          <div
            key={card.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.stopPropagation();
              onDropOnCard(e, lane.id, card.id);
            }}
          >
            <KanbanCardComponent
              card={card}
              laneId={lane.id}
              isFocused={focusedCardId === card.id}
              isEditing={editingCardId === card.id}
              editingDraft={editingCardId === card.id ? editingCardDraft : undefined}
              onToggleComplete={onToggleComplete}
              onStartEdit={onStartEditCard}
              onSaveEdit={onSaveEditCard}
              onCancelEdit={onCancelEditCard}
              onDeleteCard={onDeleteCard}
              onDragStart={onCardDragStart}
              onDragEnd={() => {}}
              onClick={onCardClick}
              onLinkClick={onLinkClick}
              onTagClick={onTagClick}
            />
          </div>
        ))}
      </div>

      <div className={styles["lane-footer"]}>
        {isAddingCard ? (
          <div className={styles["add-card-input-container"]}>
            <input
              ref={addCardInputRef}
              type="text"
              className={styles["add-card-input"]}
              placeholder="Card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCardSubmit();
                if (e.key === "Escape") setIsAddingCard(false);
              }}
            />
            <div className={styles["add-card-actions"]}>
              <button
                type="button"
                className={styles["add-card-confirm"]}
                onClick={handleAddCardSubmit}
              >
                Add
              </button>
              <button
                type="button"
                className={styles["add-card-cancel"]}
                onClick={() => setIsAddingCard(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles["add-card-button"]}
            onClick={() => setIsAddingCard(true)}
          >
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}

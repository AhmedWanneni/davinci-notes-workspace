import React, { useState, useEffect, useRef, useCallback } from "react";
import type { KanbanBoard } from "./kanbanTypes";
import { parseBoard } from "./parseBoard";
import { serializeBoard } from "./serializeBoard";
import { editCard, toggleCard, addCard, deleteCard } from "./cardOperations";
import { addLane, renameLane, deleteLane } from "./laneOperations";
import { KanbanLaneComponent } from "./KanbanLaneComponent";
import { useKanbanKeyboardNav } from "./useKanbanKeyboardNav";
import { useKanbanDragDrop } from "./useKanbanDragDrop";
import styles from "./KanbanView.module.scss";

export interface KanbanViewProps {
  path: string;
  initialContent: string;
  onContentChange: (path: string, content: string) => void;
  onLinkClick?: (target: string) => void;
  onTagClick?: (tag: string) => void;
}

export function KanbanView({
  path,
  initialContent,
  onContentChange,
  onLinkClick,
  onTagClick,
}: KanbanViewProps) {
  const [board, setBoard] = useState<KanbanBoard>(() => parseBoard(initialContent));
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<string>("");

  const [isAddingLane, setIsAddingLane] = useState(false);
  const [newLaneTitle, setNewLaneTitle] = useState("");
  const addLaneInputRef = useRef<HTMLInputElement>(null);

  const boardRef = useRef<KanbanBoard>(board);
  boardRef.current = board;

  useEffect(() => {
    setBoard(parseBoard(initialContent));
  }, [initialContent]);

  useEffect(() => {
    if (isAddingLane) addLaneInputRef.current?.focus();
  }, [isAddingLane]);

  const commitBoard = useCallback(
    (nextBoard: KanbanBoard) => {
      const nextText = serializeBoard(nextBoard);
      setBoard(nextBoard);
      if (nextText !== initialContent) {
        onContentChange(path, nextText);
      }
    },
    [initialContent, onContentChange, path],
  );

  const handleToggleComplete = useCallback(
    (cardId: string) => {
      commitBoard(toggleCard({ ...boardRef.current }, cardId));
    },
    [commitBoard],
  );

  const handleStartEditCard = useCallback((cardId: string, currentTitle: string) => {
    setEditingCardId(cardId);
    setEditingDraft(currentTitle);
    setFocusedCardId(cardId);
  }, []);

  const handleSaveEditCard = useCallback(
    (cardId: string, newTitle: string) => {
      setEditingCardId(null);
      setEditingDraft("");
      commitBoard(editCard({ ...boardRef.current }, cardId, newTitle));
    },
    [commitBoard],
  );

  const handleCancelEditCard = useCallback(() => {
    setEditingCardId(null);
    setEditingDraft("");
  }, []);

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      if (focusedCardId === cardId) setFocusedCardId(null);
      if (editingCardId === cardId) handleCancelEditCard();
      commitBoard(deleteCard({ ...boardRef.current }, cardId));
    },
    [commitBoard, focusedCardId, editingCardId, handleCancelEditCard],
  );

  const handleAddCard = useCallback(
    (laneId: string, title: string) => {
      commitBoard(addCard({ ...boardRef.current }, laneId, title));
    },
    [commitBoard],
  );

  const handleRenameLane = useCallback(
    (laneId: string, newTitle: string) => {
      commitBoard(renameLane({ ...boardRef.current }, laneId, newTitle));
    },
    [commitBoard],
  );

  const handleDeleteLane = useCallback(
    (laneId: string) => {
      commitBoard(deleteLane({ ...boardRef.current }, laneId));
    },
    [commitBoard],
  );

  const handleCreateLaneSubmit = () => {
    const clean = newLaneTitle.trim();
    if (clean) {
      commitBoard(addLane({ ...boardRef.current }, clean));
      setNewLaneTitle("");
    }
    setIsAddingLane(false);
  };

  const { handleCardDragStart, handleLaneDragStart, handleDropOnLane, handleDropOnCard } =
    useKanbanDragDrop({ boardRef, commitBoard });

  const handleKeyDown = useKanbanKeyboardNav({
    board,
    focusedCardId,
    editingCardId,
    setFocusedCardId,
    onStartEditCard: handleStartEditCard,
  });

  return (
    <div
      className={styles["kanban-view"]}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Kanban board"
    >
      <div className={styles["kanban-board"]}>
        {board.lanes.map((lane) => (
          <KanbanLaneComponent
            key={lane.id}
            lane={lane}
            focusedCardId={focusedCardId}
            editingCardId={editingCardId}
            editingCardDraft={editingDraft}
            onRenameLane={handleRenameLane}
            onDeleteLane={handleDeleteLane}
            onAddCard={handleAddCard}
            onToggleComplete={handleToggleComplete}
            onStartEditCard={handleStartEditCard}
            onSaveEditCard={handleSaveEditCard}
            onCancelEditCard={handleCancelEditCard}
            onDeleteCard={handleDeleteCard}
            onCardClick={(id) => setFocusedCardId(id)}
            onCardDragStart={handleCardDragStart}
            onLaneDragStart={handleLaneDragStart}
            onDropOnLane={handleDropOnLane}
            onDropOnCard={handleDropOnCard}
            onLinkClick={onLinkClick}
            onTagClick={onTagClick}
          />
        ))}

        <div className={styles["add-lane-column"]}>
          {isAddingLane ? (
            <div className={styles["add-lane-input-container"]}>
              <input
                ref={addLaneInputRef}
                type="text"
                className={styles["add-lane-input"]}
                placeholder="Lane title..."
                value={newLaneTitle}
                onChange={(e) => setNewLaneTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateLaneSubmit();
                  if (e.key === "Escape") setIsAddingLane(false);
                }}
              />
              <div className={styles["add-lane-actions"]}>
                <button
                  type="button"
                  className={styles["add-lane-confirm"]}
                  onClick={handleCreateLaneSubmit}
                >
                  Add lane
                </button>
                <button
                  type="button"
                  className={styles["add-lane-cancel"]}
                  onClick={() => setIsAddingLane(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles["add-lane-button"]}
              onClick={() => setIsAddingLane(true)}
            >
              + Add lane
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

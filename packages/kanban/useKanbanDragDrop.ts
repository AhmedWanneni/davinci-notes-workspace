import { useRef, useCallback } from "react";
import type { KanbanBoard } from "./kanbanTypes";
import { moveCard } from "./cardOperations";
import { reorderLanes } from "./laneOperations";

interface DragState {
  type: "card" | "lane";
  cardId?: string;
  sourceLaneId?: string;
  laneId?: string;
}

interface UseKanbanDragDropOptions {
  boardRef: React.MutableRefObject<KanbanBoard>;
  commitBoard: (board: KanbanBoard) => void;
}

export function useKanbanDragDrop({
  boardRef,
  commitBoard,
}: UseKanbanDragDropOptions) {
  const dragStateRef = useRef<DragState | null>(null);

  const handleCardDragStart = useCallback(
    (e: React.DragEvent, cardId: string, laneId: string) => {
      dragStateRef.current = { type: "card", cardId, sourceLaneId: laneId };
      e.dataTransfer.setData("text/plain", cardId);
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleLaneDragStart = useCallback((e: React.DragEvent, laneId: string) => {
    dragStateRef.current = { type: "lane", laneId };
    e.dataTransfer.setData("text/plain", laneId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDropOnLane = useCallback(
    (e: React.DragEvent, targetLaneId: string) => {
      e.preventDefault();
      const drag = dragStateRef.current;
      dragStateRef.current = null;
      if (!drag) return;

      if (drag.type === "card" && drag.cardId) {
        const next = moveCard({ ...boardRef.current }, drag.cardId, targetLaneId);
        commitBoard(next);
      } else if (drag.type === "lane" && drag.laneId && drag.laneId !== targetLaneId) {
        const currentIds = boardRef.current.lanes.map((l) => l.id);
        const fromIdx = currentIds.indexOf(drag.laneId);
        const toIdx = currentIds.indexOf(targetLaneId);
        if (fromIdx !== -1 && toIdx !== -1) {
          currentIds.splice(fromIdx, 1);
          currentIds.splice(toIdx, 0, drag.laneId);
          const next = reorderLanes({ ...boardRef.current }, currentIds);
          commitBoard(next);
        }
      }
    },
    [boardRef, commitBoard],
  );

  const handleDropOnCard = useCallback(
    (e: React.DragEvent, targetLaneId: string, targetCardId: string) => {
      e.preventDefault();
      const drag = dragStateRef.current;
      dragStateRef.current = null;
      if (!drag || drag.type !== "card" || !drag.cardId || drag.cardId === targetCardId) return;

      const targetLane = boardRef.current.lanes.find((l) => l.id === targetLaneId);
      if (!targetLane) return;

      const targetIdx = targetLane.cards.findIndex((c) => c.id === targetCardId);
      const next = moveCard(
        { ...boardRef.current },
        drag.cardId,
        targetLaneId,
        targetIdx >= 0 ? targetIdx : 0,
      );
      commitBoard(next);
    },
    [boardRef, commitBoard],
  );

  return {
    handleCardDragStart,
    handleLaneDragStart,
    handleDropOnLane,
    handleDropOnCard,
  };
}

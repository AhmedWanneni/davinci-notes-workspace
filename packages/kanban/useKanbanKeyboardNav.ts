import { useCallback } from "react";
import type { KanbanBoard } from "./kanbanTypes";

interface UseKanbanKeyboardNavOptions {
  board: KanbanBoard;
  focusedCardId: string | null;
  editingCardId: string | null;
  setFocusedCardId: (id: string | null) => void;
  onStartEditCard: (cardId: string, currentTitle: string) => void;
}

export function useKanbanKeyboardNav({
  board,
  focusedCardId,
  editingCardId,
  setFocusedCardId,
  onStartEditCard,
}: UseKanbanKeyboardNavOptions) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCardId) return;
      if (board.lanes.length === 0) return;

      if (e.key === "Enter" && focusedCardId) {
        e.preventDefault();
        for (const lane of board.lanes) {
          const card = lane.cards.find((c) => c.id === focusedCardId);
          if (card) {
            onStartEditCard(card.id, card.title);
            return;
          }
        }
      }

      if (e.key === "Escape") {
        setFocusedCardId(null);
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        let currentLaneIdx = 0;
        let currentCardIdx = 0;
        let found = false;

        for (let l = 0; l < board.lanes.length; l += 1) {
          const lane = board.lanes[l];
          for (let c = 0; c < lane.cards.length; c += 1) {
            if (lane.cards[c].id === focusedCardId) {
              currentLaneIdx = l;
              currentCardIdx = c;
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          const firstCard = board.lanes[0]?.cards[0];
          if (firstCard) setFocusedCardId(firstCard.id);
          return;
        }

        if (e.key === "ArrowUp") {
          const lane = board.lanes[currentLaneIdx];
          const nextIdx = Math.max(0, currentCardIdx - 1);
          setFocusedCardId(lane.cards[nextIdx]?.id ?? null);
        } else if (e.key === "ArrowDown") {
          const lane = board.lanes[currentLaneIdx];
          const nextIdx = Math.min(lane.cards.length - 1, currentCardIdx + 1);
          setFocusedCardId(lane.cards[nextIdx]?.id ?? null);
        } else if (e.key === "ArrowLeft") {
          const nextLaneIdx = Math.max(0, currentLaneIdx - 1);
          const nextLane = board.lanes[nextLaneIdx];
          const nextCard = nextLane.cards[Math.min(currentCardIdx, nextLane.cards.length - 1)];
          if (nextCard) setFocusedCardId(nextCard.id);
        } else if (e.key === "ArrowRight") {
          const nextLaneIdx = Math.min(board.lanes.length - 1, currentLaneIdx + 1);
          const nextLane = board.lanes[nextLaneIdx];
          const nextCard = nextLane.cards[Math.min(currentCardIdx, nextLane.cards.length - 1)];
          if (nextCard) setFocusedCardId(nextCard.id);
        }
      }
    },
    [board, editingCardId, focusedCardId, onStartEditCard, setFocusedCardId],
  );
}

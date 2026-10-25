import { useState, useCallback } from "react";

export interface CellCoord {
  row: number;
  col: number;
}

export interface UseDatabaseKeyboardNavOptions {
  rowCount: number;
  colCount: number;
  onStartEdit?: (coord: CellCoord) => void;
}

export function useDatabaseKeyboardNav({
  rowCount,
  colCount,
  onStartEdit,
}: UseDatabaseKeyboardNavOptions) {
  const [focusedCell, setFocusedCell] = useState<CellCoord | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);

  const startEditing = useCallback(
    (coord: CellCoord) => {
      setFocusedCell(coord);
      setEditingCell(coord);
      onStartEdit?.(coord);
    },
    [onStartEdit],
  );

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) {
        if (e.key === "Escape") {
          e.preventDefault();
          stopEditing();
        }
        return;
      }

      if (!focusedCell) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setFocusedCell((prev) =>
            prev ? { ...prev, row: Math.max(0, prev.row - 1) } : null,
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedCell((prev) =>
            prev
              ? { ...prev, row: Math.min(rowCount - 1, prev.row + 1) }
              : null,
          );
          break;
        case "ArrowLeft":
          e.preventDefault();
          setFocusedCell((prev) =>
            prev ? { ...prev, col: Math.max(0, prev.col - 1) } : null,
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          setFocusedCell((prev) =>
            prev
              ? { ...prev, col: Math.min(colCount - 1, prev.col + 1) }
              : null,
          );
          break;
        case "Tab":
          e.preventDefault();
          setFocusedCell((prev) => {
            if (!prev) return null;
            if (e.shiftKey) {
              if (prev.col > 0) return { ...prev, col: prev.col - 1 };
              if (prev.row > 0) return { row: prev.row - 1, col: colCount - 1 };
              return prev;
            } else {
              if (prev.col < colCount - 1)
                return { ...prev, col: prev.col + 1 };
              if (prev.row < rowCount - 1) return { row: prev.row + 1, col: 0 };
              return prev;
            }
          });
          break;
        case "Enter":
          e.preventDefault();
          startEditing(focusedCell);
          break;
        case "Escape":
          setFocusedCell(null);
          break;
      }
    },
    [editingCell, focusedCell, rowCount, colCount, startEditing, stopEditing],
  );

  return {
    focusedCell,
    editingCell,
    setFocusedCell,
    startEditing,
    stopEditing,
    handleKeyDown,
  };
}

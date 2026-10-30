import { useState, useCallback, useMemo } from "react";
import styles from "./TableGridPicker.module.scss";

export interface TableGridPickerProps {
  onSelect: (cols: number, rows: number) => void;
  maxCols?: number;
  maxRows?: number;
}

export function TableGridPicker({
  onSelect,
  maxCols = 8,
  maxRows = 8,
}: TableGridPickerProps) {
  const [hoverCols, setHoverCols] = useState(1);
  const [hoverRows, setHoverRows] = useState(1);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleCellHover = useCallback((col: number, row: number) => {
    setHoverCols(col);
    setHoverRows(row);
  }, []);

  const handleCellClick = useCallback(
    (col: number, row: number) => {
      onSelect(col, row);
    },
    [onSelect],
  );

  const gridCells = useMemo(() => {
    const cells = [];
    for (let r = 1; r <= maxRows; r++) {
      for (let c = 1; c <= maxCols; c++) {
        const isHighlighted = c <= hoverCols && r <= hoverRows;
        cells.push({ col: c, row: r, isHighlighted });
      }
    }
    return cells;
  }, [maxCols, maxRows, hoverCols, hoverRows]);

  return (
    <div
      className={styles["table-grid-picker"]}
      role="grid"
      aria-label="Table dimension picker"
      onMouseLeave={() => {
        setIsMouseDown(false);
      }}
      onMouseUp={() => {
        if (isMouseDown) {
          setIsMouseDown(false);
          onSelect(hoverCols, hoverRows);
        }
      }}
    >
      <div
        className={styles["table-grid-picker__grid"]}
        style={{
          gridTemplateColumns: `repeat(${maxCols}, 18px)`,
          gridTemplateRows: `repeat(${maxRows}, 18px)`,
        }}
      >
        {gridCells.map(({ col, row, isHighlighted }) => (
          <button
            key={`${col}-${row}`}
            type="button"
            className={`${styles["table-grid-picker__cell"]} ${
              isHighlighted ? styles["is-highlighted"] : ""
            }`}
            data-testid={`grid-cell-${col}-${row}`}
            aria-label={`${col} by ${row} table`}
            onMouseEnter={() => handleCellHover(col, row)}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsMouseDown(true);
              handleCellHover(col, row);
            }}
            onClick={() => handleCellClick(col, row)}
          />
        ))}
      </div>
      <div className={styles["table-grid-picker__footer"]}>
        {hoverCols} x {hoverRows}
      </div>
    </div>
  );
}

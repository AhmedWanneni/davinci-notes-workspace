import React from "react";
import type { DatabaseColumn, DatabaseRow } from "./databaseTypes";
import { DatabaseCellComponent } from "./DatabaseCellComponent";
import { DotsThreeIcon, CopyIcon, TrashIcon } from "./DatabaseIcons";
import type { CellCoord } from "./useDatabaseKeyboardNav";
import styles from "./DatabaseView.module.scss";

export interface DatabaseRowComponentProps {
  row: DatabaseRow;
  rowIndex: number;
  columns: DatabaseColumn[];
  columnWidths: Record<string, number>;
  focusedCell: CellCoord | null;
  editingCellId?: { rowId: string; colIdx: number } | null;
  onCellClick: (colIdx: number) => void;
  onCellStartEdit: (colIdx: number) => void;
  onCellSave: (colIdx: number, val: string) => void;
  onCellCancel: () => void;
  onLinkClick?: (target: string) => void;
  onTagClick?: (tag: string) => void;
  onDuplicateRow: () => void;
  onDeleteRow: () => void;
}

export function DatabaseRowComponent({
  row,
  rowIndex,
  columns,
  columnWidths,
  focusedCell,
  editingCellId,
  onCellClick,
  onCellStartEdit,
  onCellSave,
  onCellCancel,
  onLinkClick,
  onTagClick,
  onDuplicateRow,
  onDeleteRow,
}: DatabaseRowComponentProps) {
  const [showRowMenu, setShowRowMenu] = React.useState(false);

  return (
    <div className={styles["table-row"]} role="row">
      <div className={styles["row-index-cell"]}>
        <span className={styles["row-num"]}>{rowIndex + 1}</span>
        <button
          type="button"
          className={styles["row-menu-btn"]}
          onClick={() => setShowRowMenu(!showRowMenu)}
          aria-label={`Row ${rowIndex + 1} actions`}
        >
          <DotsThreeIcon size={12} />
        </button>

        {showRowMenu && (
          <div className={styles["row-menu-dropdown"]}>
            <button
              type="button"
              className={styles["row-menu-item"]}
              onClick={() => {
                setShowRowMenu(false);
                onDuplicateRow();
              }}
            >
              <CopyIcon size={12} />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              className={`${styles["row-menu-item"]} ${styles["is-danger"]}`}
              onClick={() => {
                setShowRowMenu(false);
                onDeleteRow();
              }}
            >
              <TrashIcon size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {columns.map((col, colIdx) => {
        const val = row.cells[colIdx] ?? "";
        const isFocused =
          focusedCell?.row === rowIndex && focusedCell?.col === colIdx;
        const isEditing =
          editingCellId?.rowId === row.id && editingCellId?.colIdx === colIdx;
        const width = columnWidths[col.name] ?? 160;

        return (
          <div
            key={col.name}
            style={{ width, minWidth: width, maxWidth: width }}
            className={styles["cell-wrapper"]}
          >
            <DatabaseCellComponent
              value={val}
              column={col}
              rowId={row.id}
              colIndex={colIdx}
              isFocused={isFocused}
              isEditing={isEditing}
              onClick={() => onCellClick(colIdx)}
              onStartEdit={() => onCellStartEdit(colIdx)}
              onSave={(newVal) => onCellSave(colIdx, newVal)}
              onCancel={onCellCancel}
              onLinkClick={onLinkClick}
              onTagClick={onTagClick}
            />
          </div>
        );
      })}
    </div>
  );
}

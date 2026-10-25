import React, { useState, useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { DatabaseColumn } from "./databaseTypes";
import { parseDatabase } from "./parseDatabase";
import { serializeDatabase } from "./serializeDatabase";
import { editCell } from "./cellOperations";
import { addRow, deleteRow, duplicateRow } from "./rowOperations";
import {
  addColumn,
  renameColumn,
  deleteColumn,
  changeColumnType,
} from "./columnOperations";
import { DatabaseHeaderCell } from "./DatabaseHeaderCell";
import { DatabaseRowComponent } from "./DatabaseRowComponent";
import { DatabaseToolbar } from "./DatabaseToolbar";
import { DatabaseColumnModal } from "./DatabaseColumnModal";
import { useDatabaseKeyboardNav } from "./useDatabaseKeyboardNav";
import { filterAndSortRows } from "./databaseViewHelpers";
import { PlusIcon } from "./DatabaseIcons";
import styles from "./DatabaseView.module.scss";

export interface DatabaseViewProps {
  content: string;
  filePath?: string;
  onChange: (newContent: string) => void;
  onOpenNote?: (target: string) => void;
  onOpenAsMarkdown?: () => void;
}

export function DatabaseView({
  content,
  onChange,
  onOpenNote,
  onOpenAsMarkdown,
}: DatabaseViewProps) {
  const model = useMemo(() => {
    try {
      return parseDatabase(content);
    } catch {
      return null;
    }
  }, [content]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterCol, setFilterCol] = useState<string | null>(null);
  const [filterVal, setFilterVal] = useState("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [modalCol, setModalCol] = useState<{
    col: DatabaseColumn;
    idx: number;
  } | null>(null);
  const [editingCellId, setEditingCellId] = useState<{
    rowId: string;
    colIdx: number;
  } | null>(null);

  const displayRows = useMemo(() => {
    if (!model) return [];
    return filterAndSortRows(
      model.rows,
      model.columns,
      searchQuery,
      filterCol,
      filterVal,
      sortCol,
      sortOrder,
    );
  }, [model, searchQuery, filterCol, filterVal, sortCol, sortOrder]);

  const nav = useDatabaseKeyboardNav({
    rowCount: displayRows.length,
    colCount: model?.columns.length ?? 0,
    onStartEdit: (coord) => {
      const targetRow = displayRows[coord.row];
      if (targetRow) {
        setEditingCellId({ rowId: targetRow.id, colIdx: coord.col });
      }
    },
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: displayRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const handleCellSave = useCallback(
    (rowId: string, colIdx: number, val: string) => {
      setEditingCellId(null);
      if (!model) return;
      const updated = editCell(model, rowId, colIdx, val);
      onChange(serializeDatabase(updated));
    },
    [model, onChange],
  );

  const handleAddRow = useCallback(() => {
    if (!model) return;
    onChange(serializeDatabase(addRow(model)));
  }, [model, onChange]);

  const handleDuplicateRow = useCallback(
    (rowId: string) => {
      if (!model) return;
      onChange(serializeDatabase(duplicateRow(model, rowId)));
    },
    [model, onChange],
  );

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (!model) return;
      onChange(serializeDatabase(deleteRow(model, rowId)));
    },
    [model, onChange],
  );

  const handleAddColumn = useCallback(() => {
    if (!model) return;
    const name = `Column ${model.columns.length + 1}`;
    onChange(serializeDatabase(addColumn(model, name, "text")));
  }, [model, onChange]);

  const handleSaveColumn = useCallback(
    (updated: DatabaseColumn) => {
      if (!model || !modalCol) return;
      const old = modalCol.col;
      let next = model;
      if (old.name !== updated.name)
        next = renameColumn(next, old.name, updated.name);
      if (old.type !== updated.type || old.options !== updated.options) {
        next = changeColumnType(
          next,
          updated.name,
          updated.type,
          updated.options,
        );
      }
      onChange(serializeDatabase(next));
    },
    [model, modalCol, onChange],
  );

  const handleDeleteColumn = useCallback(
    (name: string) => {
      if (!model) return;
      onChange(serializeDatabase(deleteColumn(model, name)));
    },
    [model, onChange],
  );

  if (!model) {
    return (
      <div className={styles["error-banner"]}>
        <span>
          This note has <code>database: table</code> frontmatter but could not
          be parsed safely as a table.
        </span>
        {onOpenAsMarkdown && (
          <button type="button" onClick={onOpenAsMarkdown}>
            Open as markdown
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={styles["database-container"]}
      onKeyDown={nav.handleKeyDown}
      tabIndex={0}
    >
      <DatabaseToolbar
        columns={model.columns}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortCol={sortCol}
        sortOrder={sortOrder}
        onSortChange={(col, ord) => {
          setSortCol(col);
          setSortOrder(ord);
        }}
        filterCol={filterCol}
        filterVal={filterVal}
        onFilterChange={(col, val) => {
          setFilterCol(col);
          setFilterVal(val);
        }}
        onAddRow={handleAddRow}
      />

      <div className={styles["table-scroll-container"]} ref={parentRef}>
        <div className={styles["table-header-row"]} role="row">
          <div className={styles["row-index-header"]}>#</div>
          {model.columns.map((col, idx) => (
            <DatabaseHeaderCell
              key={col.name}
              column={col}
              width={columnWidths[col.name] ?? 160}
              onOpenModal={(c) => setModalCol({ col: c, idx })}
              onResize={(w) =>
                setColumnWidths((prev) => ({ ...prev, [col.name]: w }))
              }
            />
          ))}
          <button
            type="button"
            className={styles["add-col-btn"]}
            onClick={handleAddColumn}
          >
            <PlusIcon size={14} />
            <span>Add column</span>
          </button>
        </div>

        <div
          className={styles["virtual-body"]}
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = displayRows[virtualRow.index];
            if (!row) return null;
            return (
              <div
                key={row.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <DatabaseRowComponent
                  row={row}
                  rowIndex={virtualRow.index}
                  columns={model.columns}
                  columnWidths={columnWidths}
                  focusedCell={nav.focusedCell}
                  editingCellId={editingCellId}
                  onCellClick={(colIdx) =>
                    nav.setFocusedCell({ row: virtualRow.index, col: colIdx })
                  }
                  onCellStartEdit={(colIdx) => {
                    nav.startEditing({ row: virtualRow.index, col: colIdx });
                    setEditingCellId({ rowId: row.id, colIdx });
                  }}
                  onCellSave={(colIdx, val) =>
                    handleCellSave(row.id, colIdx, val)
                  }
                  onCellCancel={() => {
                    nav.stopEditing();
                    setEditingCellId(null);
                  }}
                  onLinkClick={onOpenNote}
                  onDuplicateRow={() => handleDuplicateRow(row.id)}
                  onDeleteRow={() => handleDeleteRow(row.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {modalCol && (
        <DatabaseColumnModal
          column={modalCol.col}
          columnIndex={modalCol.idx}
          rows={model.rows}
          isOpen={true}
          onClose={() => setModalCol(null)}
          onSave={handleSaveColumn}
          onDelete={handleDeleteColumn}
        />
      )}
    </div>
  );
}

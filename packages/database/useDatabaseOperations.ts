import { useCallback } from "react";
import type { DatabaseColumn, DatabaseModel } from "./databaseTypes";
import { serializeDatabase } from "./serializeDatabase";
import { editCell } from "./cellOperations";
import { addRow, deleteRow, duplicateRow } from "./rowOperations";
import {
  addColumn,
  renameColumn,
  deleteColumn,
  changeColumnType,
} from "./columnOperations";

export interface UseDatabaseOperationsOptions {
  model: DatabaseModel | null;
  modalCol: { col: DatabaseColumn; idx: number } | null;
  onChange: (newContent: string) => void;
  setEditingCellId: (id: { rowId: string; colIdx: number } | null) => void;
}

export function useDatabaseOperations({
  model,
  modalCol,
  onChange,
  setEditingCellId,
}: UseDatabaseOperationsOptions) {
  const handleCellSave = useCallback(
    (rowId: string, colIdx: number, val: string) => {
      setEditingCellId(null);
      if (!model) return;
      const updated = editCell(model, rowId, colIdx, val);
      onChange(serializeDatabase(updated));
    },
    [model, onChange, setEditingCellId],
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
      if (old.name !== updated.name) {
        next = renameColumn(next, old.name, updated.name);
      }
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

  return {
    handleCellSave,
    handleAddRow,
    handleDuplicateRow,
    handleDeleteRow,
    handleAddColumn,
    handleSaveColumn,
    handleDeleteColumn,
  };
}

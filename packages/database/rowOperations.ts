import type { DatabaseModel, DatabaseRow } from "./databaseTypes";
import { serializeRowCells } from "./tableParser";

export function addRow(
  model: DatabaseModel,
  initialCells?: string[],
  atIndex?: number,
): DatabaseModel {
  const colCount = model.tableColumnNames.length;
  const cells: string[] = [];
  for (let i = 0; i < colCount; i += 1) {
    const val = initialCells && i < initialCells.length ? initialCells[i] : "";
    cells.push(val);
  }

  const newRow: DatabaseRow = {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    rawLine: serializeRowCells(cells),
    cells,
  };

  const insertIdx =
    atIndex === undefined || atIndex < 0 || atIndex > model.rows.length
      ? model.rows.length
      : atIndex;

  model.rows.splice(insertIdx, 0, newRow);
  model.isModified = true;
  return model;
}

export function deleteRow(model: DatabaseModel, rowId: string): DatabaseModel {
  const idx = model.rows.findIndex((r) => r.id === rowId);
  if (idx === -1) return model;

  model.rows.splice(idx, 1);
  model.isModified = true;
  return model;
}

export function duplicateRow(
  model: DatabaseModel,
  rowId: string,
): DatabaseModel {
  const idx = model.rows.findIndex((r) => r.id === rowId);
  if (idx === -1) return model;

  const original = model.rows[idx];
  const duplicated: DatabaseRow = {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    rawLine: original.rawLine,
    cells: [...original.cells],
  };

  model.rows.splice(idx + 1, 0, duplicated);
  model.isModified = true;
  return model;
}

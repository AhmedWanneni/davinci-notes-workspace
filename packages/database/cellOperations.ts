import type { DatabaseModel } from "./databaseTypes";
import { serializeRowCells } from "./tableParser";
import { parseCheckboxValue, formatCheckboxValue } from "./typeValidators";

export function editCell(
  model: DatabaseModel,
  rowId: string,
  colIndex: number,
  newValue: string,
): DatabaseModel {
  const row = model.rows.find((r) => r.id === rowId);
  if (!row) return model;

  while (row.cells.length <= colIndex) {
    row.cells.push("");
  }

  const prevValue = row.cells[colIndex];
  if (prevValue === newValue) return model;

  row.cells[colIndex] = newValue;
  row.rawLine = serializeRowCells(row.cells);
  model.isModified = true;
  return model;
}

export function toggleCheckboxCell(
  model: DatabaseModel,
  rowId: string,
  colIndex: number,
): DatabaseModel {
  const row = model.rows.find((r) => r.id === rowId);
  if (!row) return model;

  while (row.cells.length <= colIndex) {
    row.cells.push("");
  }

  const currentRaw = row.cells[colIndex];
  const currentChecked = parseCheckboxValue(currentRaw);
  const nextChecked = !currentChecked;
  const nextRaw = formatCheckboxValue(nextChecked, currentRaw);

  return editCell(model, rowId, colIndex, nextRaw);
}

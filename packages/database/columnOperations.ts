import type {
  DatabaseModel,
  DatabaseColumn,
  ColumnType,
  SelectOption,
} from "./databaseTypes";
import { serializeRowCells } from "./tableParser";
import {
  updateFrontmatterColumns,
  renameColumnInFrontmatter,
  deleteColumnInFrontmatter,
  updateColumnTypeInFrontmatter,
} from "./yamlFrontmatter";

export function addColumn(
  model: DatabaseModel,
  name: string,
  type: ColumnType,
  options?: SelectOption[],
): DatabaseModel {
  const cleanName = name.trim();
  model.tableColumnNames.push(cleanName);
  model.tableHeaderLine = serializeRowCells(model.tableColumnNames);

  // Extend delimiter
  const delimiters = model.tableColumnNames.map(() => "---");
  model.tableDelimiterLine = serializeRowCells(delimiters);

  // Add empty cell to every row
  for (const row of model.rows) {
    row.cells.push("");
    row.rawLine = serializeRowCells(row.cells);
  }

  const newCol: DatabaseColumn = { name: cleanName, type, options };
  model.columns.push(newCol);
  model.frontmatterText = updateFrontmatterColumns(
    model.frontmatterText,
    model.columns,
  );
  model.isModified = true;
  return model;
}

export function renameColumn(
  model: DatabaseModel,
  oldName: string,
  newName: string,
): DatabaseModel {
  const cleanNew = newName.trim();
  const idx = model.tableColumnNames.findIndex(
    (n) => n.toLowerCase() === oldName.toLowerCase(),
  );
  if (idx === -1) return model;

  model.tableColumnNames[idx] = cleanNew;
  model.tableHeaderLine = serializeRowCells(model.tableColumnNames);

  const col = model.columns.find(
    (c) => c.name.toLowerCase() === oldName.toLowerCase(),
  );
  if (col) {
    col.name = cleanNew;
  }

  model.frontmatterText = renameColumnInFrontmatter(
    model.frontmatterText,
    oldName,
    cleanNew,
  );
  model.isModified = true;
  return model;
}

export function deleteColumn(
  model: DatabaseModel,
  target: number | string,
): DatabaseModel {
  const colIndex =
    typeof target === "number"
      ? target
      : model.tableColumnNames.findIndex(
          (n) => n.toLowerCase() === target.toLowerCase(),
        );
  if (colIndex < 0 || colIndex >= model.tableColumnNames.length) return model;

  const colName = model.tableColumnNames[colIndex];
  model.tableColumnNames.splice(colIndex, 1);
  model.tableHeaderLine = serializeRowCells(model.tableColumnNames);

  const delimiters = model.tableColumnNames.map(() => "---");
  model.tableDelimiterLine = serializeRowCells(delimiters);

  for (const row of model.rows) {
    row.cells.splice(colIndex, 1);
    row.rawLine = serializeRowCells(row.cells);
  }

  const colIdx = model.columns.findIndex(
    (c) => c.name.toLowerCase() === colName.toLowerCase(),
  );
  if (colIdx !== -1) {
    model.columns.splice(colIdx, 1);
  }

  model.frontmatterText = deleteColumnInFrontmatter(
    model.frontmatterText,
    colName,
  );
  model.isModified = true;
  return model;
}

export function reorderColumns(
  model: DatabaseModel,
  newOrderIndices: number[],
): DatabaseModel {
  if (newOrderIndices.length !== model.tableColumnNames.length) return model;

  model.tableColumnNames = newOrderIndices.map(
    (i) => model.tableColumnNames[i],
  );
  model.tableHeaderLine = serializeRowCells(model.tableColumnNames);

  const nextCols: DatabaseColumn[] = [];
  for (const idx of newOrderIndices) {
    if (idx < model.columns.length) {
      nextCols.push(model.columns[idx]);
    }
  }
  model.columns = nextCols;

  for (const row of model.rows) {
    row.cells = newOrderIndices.map((i) =>
      i < row.cells.length ? row.cells[i] : "",
    );
    row.rawLine = serializeRowCells(row.cells);
  }

  model.frontmatterText = updateFrontmatterColumns(
    model.frontmatterText,
    model.columns,
  );
  model.isModified = true;
  return model;
}

export function changeColumnType(
  model: DatabaseModel,
  colName: string,
  newType: ColumnType,
  options?: SelectOption[],
): DatabaseModel {
  const col = model.columns.find(
    (c) => c.name.toLowerCase() === colName.toLowerCase(),
  );
  if (col) {
    col.type = newType;
    col.options = options;
  }

  model.frontmatterText = updateColumnTypeInFrontmatter(
    model.frontmatterText,
    colName,
    newType,
    options,
  );
  model.isModified = true;
  return model;
}

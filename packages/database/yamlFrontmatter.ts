import { parseDocument, isSeq, isMap } from "yaml";
import type { DatabaseColumn, ColumnType, SelectOption } from "./databaseTypes";

export function parseFrontmatterDoc(text: string) {
  return parseDocument(text);
}

export function updateFrontmatterColumns(
  frontmatterText: string,
  columns: DatabaseColumn[],
): string {
  const doc = parseDocument(frontmatterText);

  const cleanColumns = columns
    .filter((col) => !col.missingInFrontmatter)
    .map((col) => {
      const item: Record<string, unknown> = {
        name: col.name,
        type: col.type,
      };
      if (col.type === "select" && col.options && col.options.length > 0) {
        item.options = col.options.map((o) => ({
          value: o.value,
          color: o.color,
        }));
      }
      return item;
    });

  doc.set("database", "table");
  doc.set("columns", cleanColumns);
  return doc.toString().trim();
}

export function updateColumnTypeInFrontmatter(
  frontmatterText: string,
  colName: string,
  newType: ColumnType,
  options?: SelectOption[],
): string {
  const doc = parseDocument(frontmatterText);
  const cols = doc.get("columns");

  if (isSeq(cols)) {
    for (const item of cols.items) {
      if (isMap(item) && item.get("name") === colName) {
        item.set("type", newType);
        if (newType === "select" && options) {
          item.set(
            "options",
            options.map((o) => ({ value: o.value, color: o.color })),
          );
        } else if (newType !== "select") {
          item.delete("options");
        }
        return doc.toString().trim();
      }
    }
  }

  // Column was not in frontmatter yet: add it
  const existingCols = isSeq(cols) ? cols.toJSON() : [];
  existingCols.push({
    name: colName,
    type: newType,
    ...(newType === "select" && options ? { options } : {}),
  });
  doc.set("columns", existingCols);
  return doc.toString().trim();
}

export function renameColumnInFrontmatter(
  frontmatterText: string,
  oldName: string,
  newName: string,
): string {
  const doc = parseDocument(frontmatterText);
  const cols = doc.get("columns");

  if (isSeq(cols)) {
    for (const item of cols.items) {
      if (isMap(item) && item.get("name") === oldName) {
        item.set("name", newName);
        return doc.toString().trim();
      }
    }
  }
  return doc.toString().trim();
}

export function deleteColumnInFrontmatter(
  frontmatterText: string,
  colName: string,
): string {
  const doc = parseDocument(frontmatterText);
  const cols = doc.get("columns");

  if (isSeq(cols)) {
    const idx = cols.items.findIndex(
      (item) => isMap(item) && item.get("name") === colName,
    );
    if (idx !== -1) {
      cols.delete(idx);
      return doc.toString().trim();
    }
  }
  return doc.toString().trim();
}

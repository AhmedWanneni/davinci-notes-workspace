import { parseDocument, isSeq, isMap } from "yaml";
import type { DatabaseModel, DatabaseColumn, DatabaseRow, ColumnType, SelectOption } from "./databaseTypes";
import { isTableDelimiter, parseRowCells } from "./tableParser";

export function parseDatabase(text: string): DatabaseModel {
  const lineEnding = text.includes("\r\n") ? "\r\n" : "\n";
  const hasTrailingNewline = text.endsWith("\n");
  const allLines = text.split(/\r?\n/);
  if (hasTrailingNewline && allLines[allLines.length - 1] === "") {
    allLines.pop();
  }

  // 1. Verify frontmatter
  if (allLines.length === 0 || allLines[0].trim() !== "---") {
    throw new Error("Missing YAML frontmatter: file must begin with '---'");
  }

  let closingFmIdx = -1;
  for (let i = 1; i < allLines.length; i += 1) {
    if (allLines[i].trim() === "---") {
      closingFmIdx = i;
      break;
    }
  }

  if (closingFmIdx === -1) {
    throw new Error("Unclosed YAML frontmatter: missing ending '---'");
  }

  const frontmatterLines = allLines.slice(1, closingFmIdx);
  const frontmatterText = frontmatterLines.join("\n");
  const doc = parseDocument(frontmatterText);

  if (doc.get("database") !== "table") {
    throw new Error("Frontmatter must contain 'database: table'");
  }

  // Parse columns from YAML
  const fmColumns: DatabaseColumn[] = [];
  const rawCols = doc.get("columns");
  if (isSeq(rawCols)) {
    for (const item of rawCols.items) {
      if (isMap(item)) {
        const name = String(item.get("name") ?? "");
        const type = (String(item.get("type") ?? "text") as ColumnType) || "text";
        const optionsNode = item.get("options");
        let options: SelectOption[] | undefined;
        if (isSeq(optionsNode)) {
          options = optionsNode.items.map((opt) => {
            if (isMap(opt)) {
              return {
                value: String(opt.get("value") ?? ""),
                color: String(opt.get("color") ?? "default"),
              };
            }
            return { value: String(opt), color: "default" };
          });
        }
        if (name) {
          fmColumns.push({ name, type, options });
        }
      }
    }
  }

  // 2. Scan for the first pipe table
  let tableHeaderIdx = -1;
  for (let i = closingFmIdx + 1; i < allLines.length - 1; i += 1) {
    const line = allLines[i];
    const nextLine = allLines[i + 1];
    if (line.includes("|") && isTableDelimiter(nextLine)) {
      tableHeaderIdx = i;
      break;
    }
  }

  if (tableHeaderIdx === -1) {
    throw new Error("No pipe table found after frontmatter");
  }

  const preTableLines = allLines.slice(closingFmIdx + 1, tableHeaderIdx);
  const tableHeaderLine = allLines[tableHeaderIdx];
  const tableDelimiterLine = allLines[tableHeaderIdx + 1];
  const tableColumnNames = parseRowCells(tableHeaderLine);

  // Merge table columns with frontmatter types
  const columns: DatabaseColumn[] = tableColumnNames.map((colName) => {
    const match = fmColumns.find(
      (fc) => fc.name.toLowerCase() === colName.toLowerCase(),
    );
    if (match) {
      return {
        name: colName,
        type: match.type,
        options: match.options,
      };
    }
    return {
      name: colName,
      type: "text",
      missingInFrontmatter: true,
    };
  });

  // 3. Parse table rows
  let rowIdx = tableHeaderIdx + 2;
  const rows: DatabaseRow[] = [];
  while (rowIdx < allLines.length) {
    const line = allLines[rowIdx];
    // Table rows continue while lines contain pipes and are not blank
    if (!line.includes("|") || line.trim() === "") {
      break;
    }
    const cells = parseRowCells(line);
    // Pad ragged rows
    while (cells.length < tableColumnNames.length) {
      cells.push("");
    }
    rows.push({
      id: `row-${rows.length}`,
      rawLine: line,
      cells,
    });
    rowIdx += 1;
  }

  const postTableLines = allLines.slice(rowIdx);

  return {
    frontmatterText,
    frontmatterLines,
    columns,
    rows,
    preTableLines,
    tableHeaderLine,
    tableDelimiterLine,
    tableColumnNames,
    postTableLines,
    lineEnding,
    hasTrailingNewline,
    rawText: text,
    isModified: false,
  };
}

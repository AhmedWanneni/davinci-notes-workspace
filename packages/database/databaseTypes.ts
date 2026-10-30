export type ColumnType = "text" | "number" | "select" | "checkbox" | "date";

export interface SelectOption {
  value: string;
  color: string;
}

export interface DatabaseColumn {
  name: string;
  type: ColumnType;
  options?: SelectOption[];
  missingInFrontmatter?: boolean;
}

export interface DatabaseRow {
  id: string;
  rawLine: string;
  cells: string[];
}

export interface DatabaseModel {
  frontmatterText: string;
  frontmatterLines: string[];
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  preTableLines: string[];
  tableHeaderLine: string;
  tableDelimiterLine: string;
  tableColumnNames: string[];
  postTableLines: string[];
  lineEnding: "\n" | "\r\n";
  hasTrailingNewline: boolean;
  rawText: string;
  isModified?: boolean;
}

export interface CellValidationResult {
  isValid: boolean;
  warning?: string;
}

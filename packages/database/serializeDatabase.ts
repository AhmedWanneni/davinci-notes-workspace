import type { DatabaseModel } from "./databaseTypes";

export function serializeDatabase(model: DatabaseModel): string {
  if (!model.isModified) {
    return model.rawText;
  }

  const lines: string[] = [
    "---",
    model.frontmatterText,
    "---",
    ...model.preTableLines,
    model.tableHeaderLine,
    model.tableDelimiterLine,
    ...model.rows.map((r) => r.rawLine),
    ...model.postTableLines,
  ];

  const joined = lines.join(model.lineEnding);
  return model.hasTrailingNewline ? `${joined}${model.lineEnding}` : joined;
}

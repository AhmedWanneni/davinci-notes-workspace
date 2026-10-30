export interface DatabaseColumnDef {
  name: string;
  type?: "text" | "number" | "select" | "checkbox" | "date";
  options?: string[];
}

export interface DatabaseNoteOptions {
  title?: string;
  columns: DatabaseColumnDef[];
  rows?: Array<Record<string, string | number | boolean | null | undefined>>;
}

export function generateDatabaseMarkdown(options: DatabaseNoteOptions): string {
  const columns = options.columns.length > 0
    ? options.columns
    : [{ name: "Name", type: "text" as const }];

  const fmColumns = columns.map((col) => {
    const lines = [`  - name: "${col.name.replace(/"/g, '\\"')}"`, `    type: ${col.type ?? "text"}`];
    if (col.options && col.options.length > 0) {
      lines.push("    options:");
      for (const opt of col.options) {
        lines.push(`      - "${opt.replace(/"/g, '\\"')}"`);
      }
    }
    return lines.join("\n");
  }).join("\n");

  const headerLine = `| ${columns.map((c) => c.name).join(" | ")} |`;
  const delimiterLine = `| ${columns.map((c) => (c.type === "number" ? "---:" : "---")).join(" | ")} |`;

  const dataRows = (options.rows ?? []).map((row) => {
    const cells = columns.map((col) => {
      const val = row[col.name];
      if (val === null || val === undefined) return "";
      if (typeof val === "boolean") return val ? "true" : "false";
      return String(val).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
    });
    return `| ${cells.join(" | ")} |`;
  });

  const bodyParts = [
    ...(options.title ? [`# ${options.title}`, ""] : []),
    headerLine,
    delimiterLine,
    ...dataRows,
  ];

  return [
    "---",
    "database: table",
    "columns:",
    fmColumns,
    "---",
    "",
    bodyParts.join("\n"),
    "",
  ].join("\n");
}

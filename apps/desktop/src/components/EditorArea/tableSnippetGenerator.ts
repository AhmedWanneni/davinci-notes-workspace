import type { EditorView } from "@codemirror/view";

/**
 * Pure generator for standard HTML tables with arbitrary column and row counts.
 * Note: rows corresponds to total table rows (1 header row + (rows - 1) data rows, minimum 1 data row).
 */
export function generateHtmlTable(cols: number, rows: number): string {
  const c = Math.max(1, Math.min(cols, 20));
  const totalRows = Math.max(2, Math.min(rows, 50));
  const dataRowsCount = Math.max(1, totalRows - 1);

  const ths = Array.from(
    { length: c },
    (_, i) => `      <th>Header ${i + 1}</th>`,
  ).join("\n");
  let cellIndex = 1;
  const trs = Array.from({ length: dataRowsCount }, () => {
    const tds = Array.from(
      { length: c },
      () => `      <td>Cell ${cellIndex++}</td>`,
    ).join("\n");
    return `    <tr>\n${tds}\n    </tr>`;
  }).join("\n");

  return `<table>\n  <thead>\n    <tr>\n${ths}\n    </tr>\n  </thead>\n  <tbody>\n${trs}\n  </tbody>\n</table>\n\n`;
}

/**
 * Pure generator for standard Markdown tables with arbitrary column and row counts.
 * Note: rows corresponds to total table rows (1 header row + (rows - 1) data rows, minimum 1 data row).
 */
export function generateMarkdownTable(cols: number, rows: number): string {
  const c = Math.max(1, Math.min(cols, 20));
  const totalRows = Math.max(2, Math.min(rows, 50));
  const dataRowsCount = Math.max(1, totalRows - 1);

  const headers = Array.from({ length: c }, (_, i) => `Header ${i + 1}`).join(
    " | ",
  );
  const dividers = Array.from({ length: c }, () => ":---").join(" | ");

  let cellIndex = 1;
  const bodyRows = Array.from({ length: dataRowsCount }, () => {
    const rowCells = Array.from(
      { length: c },
      () => `Cell ${cellIndex++}`,
    ).join(" | ");
    return `| ${rowCells} |`;
  }).join("\n");

  return `| ${headers} |\n| ${dividers} |\n${bodyRows}\n\n`;
}

/**
 * Inserts an HTML table at the cursor or replaces selection,
 * ensuring clean block padding with before/after linebreaks.
 */
export function insertTableAtCursor(
  view: EditorView,
  cols: number,
  rows: number,
): void {
  const table = generateHtmlTable(cols, rows);
  const { from, to } = view.state.selection.main;
  const doc = view.state.doc.toString();
  const before = doc.slice(0, from);
  const after = doc.slice(to);
  const prefix = !before
    ? ""
    : before.endsWith("\n\n")
      ? ""
      : before.endsWith("\n")
        ? "\n"
        : "\n\n";
  const suffix = !after
    ? "\n\n"
    : after.startsWith("\n\n")
      ? ""
      : after.startsWith("\n")
        ? "\n"
        : "\n\n";
  const insertText = `${prefix}${table.trim()}${suffix}`;
  view.dispatch({
    changes: { from, to, insert: insertText },
    selection: { anchor: from + prefix.length },
    userEvent: "input",
  });
  view.focus();
}

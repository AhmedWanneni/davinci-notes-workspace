import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export type Alignment = "left" | "center" | "right";

export interface TableCell {
  from: number;
  to: number;
}

export interface TableRow {
  line: number;
  from: number;
  to: number;
  cells: TableCell[];
  separator: boolean;
}

export interface TableBlock {
  rows: TableRow[];
  alignments: Alignment[];
}

export function escapedPipes(state: EditorState, from: number, to: number) {
  const escaped = new Set<number>();
  const text = state.sliceDoc(from, to);

  // Escaped with backslash: \|
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\" && text[i + 1] === "|") {
      escaped.add(from + i + 1);
    }
  }

  // Inside wikilinks: [[Target|Alias]]
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = wikilinkRegex.exec(text)) !== null) {
    const pipeIndex = match[0].indexOf("|");
    if (pipeIndex !== -1) {
      escaped.add(from + match.index + pipeIndex);
    }
  }

  // Inside inline code: `code|code`
  const codeRegex = /`([^`]+)`/g;
  while ((match = codeRegex.exec(text)) !== null) {
    for (let i = 0; i < match[0].length; i++) {
      if (match[0][i] === "|") {
        escaped.add(from + match.index + i);
      }
    }
  }

  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (
        node.name === "Escape" &&
        state.sliceDoc(node.from, node.to).endsWith("|")
      ) {
        escaped.add(node.to - 1);
      }
    },
  });
  return escaped;
}

export function splitCells(state: EditorState, line: TableRow): TableCell[] {
  const text = state.sliceDoc(line.from, line.to);
  const escaped = escapedPipes(state, line.from, line.to);
  const pipes = [...text].flatMap((character, index) =>
    character === "|" && !escaped.has(line.from + index) ? [index] : [],
  );
  if (pipes.length === 0) return [];

  const cells: TableCell[] = [];
  let start = text.startsWith("|") ? 1 : 0;
  for (const pipe of pipes) {
    if (pipe < start) continue;
    cells.push({ from: line.from + start, to: line.from + pipe });
    start = pipe + 1;
  }
  if (start < text.length && text.slice(start).trim().length > 0) {
    cells.push({ from: line.from + start, to: line.from + text.length });
  }
  return cells;
}

export function separatorAlignment(
  state: EditorState,
  cell: TableCell,
): Alignment | null {
  const value = state.sliceDoc(cell.from, cell.to).trim();
  const match = value.match(/^(?::)?(-{2,})(?::)?$/);
  if (!match) return null;
  const left = value.startsWith(":");
  const right = value.endsWith(":");
  return left && right ? "center" : right ? "right" : "left";
}

export function lineHasPipe(state: EditorState, line: TableRow) {
  return splitCells(state, line).length >= 1;
}

export function lineRow(state: EditorState, lineNumber: number): TableRow {
  const line = state.doc.line(lineNumber);
  const row: TableRow = {
    line: lineNumber,
    from: line.from,
    to: line.to,
    cells: [],
    separator: false,
  };
  row.cells = splitCells(state, row);
  return row;
}

export function tableAt(
  state: EditorState,
  lineNumber: number,
): TableBlock | null {
  if (lineNumber < 1 || lineNumber >= state.doc.lines) return null;
  const separator = lineRow(state, lineNumber + 1);
  const alignments = separator.cells.map((cell) =>
    separatorAlignment(state, cell),
  );
  if (separator.cells.length < 1 || alignments.some((alignment) => !alignment))
    return null;
  const header = lineRow(state, lineNumber);
  if (header.cells.length !== separator.cells.length) return null;

  const rows: TableRow[] = [
    { ...header, separator: false },
    { ...separator, separator: true },
  ];
  for (let current = lineNumber + 2; current <= state.doc.lines; current++) {
    const row = lineRow(state, current);
    if (!lineHasPipe(state, row)) break;
    rows.push(row);
  }
  return { rows, alignments: alignments as Alignment[] };
}

export function allTables(view: EditorView) {
  const tables: TableBlock[] = [];
  const seen = new Set<number>();
  for (const { from, to } of view.visibleRanges) {
    const first = view.state.doc.lineAt(from).number;
    const last = view.state.doc.lineAt(to).number;
    for (let line = first; line <= last; line++) {
      const table = tableAt(view.state, line);
      if (table && !seen.has(table.rows[0].line)) {
        tables.push(table);
        table.rows.forEach((row) => seen.add(row.line));
      }
    }
  }
  return tables;
}

export function tableAtPosition(view: EditorView, position: number) {
  const line = view.state.doc.lineAt(position).number;
  for (let candidate = line; candidate > 0; candidate--) {
    const table = tableAt(view.state, candidate);
    if (table && table.rows.at(-1)!.line >= line) return table;
  }
  return null;
}

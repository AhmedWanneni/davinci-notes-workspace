import { syntaxTree } from "@codemirror/language";
import { EditorState, Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

type Alignment = "left" | "center" | "right";

interface TableCell {
  from: number;
  to: number;
}

interface TableRow {
  line: number;
  from: number;
  to: number;
  cells: TableCell[];
  separator: boolean;
}

interface TableBlock {
  rows: TableRow[];
  alignments: Alignment[];
}

export interface TableExtensionOptions {
  isReadOnly?: boolean;
}

const rowDeco = Decoration.line({ class: "cm-table-row" });
const headerDeco = Decoration.line({ class: "cm-table-header" });
const separatorDeco = Decoration.line({ class: "cm-table-separator" });
const delimiterDeco = Decoration.mark({ class: "cm-table-delimiter" });

function escapedPipes(state: EditorState, from: number, to: number) {
  const escaped = new Set<number>();
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

function splitCells(state: EditorState, line: TableRow): TableCell[] {
  const text = state.sliceDoc(line.from, line.to);
  const escaped = escapedPipes(state, line.from, line.to);
  const pipes = [...text].flatMap((character, index) =>
    character === "|" && !escaped.has(line.from + index) ? [index] : [],
  );
  const cells: TableCell[] = [];
  let start = text.startsWith("|") ? 1 : 0;
  for (const pipe of pipes) {
    if (pipe < start) continue;
    let from = start;
    let to = pipe;
    while (from < to && /\s/.test(text[from])) from++;
    while (to > from && /\s/.test(text[to - 1])) to--;
    if (from < to || pipes.length > 0)
      cells.push({ from: line.from + from, to: line.from + to });
    start = pipe + 1;
  }
  if (start < text.length) {
    let from = start;
    let to = text.length;
    while (from < to && /\s/.test(text[from])) from++;
    while (to > from && /\s/.test(text[to - 1])) to--;
    if (from < to || pipes.length > 0)
      cells.push({ from: line.from + from, to: line.from + to });
  }
  return cells;
}

function addTableDelimiters(
  state: EditorState,
  row: TableRow,
  decorations: Range<Decoration>[],
) {
  const escaped = escapedPipes(state, row.from, row.to);
  for (let position = row.from; position < row.to; position++) {
    if (
      state.sliceDoc(position, position + 1) === "|" &&
      !escaped.has(position)
    ) {
      decorations.push(delimiterDeco.range(position, position + 1));
    }
  }
}

function separatorAlignment(
  state: EditorState,
  cell: TableCell,
): Alignment | null {
  const value = state.sliceDoc(cell.from, cell.to);
  const match = value.match(/^(?::)?(-{2,})(?::)?$/);
  if (!match) return null;
  const left = value.startsWith(":");
  const right = value.endsWith(":");
  return left && right ? "center" : right ? "right" : "left";
}

function lineHasPipe(state: EditorState, line: TableRow) {
  return splitCells(state, line).length > 1;
}

function lineRow(state: EditorState, lineNumber: number): TableRow {
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

function tableAt(state: EditorState, lineNumber: number): TableBlock | null {
  if (lineNumber < 1 || lineNumber >= state.doc.lines) return null;
  const separator = lineRow(state, lineNumber + 1);
  const alignments = separator.cells.map((cell) =>
    separatorAlignment(state, cell),
  );
  if (separator.cells.length < 2 || alignments.some((alignment) => !alignment))
    return null;
  const header = lineRow(state, lineNumber);
  if (header.cells.length !== separator.cells.length) return null;

  const rows: TableRow[] = [
    { ...header, separator: false },
    { ...separator, separator: true },
  ];
  for (let current = lineNumber + 2; current <= state.doc.lines; current++) {
    const row = lineRow(state, current);
    if (!lineHasPipe(state, row) || row.cells.length !== separator.cells.length)
      break;
    rows.push(row);
  }
  return { rows, alignments: alignments as Alignment[] };
}

function allTables(view: EditorView) {
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

function getTableDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  for (const table of allTables(view)) {
    table.rows.forEach((row, rowIndex) => {
      decorations.push(rowDeco.range(row.from));
      decorations.push(
        (rowIndex === 0
          ? headerDeco
          : row.separator
            ? separatorDeco
            : rowDeco
        ).range(row.from),
      );
      addTableDelimiters(view.state, row, decorations);
      row.cells.forEach((cell, column) => {
        const alignment = table.alignments[column];
        decorations.push(
          Decoration.mark({
            class: `cm-table-cell cm-table-cell-${alignment}`,
            attributes: { "data-table-column": String(column) },
          }).range(cell.from, cell.to),
        );
      });
    });
  }
  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

function tableAtPosition(view: EditorView, position: number) {
  const line = view.state.doc.lineAt(position).number;
  for (let candidate = line; candidate > 0; candidate--) {
    const table = tableAt(view.state, candidate);
    if (table && table.rows.at(-1)!.line >= line) return table;
  }
  return null;
}

function dispatchTableChange(
  view: EditorView,
  table: TableBlock,
  changes: { from: number; to: number; insert: string }[],
) {
  view.dispatch({ changes });
}

function insertTable(view: EditorView) {
  const position = view.state.selection.main.head;
  view.dispatch({
    changes: {
      from: position,
      insert: "|     |     |\n| --- | --- |\n|     |     |",
    },
  });
}

function mutateTable(
  view: EditorView,
  table: TableBlock,
  action: string,
  rowIndex: number,
  column: number,
) {
  const columns = table.alignments.length;
  if (action === "insert-table") return insertTable(view);
  if (action === "add-row") {
    const target = Math.min(
      rowIndex === 0 ? 2 : rowIndex + 1,
      table.rows.length,
    );
    const line =
      table.rows[target]?.from ?? table.rows[table.rows.length - 1].to;
    const cells = Array.from({ length: columns }, () => "     ").join("|");
    dispatchTableChange(view, table, [
      { from: line, to: line, insert: `|${cells}|\n` },
    ]);
  } else if (action === "delete-row" && rowIndex > 1) {
    const row = table.rows[rowIndex];
    dispatchTableChange(view, table, [
      {
        from: row.from > 0 ? row.from - 1 : row.from,
        to: row.to + (rowIndex < table.rows.length - 1 ? 1 : 0),
        insert: "",
      },
    ]);
  } else if (action === "add-column") {
    dispatchTableChange(
      view,
      table,
      table.rows.map((row) => ({
        from: row.to,
        to: row.to,
        insert: " |     ",
      })),
    );
  } else if (action === "delete-column" && columns > 1) {
    dispatchTableChange(
      view,
      table,
      table.rows.map((row) => {
        const cell = row.cells[column];
        return {
          from: cell.from - 1,
          to: cell.to + (column === row.cells.length - 1 ? 1 : 0),
          insert: "",
        };
      }),
    );
  }
}

function showTableMenu(event: MouseEvent, view: EditorView, readOnly: boolean) {
  if (readOnly) return false;
  event.preventDefault();
  document.querySelector(".cm-table-context-menu")?.remove();
  let position = view.state.selection.main.head;
  try {
    position =
      view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? position;
  } catch {
    // Headless test environments may not implement DOMClientRect measurement.
  }
  const table = tableAtPosition(view, position);
  const line = view.state.doc.lineAt(position).number;
  const rowIndex = table?.rows.findIndex((row) => row.line === line) ?? -1;
  const column =
    table?.rows[rowIndex]?.cells.findIndex(
      (cell) => cell.from <= position && position <= cell.to,
    ) ?? 0;
  const menu = document.createElement("div");
  menu.className = "cm-table-context-menu";
  [
    "insert-table",
    "add-row",
    "delete-row",
    "add-column",
    "delete-column",
  ].forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    button.textContent = action.replaceAll("-", " ");
    button.onclick = () => {
      if (table) mutateTable(view, table, action, rowIndex, column);
      else if (action === "insert-table") insertTable(view);
      menu.remove();
    };
    menu.append(button);
  });
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  view.dom.append(menu);
  return true;
}

export const insertTableCommand = (target: {
  state: EditorState;
  dispatch: (transaction: unknown) => void;
}) => {
  const position = target.state.selection.main.head;
  target.dispatch(
    target.state.update({
      changes: {
        from: position,
        insert: "|     |     |\n| --- | --- |\n|     |     |",
      },
    }),
  );
  return true;
};

export function tableExtension(options: TableExtensionOptions = {}) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = getTableDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged)
          this.decorations = getTableDecorations(update.view);
      }
    },
    {
      decorations: (value) => value.decorations,
      eventHandlers: {
        contextmenu: (event, view) =>
          showTableMenu(event, view, Boolean(options.isReadOnly)),
      },
    },
  );
}

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { TableBlock } from "./tableExtension";

function dispatchTableChange(
  view: EditorView,
  _table: TableBlock,
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

export function mutateTable(
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

export function showTableMenu(
  event: MouseEvent,
  view: EditorView,
  readOnly: boolean,
  tableAtPosition: (view: EditorView, position: number) => TableBlock | null,
) {
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

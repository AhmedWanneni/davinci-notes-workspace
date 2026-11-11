import { EditorSelection, Prec } from "@codemirror/state";
import { EditorView, keymap, type ViewUpdate } from "@codemirror/view";
import { tableCodeEditingField } from "./TableCodeHeaderWidget";
import { tableAtPosition, type TableBlock, type TableCell } from "./tableParser";

function getTargetElement(target: EventTarget | null): HTMLElement | null {
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

function findTableCell(
  view: EditorView,
  event: MouseEvent,
): { cell: TableCell; pos: number; table: TableBlock } | null {
  const targetEl = getTargetElement(event.target);
  const cellEl = targetEl?.closest(".cm-table-cell") as HTMLElement | null;
  if (!cellEl) return null;

  const lineEl = cellEl.closest(".cm-line");
  if (!lineEl || lineEl.classList.contains("cm-table-separator")) return null;

  let linePos: number | null = null;
  try {
    linePos = view.posAtDOM(lineEl);
  } catch {
    linePos = null;
  }
  if (linePos === null) return null;

  const table = tableAtPosition(view, linePos);
  const codeEditingFrom = view.state.field(tableCodeEditingField, false);
  if (!table || codeEditingFrom === table.rows[0]?.from) return null;

  const colAttr = cellEl.getAttribute("data-table-column");
  const colIdx = colAttr !== null ? parseInt(colAttr, 10) : 0;

  let targetRow = table.rows.find(
    (row) => !row.separator && linePos! >= row.from && linePos! <= row.to,
  );
  if (!targetRow) {
    targetRow = table.rows.find((row) => !row.separator);
  }
  if (!targetRow) return null;

  const cell = targetRow.cells[colIdx] ?? targetRow.cells[0];
  if (!cell) return null;

  let pos: number | null = null;
  try {
    pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
  } catch {
    pos = null;
  }

  if (pos === null || pos < cell.from || pos > cell.to) {
    if (event.target instanceof Node) {
      try {
        pos = view.posAtDOM(event.target);
      } catch {
        pos = null;
      }
    }
  }

  const safePos =
    pos !== null ? Math.max(cell.from, Math.min(cell.to, pos)) : cell.from;

  return { cell, pos: safePos, table };
}

export const tableCellMouseSelection = EditorView.mouseSelectionStyle.of(
  (view, event) => {
    if (event.button !== 0) return null;

    const match = findTableCell(view, event);
    if (!match) return null;

    const { cell, pos } = match;
    let startPos = Math.max(cell.from, Math.min(cell.to, pos));
    let cellFrom = cell.from;
    let cellTo = cell.to;

    if (event.detail === 2) {
      let word = view.state.wordAt(startPos);
      if (!word && startPos + 1 <= cellTo) {
        word = view.state.wordAt(startPos + 1);
      }
      if (!word && startPos - 1 >= cellFrom) {
        word = view.state.wordAt(startPos - 1);
      }
      if (word) {
        const wFrom = Math.max(cellFrom, word.from);
        const wTo = Math.min(cellTo, word.to);
        return {
          update: () => {},
          get: () => EditorSelection.single(wFrom, wTo),
        };
      }
    }

    if (event.detail >= 3) {
      return {
        update: () => {},
        get: () => EditorSelection.single(cellFrom, cellTo),
      };
    }

    return {
      update(update: ViewUpdate) {
        if (update.docChanged) {
          startPos = update.changes.mapPos(startPos);
          cellFrom = update.changes.mapPos(cellFrom);
          cellTo = update.changes.mapPos(cellTo);
        }
      },
      get(moveEvent: MouseEvent, _extend: boolean, multiple: boolean) {
        let curPos: number | null = null;
        try {
          curPos = view.posAtCoords({
            x: moveEvent.clientX,
            y: moveEvent.clientY,
          });
        } catch {
          curPos = null;
        }

        if (curPos === null) {
          curPos = startPos;
        }

        // Selection stop point is strictly confined to cell boundaries [cellFrom, cellTo]
        // Never expands to row.from or beyond cellTo
        curPos = Math.max(cellFrom, Math.min(cellTo, curPos));

        const range = EditorSelection.range(startPos, curPos);
        if (multiple) {
          return EditorSelection.create([range, ...view.state.selection.ranges]);
        }
        return EditorSelection.single(startPos, curPos);
      },
    };
  },
);

function handleCellBoundary(
  view: EditorView,
  isStart: boolean,
  select: boolean,
): boolean {
  const { state } = view;
  const head = state.selection.main.head;
  const table = tableAtPosition(view, head);
  const codeEditingFrom = state.field(tableCodeEditingField, false);
  if (!table || codeEditingFrom === table.rows[0]?.from) return false;

  for (const row of table.rows) {
    if (row.separator) continue;
    for (const cell of row.cells) {
      if (head >= cell.from && head <= cell.to) {
        const targetPos = isStart ? cell.from : cell.to;
        const anchor = select ? state.selection.main.anchor : targetPos;
        view.dispatch({ selection: EditorSelection.range(anchor, targetPos) });
        return true;
      }
    }
  }
  return false;
}

export const tableCellKeymap = Prec.high(
  keymap.of([
    {
      key: "Home",
      run: (v) => handleCellBoundary(v, true, false),
      shift: (v) => handleCellBoundary(v, true, true),
    },
    {
      key: "End",
      run: (v) => handleCellBoundary(v, false, false),
      shift: (v) => handleCellBoundary(v, false, true),
    },
    {
      mac: "Cmd-ArrowLeft",
      run: (v) => handleCellBoundary(v, true, false),
      shift: (v) => handleCellBoundary(v, true, true),
    },
    {
      mac: "Cmd-ArrowRight",
      run: (v) => handleCellBoundary(v, false, false),
      shift: (v) => handleCellBoundary(v, false, true),
    },
    {
      mac: "Ctrl-a",
      run: (v) => handleCellBoundary(v, true, false),
      shift: (v) => handleCellBoundary(v, true, true),
    },
    {
      mac: "Ctrl-e",
      run: (v) => handleCellBoundary(v, false, false),
      shift: (v) => handleCellBoundary(v, false, true),
    },
  ]),
);

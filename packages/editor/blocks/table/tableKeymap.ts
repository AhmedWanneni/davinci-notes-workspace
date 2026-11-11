import { EditorSelection, Prec } from "@codemirror/state";
import { EditorView, keymap, type KeyBinding } from "@codemirror/view";
import { tableCodeEditingField } from "./TableCodeHeaderWidget";
import { tableAtPosition, type TableBlock } from "./tableParser";

function isCodeEditing(view: EditorView, table: TableBlock): boolean {
  const codeEditingFrom = view.state.field(tableCodeEditingField, false);
  return codeEditingFrom === table.rows[0]?.from;
}

function handleBackspace(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const pos = sel.from;
  const table = tableAtPosition(view, pos);
  if (!table || isCodeEditing(view, table)) return false;

  if (!sel.empty) {
    return state.sliceDoc(sel.from, sel.to).includes("|");
  }

  for (const row of table.rows) {
    if (row.separator) continue;
    if (pos === row.to) return true;
    for (const cell of row.cells) {
      if (pos === cell.from) return true;
    }
  }
  return false;
}

function handleDelete(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const pos = sel.from;
  const table = tableAtPosition(view, pos);
  if (!table || isCodeEditing(view, table)) return false;

  if (!sel.empty) {
    return state.sliceDoc(sel.from, sel.to).includes("|");
  }

  for (const row of table.rows) {
    if (row.separator) continue;
    if (pos === row.from) return true;
    for (const cell of row.cells) {
      if (pos === cell.to) return true;
    }
  }
  return false;
}

function handleTab(view: EditorView, shift: boolean): boolean {
  const { state } = view;
  const pos = state.selection.main.from;
  const table = tableAtPosition(view, pos);
  if (!table || isCodeEditing(view, table)) return false;

  const dataRows = table.rows.filter((r) => !r.separator);
  let currRowIdx = -1;
  let currCellIdx = -1;

  for (let r = 0; r < dataRows.length; r++) {
    for (let c = 0; c < dataRows[r].cells.length; c++) {
      const cell = dataRows[r].cells[c];
      if (pos >= cell.from && pos <= cell.to) {
        currRowIdx = r;
        currCellIdx = c;
        break;
      }
    }
    if (currRowIdx !== -1) break;
  }

  if (currRowIdx === -1 || currCellIdx === -1) return false;

  if (shift) {
    if (currCellIdx > 0) {
      const prevCell = dataRows[currRowIdx].cells[currCellIdx - 1];
      view.dispatch({ selection: EditorSelection.cursor(prevCell.from) });
      return true;
    } else if (currRowIdx > 0) {
      const prevRow = dataRows[currRowIdx - 1];
      const prevCell = prevRow.cells.at(-1)!;
      view.dispatch({ selection: EditorSelection.cursor(prevCell.from) });
      return true;
    }
    return true;
  }

  if (currCellIdx < dataRows[currRowIdx].cells.length - 1) {
    const nextCell = dataRows[currRowIdx].cells[currCellIdx + 1];
    view.dispatch({ selection: EditorSelection.cursor(nextCell.from) });
    return true;
  } else if (currRowIdx < dataRows.length - 1) {
    const nextRow = dataRows[currRowIdx + 1];
    const nextCell = nextRow.cells[0];
    view.dispatch({ selection: EditorSelection.cursor(nextCell.from) });
    return true;
  } else {
    const numCols = table.alignments.length;
    const newRowStr = "\n|" + Array(numCols).fill("     ").join("|") + "|";
    const insertPos = table.rows.at(-1)!.to;
    view.dispatch({
      changes: { from: insertPos, insert: newRowStr },
      selection: EditorSelection.cursor(insertPos + 3),
    });
    return true;
  }
}

function handleEnter(view: EditorView): boolean {
  const { state } = view;
  const pos = state.selection.main.from;
  const table = tableAtPosition(view, pos);
  if (!table || isCodeEditing(view, table)) return false;

  const dataRows = table.rows.filter((r) => !r.separator);
  let currRowIdx = -1;
  let currCellIdx = -1;

  for (let r = 0; r < dataRows.length; r++) {
    for (let c = 0; c < dataRows[r].cells.length; c++) {
      const cell = dataRows[r].cells[c];
      if (pos >= cell.from && pos <= cell.to) {
        currRowIdx = r;
        currCellIdx = c;
        break;
      }
    }
    if (currRowIdx !== -1) break;
  }

  if (currRowIdx === -1 || currCellIdx === -1) return false;

  if (currRowIdx < dataRows.length - 1) {
    const nextRow = dataRows[currRowIdx + 1];
    const targetCell = nextRow.cells[currCellIdx] ?? nextRow.cells[0];
    view.dispatch({ selection: EditorSelection.cursor(targetCell.from) });
    return true;
  } else {
    const numCols = table.alignments.length;
    const newRowStr = "\n|" + Array(numCols).fill("     ").join("|") + "|";
    const insertPos = table.rows.at(-1)!.to;
    const targetCellOffset = 1 + 1 + currCellIdx * 6 + 2;
    view.dispatch({
      changes: { from: insertPos, insert: newRowStr },
      selection: EditorSelection.cursor(insertPos + targetCellOffset),
    });
    return true;
  }
}

function handleArrow(view: EditorView, isDown: boolean): boolean {
  const { state } = view;
  const pos = state.selection.main.from;
  const table = tableAtPosition(view, pos);
  if (!table || isCodeEditing(view, table)) return false;

  if (isDown && table.rows.length >= 3) {
    const headerRow = table.rows[0];
    if (pos >= headerRow.from && pos <= headerRow.to) {
      let colIdx = 0;
      for (let c = 0; c < headerRow.cells.length; c++) {
        if (pos >= headerRow.cells[c].from && pos <= headerRow.cells[c].to) {
          colIdx = c;
          break;
        }
      }
      const firstBodyRow = table.rows[2];
      const targetCell = firstBodyRow.cells[colIdx] ?? firstBodyRow.cells[0];
      view.dispatch({ selection: EditorSelection.cursor(targetCell.from) });
      return true;
    }
  }

  if (!isDown && table.rows.length >= 3) {
    const firstBodyRow = table.rows[2];
    if (pos >= firstBodyRow.from && pos <= firstBodyRow.to) {
      let colIdx = 0;
      for (let c = 0; c < firstBodyRow.cells.length; c++) {
        if (pos >= firstBodyRow.cells[c].from && pos <= firstBodyRow.cells[c].to) {
          colIdx = c;
          break;
        }
      }
      const headerRow = table.rows[0];
      const targetCell = headerRow.cells[colIdx] ?? headerRow.cells[0];
      view.dispatch({ selection: EditorSelection.cursor(targetCell.from) });
      return true;
    }
  }

  return false;
}

export const tableBindings: KeyBinding[] = [
  { key: "Backspace", run: handleBackspace },
  { key: "Delete", run: handleDelete },
  { key: "Tab", run: (v) => handleTab(v, false) },
  { key: "Shift-Tab", run: (v) => handleTab(v, true) },
  { key: "Enter", run: handleEnter },
  { key: "ArrowDown", run: (v) => handleArrow(v, true) },
  { key: "ArrowUp", run: (v) => handleArrow(v, false) },
];

export const tableKeymapExtension = Prec.high(keymap.of(tableBindings));

export const tableInputHandler = EditorView.inputHandler.of(
  (view, from, to, text) => {
    if (text !== "|") return false;
    const table = tableAtPosition(view, from);
    if (!table || isCodeEditing(view, table)) return false;

    for (const row of table.rows) {
      if (row.separator) continue;
      for (const cell of row.cells) {
        if (from >= cell.from && to <= cell.to) {
          view.dispatch({
            changes: { from, to, insert: "\\|" },
            selection: EditorSelection.cursor(from + 2),
          });
          return true;
        }
      }
    }
    return false;
  },
);

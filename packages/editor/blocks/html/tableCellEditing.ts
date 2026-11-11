import type { EditorView } from "@codemirror/view";

export function serializeTableElement(table: HTMLTableElement): string {
  const clone = table.cloneNode(true) as HTMLTableElement;
  clone.querySelectorAll("th, td, tr, thead, tbody, tfoot").forEach((el) => {
    el.removeAttribute("contenteditable");
    el.removeAttribute("spellcheck");
    el.removeAttribute("style");
    el.removeAttribute("data-active-cell");
  });
  clone.removeAttribute("style");
  return clone.outerHTML;
}

export function attachTableEditor(
  table: HTMLTableElement,
  getBlockRange: () => { from: number; to: number },
  view: EditorView,
): void {
  const cells = table.querySelectorAll<HTMLTableCellElement>("th, td");
  if (cells.length === 0) return;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const syncTableToDoc = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    const { from, to } = getBlockRange();
    const currentDoc = view.state.doc.sliceString(from, to);
    const newHtml = serializeTableElement(table);
    if (newHtml !== currentDoc && from <= view.state.doc.length) {
      view.dispatch({
        changes: { from, to: Math.min(to, view.state.doc.length), insert: newHtml },
      });
    }
  };

  cells.forEach((cell) => {
    cell.contentEditable = "true";
    cell.spellcheck = false;

    cell.addEventListener("input", () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(syncTableToDoc, 500);
    });

    cell.addEventListener("blur", () => {
      syncTableToDoc();
    });

    cell.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        syncTableToDoc();
        navigateCell(table, cell, e.shiftKey ? -1 : 1, getBlockRange, view);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        syncTableToDoc();
        navigateRow(table, cell, getBlockRange, view);
      } else if (e.key === "Escape") {
        cell.blur();
        view.focus();
      }
    });
  });
}

function navigateCell(
  table: HTMLTableElement,
  currentCell: HTMLTableCellElement,
  direction: 1 | -1,
  getBlockRange: () => { from: number; to: number },
  view: EditorView,
): void {
  const allCells = Array.from(table.querySelectorAll<HTMLTableCellElement>("th, td"));
  const currentIndex = allCells.indexOf(currentCell);
  if (currentIndex === -1) return;

  const nextIndex = currentIndex + direction;
  if (nextIndex >= 0 && nextIndex < allCells.length) {
    focusCell(allCells[nextIndex]!);
  } else if (nextIndex >= allCells.length && direction === 1) {
    appendRowAndFocus(table, currentCell, getBlockRange, view);
  }
}

function navigateRow(
  table: HTMLTableElement,
  currentCell: HTMLTableCellElement,
  getBlockRange: () => { from: number; to: number },
  view: EditorView,
): void {
  const currentRow = currentCell.parentElement as HTMLTableRowElement | null;
  if (!currentRow) return;

  const cellIndex = Array.from(currentRow.children).indexOf(currentCell);
  const nextRow = currentRow.nextElementSibling as HTMLTableRowElement | null;

  if (nextRow) {
    const target = nextRow.children[cellIndex] as HTMLTableCellElement | undefined;
    if (target) {
      focusCell(target);
      return;
    }
  }

  // Last row: append a new row
  appendRowAndFocus(table, currentCell, getBlockRange, view);
}

function appendRowAndFocus(
  table: HTMLTableElement,
  referenceCell: HTMLTableCellElement,
  getBlockRange: () => { from: number; to: number },
  view: EditorView,
): void {
  const colCount = referenceCell.parentElement?.children.length ?? 2;
  const tbody = table.querySelector("tbody") ?? table;
  const newRow = document.createElement("tr");

  for (let i = 0; i < colCount; i += 1) {
    const td = document.createElement("td");
    td.textContent = "";
    newRow.appendChild(td);
  }

  tbody.appendChild(newRow);
  attachTableEditor(table, getBlockRange, view);
  const firstNewCell = newRow.children[0] as HTMLTableCellElement | undefined;
  if (firstNewCell) {
    focusCell(firstNewCell);
  }
}

function focusCell(cell: HTMLTableCellElement): void {
  cell.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

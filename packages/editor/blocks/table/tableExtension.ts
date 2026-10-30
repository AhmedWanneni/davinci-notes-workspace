import { Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { showTableMenu, insertTableCommand } from "./tableContextMenu";
import {
  allTables,
  escapedPipes,
  tableAtPosition,
  type Alignment,
  type TableBlock,
  type TableCell,
  type TableRow,
} from "./tableParser";

export { insertTableCommand };
export type { Alignment, TableBlock, TableCell, TableRow };

export interface TableExtensionOptions {
  isReadOnly?: boolean;
}

const rowDeco = Decoration.line({ class: "cm-table-row" });
const rowLastDeco = Decoration.line({
  class: "cm-table-row cm-table-row-last",
});
const headerDeco = Decoration.line({ class: "cm-table-row cm-table-header" });
const separatorDeco = Decoration.line({
  class: "cm-table-row cm-table-separator",
});
const delimiterDeco = Decoration.mark({ class: "cm-table-delimiter" });

class EmptyCellWidget extends WidgetType {
  constructor(
    readonly column: number,
    readonly alignment: Alignment,
    readonly isLast: boolean,
  ) {
    super();
  }
  eq(other: EmptyCellWidget) {
    return (
      this.column === other.column &&
      this.alignment === other.alignment &&
      this.isLast === other.isLast
    );
  }
  toDOM() {
    const span = document.createElement("span");
    const lastClass = this.isLast ? " cm-table-cell-last" : "";
    span.className = `cm-table-cell cm-table-cell-${this.alignment} cm-table-cell-empty${lastClass}`;
    span.dataset.tableColumn = String(this.column);
    span.dataset.placeholder = "Cell";
    span.textContent = "\u00A0";
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

function addTableDelimiters(
  view: EditorView,
  row: TableRow,
  decorations: Range<Decoration>[],
) {
  const escaped = escapedPipes(view.state, row.from, row.to);
  for (let position = row.from; position < row.to; position++) {
    if (
      view.state.sliceDoc(position, position + 1) === "|" &&
      !escaped.has(position)
    ) {
      decorations.push(delimiterDeco.range(position, position + 1));
    }
  }
}

function getTableDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  for (const table of allTables(view)) {
    const totalRows = table.rows.length;
    table.rows.forEach((row, rowIndex) => {
      const isHeader = rowIndex === 0;
      const isLastRow = rowIndex === totalRows - 1;
      const lineDeco = isHeader
        ? headerDeco
        : row.separator
          ? separatorDeco
          : isLastRow
            ? rowLastDeco
            : rowDeco;
      decorations.push(lineDeco.range(row.from));

      addTableDelimiters(view, row, decorations);
      row.cells.forEach((cell, column) => {
        const alignment = table.alignments[column] ?? "left";
        const isLast = column === row.cells.length - 1;
        const lastClass = isLast ? " cm-table-cell-last" : "";
        const cellText = view.state.sliceDoc(cell.from, cell.to);
        const isBlank = cellText.trim() === "";
        const attributes: Record<string, string> = {
          "data-table-column": String(column),
        };
        if (isBlank) {
          attributes["data-placeholder"] = "Cell";
        }

        if (cell.from < cell.to) {
          decorations.push(
            Decoration.mark({
              class: `cm-table-cell cm-table-cell-${alignment}${lastClass}`,
              attributes,
            }).range(cell.from, cell.to),
          );
        } else {
          decorations.push(
            Decoration.widget({
              widget: new EmptyCellWidget(column, alignment, isLast),
              side: 1,
            }).range(cell.from),
          );
        }
      });
    });
  }
  decorations.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(decorations, true);
}

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
          showTableMenu(
            event,
            view,
            Boolean(options.isReadOnly),
            tableAtPosition,
          ),
      },
    },
  );
}

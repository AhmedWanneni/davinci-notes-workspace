// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  linkExtension,
  livePreviewExtension,
  setTableCodeEditing,
  Strikethrough,
  syntaxHighlighting,
  tableExtension,
  tableTheme,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import {
  defaultKeymap,
  history,
} from "../../../../packages/editor/node_modules/@codemirror/commands";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { describe, expect, it } from "vitest";

if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}

function createTableEditor(doc: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        editorTheme,
        tableTheme,
        history(),
        keymap.of(defaultKeymap),
        markdown({ extensions: [Strikethrough, highlightExtension] }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        linkExtension({
          notePaths: ["Note.md"],
          sourcePath: "Source.md",
          onLinkClick: () => {},
        }),
        tableExtension(),
      ],
    }),
    parent: container,
  });
  return {
    container,
    view,
    destroy() {
      view.destroy();
      document.body.removeChild(container);
    },
  };
}

function getCellStyle(view: EditorView, event: MouseEvent) {
  const styles = view.state.facet(EditorView.mouseSelectionStyle);
  for (const styleFactory of styles) {
    const s = styleFactory(view, event);
    if (s) return s;
  }
  return null;
}

describe("Table Cell Selection in Preview Mode", () => {
  it("stops selection at the start of the cell not the row when selecting multiline text", () => {
    const tableText =
      "| Col 1 | Col 2 |\n| --- | --- |\n| Short | This is a multiline cell with long text that wraps across lines |";
    const { container, view, destroy } = createTableEditor(tableText);

    const cell2 = container.querySelector(
      '.cm-table-row:not(.cm-table-header):not(.cm-table-separator) .cm-table-cell[data-table-column="1"]',
    ) as HTMLElement;
    expect(cell2).not.toBeNull();

    // Start drag from inside text of cell 2 (on the text node child)
    const textNode = cell2.firstChild as Node;
    const mousedownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
    });
    Object.defineProperty(mousedownEvent, "target", { value: textNode });

    const styleObj = getCellStyle(view, mousedownEvent);
    expect(styleObj).not.toBeNull();

    // Drag backwards towards and past the start of the cell (to x: 0, y: 0)
    const dragBackEvent = new MouseEvent("mousemove", {
      clientX: 0,
      clientY: 0,
      bubbles: true,
    });
    const sel = styleObj?.get(dragBackEvent, false, false);
    expect(sel).toBeDefined();

    // The stop point must be the start of Cell 2, NOT row.from (0 or Col 1)
    const rowStart = view.state.doc.toString().indexOf("| Short |");
    const cell2Start = view.state.doc.toString().indexOf(" This is a multiline");
    expect(sel!.main.from).toBeGreaterThan(rowStart);
    expect(sel!.main.from).toBe(cell2Start);

    destroy();
  });

  it("selects only the word within the cell on double-click", () => {
    const tableText = "| Col 1 | Col 2 |\n| --- | --- |\n| Quantum Physics | 99 |";
    const { container, view, destroy } = createTableEditor(tableText);

    const cellEl = container.querySelector(
      '.cm-table-row:not(.cm-table-header):not(.cm-table-separator) .cm-table-cell[data-table-column="0"]',
    ) as HTMLElement;
    expect(cellEl).not.toBeNull();

    const dblClickEvent = new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      detail: 2,
    });
    Object.defineProperty(dblClickEvent, "target", { value: cellEl.firstChild });

    const styleObj = getCellStyle(view, dblClickEvent);
    expect(styleObj).not.toBeNull();
    const sel = styleObj?.get(dblClickEvent, false, false);
    expect(sel).toBeDefined();

    const selectedText = view.state.sliceDoc(sel!.main.from, sel!.main.to);
    expect(selectedText).toBe("Quantum");

    destroy();
  });

  it("selects the entire cell content on triple-click", () => {
    const tableText = "| Col 1 | Col 2 |\n| --- | --- |\n| Quantum Physics | 99 |";
    const { container, view, destroy } = createTableEditor(tableText);

    const cellEl = container.querySelector(
      '.cm-table-row:not(.cm-table-header):not(.cm-table-separator) .cm-table-cell[data-table-column="0"]',
    ) as HTMLElement;
    expect(cellEl).not.toBeNull();

    const tripleClickEvent = new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      detail: 3,
    });
    Object.defineProperty(tripleClickEvent, "target", { value: cellEl });

    const styleObj = getCellStyle(view, tripleClickEvent);
    expect(styleObj).not.toBeNull();
    const sel = styleObj?.get(tripleClickEvent, false, false);
    expect(sel).toBeDefined();

    const selectedText = view.state.sliceDoc(sel!.main.from, sel!.main.to);
    expect(selectedText).toBe(" Quantum Physics ");

    destroy();
  });

  it("navigates and selects to start of cell not row on Home and Cmd-ArrowLeft", () => {
    const tableText = "| Col 1 | Col 2 |\n| --- | --- |\n| Alpha | Beta Gamma Delta |";
    const { view, destroy } = createTableEditor(tableText);

    const deltaPos = view.state.doc.toString().indexOf("Delta");
    view.dispatch({ selection: EditorSelection.cursor(deltaPos) });

    // Press Shift-Home / Shift-Cmd-ArrowLeft to select to start of line/cell
    view.dom.querySelector(".cm-content")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Home",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );

    // Stop point must be the start of Cell 2, NOT the start of the row
    const cell2Start = view.state.doc.toString().indexOf(" Beta Gamma Delta ");
    const rowStart = view.state.doc.toString().indexOf("| Alpha |");
    expect(view.state.selection.main.from).toBe(cell2Start);
    expect(view.state.selection.main.from).toBeGreaterThan(rowStart);

    destroy();
  });

  it("allows standard selection in code mode", () => {
    const tableText = "| Col 1 | Col 2 |\n| --- | --- |\n| A | B |";
    const { container, view, destroy } = createTableEditor(tableText);

    view.dispatch({ effects: setTableCodeEditing.of(0) });

    const cellEl = container.querySelector(".cm-line") as HTMLElement;
    const mousedownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
    });
    Object.defineProperty(mousedownEvent, "target", { value: cellEl });

    const styleObj = getCellStyle(view, mousedownEvent);
    expect(styleObj).toBeNull();

    destroy();
  });
});

// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  linkExtension,
  livePreviewExtension,
  softLineBreakExtension,
  Strikethrough,
  syntaxHighlighting,
  Table,
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
import { insertTableAtCursor } from "../components/EditorArea/tableSnippetGenerator";

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

describe("Table cell editing and empty cell rendering", () => {
  it("renders table from generateMarkdownTable(2, 2) with visible cell identifiers and last row styling", () => {
    const tableText =
      "| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n\n";
    const { container, destroy } = createTableEditor(tableText);
    const rows = container.querySelectorAll(".cm-table-row");
    expect(rows).toHaveLength(3);
    expect(rows[0].classList.contains("cm-table-header")).toBe(true);
    expect(rows[1].classList.contains("cm-table-separator")).toBe(true);
    expect(rows[2].classList.contains("cm-table-row-last")).toBe(true);
    expect(container.textContent).toContain("Header 1");
    expect(container.textContent).toContain("Cell 1");
    expect(container.textContent).toContain("Cell 2");
    destroy();
  });

  it("renders empty cells with EmptyCellWidget without crashing CodeMirror", () => {
    const { container, destroy } = createTableEditor(
      "| Col 1 | Col 2 |\n| --- | --- |\n|||\n|  |  |",
    );

    expect(container.querySelectorAll(".cm-table-row")).toHaveLength(4);
    expect(
      container.querySelectorAll(".cm-table-cell").length,
    ).toBeGreaterThanOrEqual(8);
    expect(container.querySelectorAll(".cm-table-cell-empty").length).toBe(2);
    destroy();
  });

  it("allows user to type values into an empty cell", () => {
    const { container, view, destroy } = createTableEditor(
      "| Name | Age |\n| --- | --- |\n|  |  |",
    );

    // Locate cursor inside the first empty cell of body row
    const docText = view.state.doc.toString();
    const emptyRowStart = docText.lastIndexOf("|  |  |");
    const firstCellPos = emptyRowStart + 2; // right inside the spaces of cell 1

    view.dispatch({
      selection: EditorSelection.cursor(firstCellPos),
      changes: { from: firstCellPos, insert: "Alice" },
    });

    expect(view.state.doc.toString()).toContain("| Alice |  |");
    expect(container.textContent).toContain("Alice");
    expect(container.querySelectorAll(".cm-table-cell").length).toBe(6);
    destroy();
  });

  it("allows editing values in non-empty cells and updating rendered text", () => {
    const { container, view, destroy } = createTableEditor(
      "| Title | Score |\n| --- | --- |\n| Physics | 95 |",
    );

    const docText = view.state.doc.toString();
    const physicsPos = docText.indexOf("Physics");

    view.dispatch({
      selection: EditorSelection.cursor(physicsPos),
      changes: { from: physicsPos, to: physicsPos + 7, insert: "Quantum" },
    });

    expect(view.state.doc.toString()).toContain("| Quantum | 95 |");
    expect(container.textContent).toContain("Quantum");
    expect(container.textContent).not.toContain("Physics");
    destroy();
  });

  it("renders single-column tables and tables with trailing spaces properly", () => {
    const { container, destroy } = createTableEditor(
      "| Checklist | \n| :--- | \n| Item A | \n| Item B | ",
    );

    expect(container.querySelectorAll(".cm-table-row")).toHaveLength(4);
    expect(container.querySelectorAll(".cm-table-cell").length).toBe(4);
    expect(container.textContent).toContain("Item A");
    expect(container.textContent).toContain("Item B");
    destroy();
  });

  it("does not collapse table rows into a single line when softLineBreakExtension is active", () => {
    const tableText =
      "| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n\n";
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({
      state: EditorState.create({
        doc: tableText,
        extensions: [
          editorTheme,
          tableTheme,
          markdown({ extensions: [Table, Strikethrough, highlightExtension] }),
          softLineBreakExtension,
          tableExtension(),
        ],
      }),
      parent: container,
    });

    const rows = container.querySelectorAll(".cm-table-row");
    expect(rows).toHaveLength(3);
    expect(container.querySelectorAll(".cm-table-header")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-table-separator")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-table-row-last")).toHaveLength(1);

    const headerCells = rows[0].querySelectorAll(".cm-table-cell");
    expect(headerCells).toHaveLength(2);
    expect(headerCells[0].textContent).toContain("Header 1");
    expect(headerCells[1].textContent).toContain("Header 2");

    const bodyCells = rows[2].querySelectorAll(".cm-table-cell");
    expect(bodyCells).toHaveLength(2);
    expect(bodyCells[0].textContent).toContain("Cell 1");
    expect(bodyCells[1].textContent).toContain("Cell 2");

    view.destroy();
    document.body.removeChild(container);
  });

  it("inserts table using insertTableAtCursor with clean padding and selection inside first cell", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({
      state: EditorState.create({
        doc: "Some preceding content",
        extensions: [
          tableTheme,
          markdown({ extensions: [Table, Strikethrough] }),
          tableExtension(),
        ],
      }),
      parent: container,
    });

    view.dispatch({ selection: EditorSelection.cursor(22) });
    insertTableAtCursor(view, 2, 2);

    expect(view.state.doc.toString()).toBe(
      "Some preceding content\n\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n\n",
    );
    expect(view.state.selection.main.from).toBe(26);

    view.destroy();
    document.body.removeChild(container);
  });
});

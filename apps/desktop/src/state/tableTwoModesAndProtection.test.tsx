// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  linkExtension,
  livePreviewExtension,
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

describe("Table Two Modes and Boundary Protection", () => {
  it("renders </> code toggle icon in preview mode and toggles to code mode and back", () => {
    const tableText = "| Col 1 | Col 2 |\n| --- | --- |\n| A | B |";
    const { container, destroy } = createTableEditor(tableText);

    const toggleBtn = container.querySelector<HTMLButtonElement>(
      ".cm-table-code-btn",
    );
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn?.getAttribute("aria-label")).toBe("Code mode");
    expect(toggleBtn?.querySelector("svg polyline")).not.toBeNull();

    // Click </> toggle to enter code mode
    toggleBtn?.click();

    // Code mode header bar with eye icon should now be rendered
    const bar = container.querySelector(".cm-table-code-bar");
    expect(bar).not.toBeNull();
    const eyeBtn = bar?.querySelector<HTMLButtonElement>(".cm-table-view-btn");
    expect(eyeBtn).not.toBeNull();
    expect(eyeBtn?.getAttribute("aria-label")).toBe("Preview mode");
    expect(eyeBtn?.querySelector("svg circle")).not.toBeNull();

    // Click Eye button to return to preview mode
    eyeBtn?.click();

    expect(container.querySelector(".cm-table-code-bar")).toBeNull();
    expect(container.querySelector(".cm-table-code-btn")).not.toBeNull();

    destroy();
  });

  it("prevents Backspace at cell start from deleting pipe delimiters", () => {
    const tableText = "| Name | Age |\n| --- | --- |\n| Alice | 25 |";
    const { view, destroy } = createTableEditor(tableText);

    const bodyRowStart = view.state.doc.toString().lastIndexOf("| Alice");
    const cellStartPos = bodyRowStart + 1;

    view.dispatch({ selection: EditorSelection.cursor(cellStartPos) });

    view.dom.querySelector(".cm-content")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Backspace",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(view.state.doc.toString()).toBe(tableText);
    destroy();
  });

  it("prevents Delete at cell end from deleting pipe delimiters", () => {
    const tableText = "| Name | Age |\n| --- | --- |\n| Alice | 25 |";
    const { view, destroy } = createTableEditor(tableText);

    const bodyRowStart = view.state.doc.toString().lastIndexOf("| Alice");
    const cellEndPos = bodyRowStart + "| Alice ".length;

    view.dispatch({ selection: EditorSelection.cursor(cellEndPos) });

    view.dom.querySelector(".cm-content")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Delete",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(view.state.doc.toString()).toBe(tableText);
    destroy();
  });

  it("navigates or appends rows on Enter inside a cell without breaking lines", () => {
    const tableText = "| Name | Age |\n| --- | --- |\n| Alice | 25 |";
    const { view, destroy } = createTableEditor(tableText);

    const alicePos = view.state.doc.toString().indexOf("Alice") + 2;
    view.dispatch({ selection: EditorSelection.cursor(alicePos) });

    view.dom.querySelector(".cm-content")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );

    const lines = view.state.doc.toString().split("\n");
    expect(lines.length).toBe(4);
    expect(lines[0]).toBe("| Name | Age |");
    expect(lines[1]).toBe("| --- | --- |");
    expect(lines[2]).toBe("| Alice | 25 |");
    expect(lines[3]).toContain("|");

    destroy();
  });

  it("navigates cells on Tab and appends row when at the last cell", () => {
    const tableText = "| Name | Age |\n| --- | --- |\n| Alice | 25 |";
    const { view, destroy } = createTableEditor(tableText);

    const alicePos = view.state.doc.toString().indexOf("Alice");
    view.dispatch({ selection: EditorSelection.cursor(alicePos) });

    view.dom.querySelector(".cm-content")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );

    const ageCellPos = view.state.doc.toString().lastIndexOf("| 25") + 1;
    expect(view.state.selection.main.from).toBe(ageCellPos);

    view.dom.querySelector(".cm-content")?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(view.state.doc.lines).toBe(4);

    destroy();
  });

  it("automatically escapes pipe characters to \\| inside table cells", () => {
    const tableText = "| Name | Age |\n| --- | --- |\n| Alice | 25 |";
    const { view, destroy } = createTableEditor(tableText);

    const alicePos = view.state.doc.toString().indexOf("Alice") + 5;
    view.dispatch({ selection: EditorSelection.cursor(alicePos) });

    const handlers = view.state.facet(EditorView.inputHandler);
    let handled = false;
    for (const handler of handlers) {
      if (handler(view, alicePos, alicePos, "|")) {
        handled = true;
        break;
      }
    }

    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toContain("| Alice\\| | 25 |");

    destroy();
  });
});

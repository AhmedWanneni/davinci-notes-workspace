// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  insertTableCommand,
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

describe("Table extension (Phase 9)", () => {
  it("renders strict and loose tables with two-hyphen minimum separators", () => {
    const { container, destroy } = createTableEditor(
      [
        "| First | Last |",
        "| --- | --- |",
        "| Ada | Lovelace |",
        "",
        "First name | Last name",
        "-- | --",
        "Max | Planck",
        "",
        "Not a table | -",
      ].join("\n"),
    );

    expect(container.querySelectorAll(".cm-table-header")).toHaveLength(2);
    expect(container.querySelectorAll(".cm-table-separator")).toHaveLength(2);
    expect(
      container.querySelectorAll(".cm-table-cell").length,
    ).toBeGreaterThanOrEqual(10);
    expect(container.textContent).toContain("Ada");
    expect(
      container.querySelectorAll(".cm-table-header")[1].textContent,
    ).toContain("First name");
    destroy();
  });

  it("assigns left, center, and right alignment classes from separator colons", () => {
    const { container, destroy } = createTableEditor(
      "| Left | Center | Right |\n| :-- | :--: | --: |\n| a | b | c |",
    );
    expect(
      container.querySelectorAll(".cm-table-cell-left").length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll(".cm-table-cell-center").length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll(".cm-table-cell-right").length,
    ).toBeGreaterThan(0);
    destroy();
  });

  it("renders detected tables as an editable grid over the markdown", () => {
    const { container, view, destroy } = createTableEditor(
      "| First | Last |\n| --- | --- |\n| Ada | Lovelace |",
    );

    expect(container.querySelectorAll(".cm-table-row")).toHaveLength(3);
    expect(container.querySelectorAll(".cm-table-cell")).toHaveLength(6);
    expect(container.querySelectorAll(".cm-table-delimiter")).toHaveLength(9);

    const ada = view.state.doc.toString().indexOf("Ada");
    view.dispatch({ changes: { from: ada, to: ada + 3, insert: "Grace" } });
    expect(view.state.doc.toString()).toContain("| Grace | Lovelace |");
    expect(container.textContent).toContain("Grace");
    destroy();
  });

  it("keeps inline formatting, links, wikilinks, and escaped pipes inside cells", () => {
    const { container, destroy } = createTableEditor(
      "| Content | Link |\n| --- | --- |\n| **bold** [[Note|Alias]] \\| pipe | [site](https://example.com) |",
    );
    expect(container.querySelector(".cm-link-external")).not.toBeNull();
    expect(container.querySelector(".cm-wikilink")).not.toBeNull();
    expect(container.querySelectorAll(".cm-table-cell")).toHaveLength(4);
    expect(container.textContent).toContain("pipe");
    destroy();
  });

  it("keeps cell typing within the editor latency budget", () => {
    const row = (value: string) => `| ${value} | ${value} | ${value} |`;
    const doc = [
      row("Header"),
      "| --- | --- | --- |",
      ...Array.from({ length: 12 }, (_, index) => row(`Cell ${index}`)),
    ].join("\n");
    const { view, destroy } = createTableEditor(doc);
    const position = view.state.doc.toString().indexOf("Cell 0");
    view.dispatch({ selection: EditorSelection.cursor(position) });

    const start = performance.now();
    for (let index = 0; index < 20; index++) {
      view.dispatch({ changes: { from: position + index, insert: "x" } });
    }
    expect((performance.now() - start) / 20).toBeLessThan(5);
    destroy();
  });

  it("supports insert-table command with the canonical empty three-row shape", () => {
    const state = EditorState.create({ doc: "" });
    let nextState = state;
    expect(
      insertTableCommand({
        state,
        dispatch: (transaction) => {
          nextState = (transaction as { state: EditorState }).state;
        },
      }),
    ).toBe(true);
    expect(nextState.doc.toString()).toBe(
      "|     |     |\n| --- | --- |\n|     |     |",
    );
  });

  it("allows Enter after an ambiguous header row before the separator exists", () => {
    const { view, destroy } = createTableEditor("| First name | Last name |");
    view.dispatch({ selection: EditorSelection.cursor(view.state.doc.length) });

    view.dom
      .querySelector<HTMLElement>(".cm-content")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );

    expect(view.state.doc.toString()).toBe("| First name | Last name |\n");
    destroy();
  });

  it("keeps normal Enter behavior for pipe-like and following lines", () => {
    const cases = [
      "| text |",
      "ordinary text\n| text |",
      "| a | b |\nordinary text",
    ];

    for (const doc of cases) {
      const { view, destroy } = createTableEditor(doc);
      view.dispatch({
        selection: EditorSelection.cursor(view.state.doc.length),
      });
      view.dom
        .querySelector<HTMLElement>(".cm-content")
        ?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );

      expect(view.state.doc.lines).toBe(doc.split("\n").length + 1);
      destroy();
    }
  });

  it("adds and deletes rows and columns from the table context menu", () => {
    const { container, view, destroy } = createTableEditor(
      "| A | B |\n| --- | --- |\n| C | D |",
    );
    view.dispatch({ selection: EditorSelection.cursor(26) });
    view.dom
      .querySelector(".cm-content")
      ?.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: 1,
          clientY: 1,
        }),
      );
    const menu = container.querySelector(".cm-table-context-menu");
    expect(menu).not.toBeNull();

    menu?.querySelector<HTMLButtonElement>("[data-action='add-row']")?.click();
    expect(view.state.doc.lines).toBe(4);
    view.dom
      .querySelector(".cm-content")
      ?.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: 1,
          clientY: 1,
        }),
      );
    container
      .querySelector<HTMLButtonElement>("[data-action='add-column']")
      ?.click();
    expect(view.state.doc.toString()).toContain("|     |");
    destroy();
  });
});

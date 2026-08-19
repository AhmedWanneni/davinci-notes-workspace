// @vitest-environment jsdom
import {
  codeBlockLayoutTheme,
  editorTheme,
  livePreviewExtension,
  tableExtension,
  tableTheme,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";

describe("Editor line wrapping", () => {
  it("enables wrapping for prose, lists, tables, and blockquotes", () => {
    const container = document.createElement("div");
    const view = new EditorView({
      state: EditorState.create({
        doc: [
          "A long plain paragraph that should wrap within the editor width.",
          "- a long list item that should wrap within the editor width",
          "> a long blockquote that should wrap within the editor width",
          "| a long table cell that should wrap | another cell |",
          "| --- | --- |",
          "| content | content |",
          "```js",
          "const unbrokenCodeLine = 'horizontal scrolling remains intentional';",
          "```",
        ].join("\n"),
        extensions: [
          editorTheme,
          tableTheme,
          codeBlockLayoutTheme,
          EditorView.lineWrapping,
          markdown(),
          livePreviewExtension,
          tableExtension(),
        ],
      }),
      parent: container,
    });

    const content = container.querySelector(".cm-content");
    expect(content?.classList.contains("cm-lineWrapping")).toBe(true);
    expect(container.querySelector(".cm-code-block")).not.toBeNull();
    expect(container.querySelector(".cm-table-cell")).not.toBeNull();

    view.destroy();
  });
});

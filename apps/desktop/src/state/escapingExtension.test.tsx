// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  livePreviewExtension,
  listExtension,
  Strikethrough,
  syntaxHighlighting,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";

function createEditor(doc: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.cursor(0),
      extensions: [
        editorTheme,
        markdown({ extensions: [Strikethrough, highlightExtension] }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        listExtension(),
      ],
    }),
    parent: container,
  });
  return {
    container,
    view,
    destroy: () => {
      view.destroy();
      document.body.removeChild(container);
    },
  };
}

function renderedText(container: HTMLElement) {
  const clone = container.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(".cm-markdown-syntax")
    .forEach((node) => node.remove());
  return clone.textContent ?? "";
}

describe("Markdown escaping (Phase 8)", () => {
  it("renders every escaped matrix character literally and hides each backslash", () => {
    const { container, destroy } = createEditor("\\* \\_ \\# \\` \\| \\~ \\=");
    const syntaxMarks = Array.from(
      container.querySelectorAll(".cm-markdown-syntax"),
    );

    expect(syntaxMarks).toHaveLength(7);
    expect(syntaxMarks.every((mark) => mark.textContent === "\\")).toBe(true);
    expect(renderedText(container)).toContain("* _ # ` | ~ =");
    destroy();
  });

  it("does not turn 1\\. into an ordered list and still permits a real list", () => {
    const { container, destroy } = createEditor("1\\. literal\n1. real list");

    expect(container.querySelectorAll(".cm-list-ordered")).toHaveLength(1);
    expect(renderedText(container)).toContain("1. literal");
    destroy();
  });

  it("keeps escape scope per occurrence beside real formatting", () => {
    const { container, destroy } = createEditor(
      "\\*not italic* but *this is italic* and \\#literal\n# heading",
    );
    const syntaxTexts = Array.from(
      container.querySelectorAll(".cm-markdown-syntax"),
    ).map((mark) => mark.textContent);

    expect(syntaxTexts).toContain("\\");
    expect(syntaxTexts.filter((text) => text === "*").length).toBeGreaterThan(
      0,
    );
    expect(syntaxTexts).toContain("#");
    expect(renderedText(container)).toContain("this is italic");
    expect(renderedText(container)).toContain("#literal");
    destroy();
  });

  it("keeps escaped syntax literal inside adjacent link/list-like content", () => {
    const { container, destroy } = createEditor(
      "- [label](https://example.com) \\| not a table | real\n**bold** \\* literal",
    );
    const syntaxTexts = Array.from(
      container.querySelectorAll(".cm-markdown-syntax"),
    ).map((mark) => mark.textContent);

    expect(syntaxTexts).toContain("\\");
    expect(renderedText(container)).toContain("| not a table | real");
    expect(renderedText(container)).toContain("bold");
    destroy();
  });
});

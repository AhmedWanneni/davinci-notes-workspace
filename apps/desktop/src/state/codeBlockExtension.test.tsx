// @vitest-environment jsdom
import {
  codeBlockLanguage,
  editorHighlightStyle,
  editorTheme,
  livePreviewExtension,
  syntaxHighlighting,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";

function createCodeEditor(doc: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        editorTheme,
        markdown({ codeLanguages: codeBlockLanguage }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
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

describe("Code block formatting (Phase 6)", () => {
  it("hides single and double inline-code delimiters while preserving literal backticks", () => {
    const { container, destroy } = createCodeEditor(
      "`code` and ``code with a ` inside``",
    );

    const syntaxMarks = Array.from(
      container.querySelectorAll(".cm-markdown-syntax"),
    ).map((mark) => mark.textContent);
    expect(syntaxMarks).toEqual(["`", "`", "``", "``"]);
    expect(container.textContent).toContain("code with a ` inside");
    destroy();
  });

  it("applies a distinct syntax-highlight span to inline code content", () => {
    const { container, destroy } = createCodeEditor(
      "before `single word` after",
    );
    const line = container.querySelector(".cm-line");
    const codeText = Array.from(line?.querySelectorAll("span") ?? []).find(
      (span) => span.textContent === "single word",
    );

    expect(codeText).toBeDefined();
    expect(codeText?.className).not.toContain("cm-markdown-syntax");
    expect(codeText?.className).not.toBe("");
    destroy();
  });

  it("keeps cursor editing inside inline code content working", () => {
    const { view, destroy } = createCodeEditor("`word` and `multi word`");
    view.dispatch({
      selection: { anchor: 2 },
      changes: { from: 2, insert: "X" },
    });

    expect(view.state.doc.toString()).toBe("`wXord` and `multi word`");
    destroy();
  });

  it("renders fenced and four-space-indented code as literal code", () => {
    const { container, destroy } = createCodeEditor(
      [
        "```js",
        "**not bold** ==not highlighted==",
        "```",
        "",
        "    `literal`",
      ].join("\n"),
    );

    expect(container.querySelectorAll(".cm-code-block").length).toBeGreaterThan(
      0,
    );
    expect(container.querySelectorAll(".cm-markdown-syntax")).toHaveLength(3);
    expect(container.textContent).toContain("**not bold** ==not highlighted==");
    destroy();
  });

  it("keeps nested longer and mixed-type fences inside the outer block", () => {
    const { container, destroy } = createCodeEditor(
      [
        "````js",
        "```",
        "**literal inner fence**",
        "```",
        "````",
        "",
        "~~~text",
        "```",
        "~~~",
      ].join("\n"),
    );

    expect(container.querySelectorAll(".cm-code-block").length).toBeGreaterThan(
      0,
    );
    expect(container.textContent).toContain("**literal inner fence**");
    destroy();
  });

  it("resolves JavaScript-family language tags and leaves other languages unconfigured", () => {
    expect(codeBlockLanguage("js")).not.toBeNull();
    expect(codeBlockLanguage("typescript extra-info")).not.toBeNull();
    expect(codeBlockLanguage("python")).toBeNull();
  });

  it("keeps a fenced block nested in a list item intact", () => {
    const { container, destroy } = createCodeEditor(
      ["- item", "  ```js", "  **literal**", "  ```"].join("\n"),
    );

    expect(container.querySelectorAll(".cm-code-block").length).toBeGreaterThan(
      0,
    );
    expect(container.textContent).toContain("**literal**");
    destroy();
  });
});

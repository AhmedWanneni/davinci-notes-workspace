// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  linkExtension,
  listExtension,
  livePreviewExtension,
  MarkdownView,
  markdownAnnotationsExtension,
  syntaxHighlighting,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

function createEditor(doc: string) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        editorTheme,
        markdown(),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        listExtension(),
        linkExtension({
          notePaths: [],
          sourcePath: "Source.md",
          onLinkClick: () => {},
        }),
        markdownAnnotationsExtension(),
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

describe("Markdown annotations (Phase 7)", () => {
  it("renders single and consecutive blockquotes as bordered quote lines", () => {
    const { container, destroy } = createEditor(
      "> first line\n> **second line**\n\nplain",
    );
    expect(container.querySelectorAll(".cm-blockquote-line")).toHaveLength(2);
    expect(
      container.querySelectorAll(".cm-markdown-syntax").length,
    ).toBeGreaterThan(0);
    destroy();
  });

  it("renders numbered references and named definitions, including continuations", () => {
    const { container, destroy } = createEditor(
      "See[^one] and[^2].\n\n[^one]: first definition\n  continued definition\n[^2]: second definition",
    );
    expect(
      Array.from(container.querySelectorAll(".cm-footnote-reference")).map(
        (node) => node.textContent,
      ),
    ).toEqual(["1", "2"]);
    expect(
      Array.from(
        container.querySelectorAll(".cm-footnote-definition-marker"),
      ).map((node) => node.textContent),
    ).toEqual(["1.", "2."]);
    expect(container.textContent).toContain("continued definition");
    destroy();
  });

  it("supports inline footnotes only in the read-only MarkdownView", async () => {
    const editor = createEditor("Text ^[inline note]");
    expect(editor.container.querySelector(".cm-footnote-reference")).toBeNull();
    editor.destroy();

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<MarkdownView value="Text ^[inline note]" />);
    });
    expect(container.querySelector(".cm-footnote-reference")?.textContent).toBe(
      "1",
    );
    await act(async () => root.unmount());
    document.body.removeChild(container);
  });

  it("styles comments while editing and removes them in MarkdownView", async () => {
    const editor = createEditor(
      "visible %%inline comment%% text\n%% block\ncomment %%",
    );
    expect(
      editor.container.querySelectorAll(".cm-markdown-comment").length,
    ).toBeGreaterThanOrEqual(2);
    expect(editor.container.textContent).toContain("inline comment");
    editor.destroy();

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<MarkdownView value="visible %%hidden%% text" />);
    });
    expect(container.textContent).not.toContain("hidden");
    await act(async () => root.unmount());
    document.body.removeChild(container);
  });

  it("keeps annotations separate from rules, lists, links, and code", () => {
    const { container, destroy } = createEditor(
      [
        "- [ ] [link](https://example.com) [^ref]",
        "  > quote with `code`",
        "  ```js",
        "  **literal** %%literal%%",
        "  ```",
        "",
        "---",
        "",
        "[^ref]: definition",
      ].join("\n"),
    );
    expect(container.textContent).toContain("link");
    expect(container.querySelector(".cm-link-external")).not.toBeNull();
    expect(container.querySelector(".cm-footnote-reference")).not.toBeNull();
    expect(container.querySelector(".cm-blockquote-line")).not.toBeNull();
    expect(container.querySelector(".cm-code-block")).not.toBeNull();
    expect(container.querySelector(".cm-hr-line")).not.toBeNull();
    expect(container.textContent).toContain("**literal** %%literal%%");
    expect(container.querySelectorAll(".cm-markdown-comment")).toHaveLength(0);
    destroy();
  });

  it("supports a cursor transaction in a quote without trapping editing", () => {
    const { view, destroy } = createEditor("> text");
    view.dispatch({ changes: { from: 2, insert: "X" } });
    expect(view.state.doc.toString()).toBe("> Xtext");
    destroy();
  });
});

// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  livePreviewExtension,
  MarkdownView,
  Strikethrough,
  syntaxHighlighting,
  wikilinkExtension,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView, highlightActiveLine } from "@codemirror/view";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

function createTestEditor(doc: string, selectionPos = 0) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.cursor(selectionPos),
      extensions: [
        editorTheme,
        highlightActiveLine(),
        markdown({ extensions: [Strikethrough, highlightExtension] }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        wikilinkExtension({
          notePaths: ["TargetNote.md"],
          sourcePath: "ActiveNote.md",
          onLinkClick: () => {},
        }),
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

describe("Inline Formatting Extension", () => {
  it("renders bold formatting for **text** and __text__ and hides delimiter marks", () => {
    const { container, destroy } = createTestEditor(
      "Line 1\n**bold star** and __bold under__\nLine 3",
      0,
    );

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(4);

    const markTexts = Array.from(syntaxMarks).map((el) => el.textContent);
    expect(markTexts).toContain("**");
    expect(markTexts).toContain("__");

    destroy();
  });

  it("renders italic formatting for *text* and _text_", () => {
    const { container, destroy } = createTestEditor(
      "Line 1\n*italic star* and _italic under_\nLine 3",
      0,
    );

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(4);

    const markTexts = Array.from(syntaxMarks).map((el) => el.textContent);
    expect(markTexts).toContain("*");
    expect(markTexts).toContain("_");

    destroy();
  });

  it("renders strikethrough for ~~text~~", () => {
    const { container, destroy } = createTestEditor(
      "Line 1\n~~strikethrough text~~\nLine 3",
      0,
    );

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(2);

    const markTexts = Array.from(syntaxMarks).map((el) => el.textContent);
    expect(markTexts).toContain("~~");

    destroy();
  });

  it("renders highlight for ==text==", () => {
    const { container, destroy } = createTestEditor(
      "Line 1\n==highlighted text==\nLine 3",
      0,
    );

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(2);

    const markTexts = Array.from(syntaxMarks).map((el) => el.textContent);
    expect(markTexts).toContain("==");

    destroy();
  });

  it("correctly handles nested and combined bold and italic forms", () => {
    const doc =
      "Line 1\n**Bold with _nested italic_ text** and ***combined*** and ___under combined___\nLine 3";
    const { container, destroy } = createTestEditor(doc, 0);

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(6);

    destroy();
  });

  it("suppresses formatting when backslash-escaped and hides backslash character in rendered output", () => {
    const doc =
      "Line 1\n\\*\\*This line will not be bold\\*\\* and \\=\\=not hl\\=\\= and \\~\\~not strike\\~\\~\nLine 3";
    const { container, destroy } = createTestEditor(doc, 0);

    // Escape backslashes should be marked with .cm-markdown-syntax
    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(6);

    for (const mark of Array.from(syntaxMarks)) {
      expect(mark.textContent).toBe("\\");
    }

    destroy();
  });

  it("scopes escaping per-character without breaking later formatting on the same line", () => {
    const doc = "Line 1\n\\*not italic* but *this is italic*\nLine 3";
    const { container, destroy } = createTestEditor(doc, 0);

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    const texts = Array.from(syntaxMarks).map((m) => m.textContent);

    expect(texts).toContain("\\");
    expect(texts).toContain("*");

    destroy();
  });

  it("co-exists on the same line with wikilinks and syntax highlighting", () => {
    const doc =
      "Line 1\n**bold** [[TargetNote]] ==highlight== ~~strike~~ *italic*\nLine 3";
    const { container, destroy } = createTestEditor(doc, 0);

    const wikilink = container.querySelector(".cm-wikilink");
    expect(wikilink).not.toBeNull();
    expect(wikilink?.textContent).toBe("TargetNote");

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(8);

    destroy();
  });

  it("reveals syntax delimiters on active line during editing", () => {
    const doc = "First line\n**bold text**\nThird line";
    const { container, view, destroy } = createTestEditor(doc, 0);

    // Move cursor into the bold text on line 2 (offset 15)
    view.dispatch({
      selection: EditorSelection.cursor(15),
    });

    const activeLine = container.querySelector(".cm-activeLine");
    expect(activeLine).not.toBeNull();

    const activeSyntaxMarks = activeLine?.querySelectorAll(
      ".cm-markdown-syntax",
    );
    expect(activeSyntaxMarks?.length).toBe(2);

    destroy();
  });

  it("renders all inline formatting tokens in read-only MarkdownView", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const content =
      "**bold** and *italic* and ~~strike~~ and ==highlight== and \\*\\*escaped\\*\\* and [[TargetNote]]";

    await act(async () => {
      root.render(
        <MarkdownView
          value={content}
          notePaths={["TargetNote.md"]}
          sourcePath={"Source.md"}
        />,
      );
    });

    const wikilink = container.querySelector(".cm-wikilink");
    expect(wikilink).not.toBeNull();
    expect(wikilink?.textContent).toBe("TargetNote");

    const syntaxMarks = container.querySelectorAll(".cm-markdown-syntax");
    expect(syntaxMarks.length).toBeGreaterThanOrEqual(8);

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});

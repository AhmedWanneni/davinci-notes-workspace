// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView, highlightActiveLine } from "@codemirror/view";
import { livePreviewExtension } from "../../../../packages/editor/livePreviewExtension";
import {
  editorTheme,
  readOnlyEditorTheme,
} from "../../../../packages/editor/editorTheme";
import { MarkdownView } from "../../../../packages/editor/MarkdownView";

describe("horizontal rule live preview extension", () => {
  const hrVariants = [
    "---",
    "----",
    "- - -",
    "***",
    "****",
    "* * *",
    "___",
    "____",
    "_ _ _",
  ];

  it("decorates all horizontal rule syntax variants with .cm-hr-line and .cm-markdown-syntax", () => {
    for (const variant of hrVariants) {
      const doc = `Above text\n\n${variant}\n\nBelow text`;
      const container = document.createElement("div");
      const view = new EditorView({
        state: EditorState.create({
          doc,
          extensions: [editorTheme, markdown(), livePreviewExtension],
        }),
        parent: container,
      });

      const hrLines = container.querySelectorAll(".cm-hr-line");
      expect(
        hrLines.length,
        `Expected .cm-hr-line for variant "${variant}"`,
      ).toBe(1);

      const syntaxMarks = hrLines[0].querySelectorAll(".cm-markdown-syntax");
      expect(
        syntaxMarks.length,
        `Expected .cm-markdown-syntax inside hr line for "${variant}"`,
      ).toBe(1);
      expect(syntaxMarks[0].textContent).toBe(variant);

      view.destroy();
    }
  });

  it("renders multiple horizontal rules in a single document", () => {
    const doc = hrVariants.join("\n\n");
    const container = document.createElement("div");
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: [editorTheme, markdown(), livePreviewExtension],
      }),
      parent: container,
    });

    const hrLines = container.querySelectorAll(".cm-hr-line");
    expect(hrLines.length).toBe(hrVariants.length);

    view.destroy();
  });

  it("allows cursor placement and text editing on the horizontal rule line without trapping", () => {
    const doc = "First line\n\n---\n\nLast line";
    const container = document.createElement("div");
    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: EditorSelection.cursor(0),
        extensions: [
          editorTheme,
          highlightActiveLine(),
          markdown(),
          livePreviewExtension,
        ],
      }),
      parent: container,
    });

    // Move cursor to horizontal rule line (offset 12 is start of "---" in "First line\n\n---\n\nLast line")
    view.dispatch({
      selection: EditorSelection.cursor(12),
    });

    // Verify active line receives .cm-activeLine
    const activeHrLine = container.querySelector(".cm-hr-line.cm-activeLine");
    expect(activeHrLine).not.toBeNull();

    // Type extra hyphen
    view.dispatch({
      changes: { from: 12, insert: "-" },
      selection: EditorSelection.cursor(13),
    });

    expect(view.state.doc.toString()).toBe("First line\n\n----\n\nLast line");

    // Replace the hr text with normal text
    view.dispatch({
      changes: { from: 12, to: 16, insert: "replaced" },
    });

    expect(view.state.doc.toString()).toBe(
      "First line\n\nreplaced\n\nLast line",
    );

    // Once changed to normal text, .cm-hr-line is removed
    const remainingHrLines = container.querySelectorAll(".cm-hr-line");
    expect(remainingHrLines.length).toBe(0);

    view.destroy();
  });

  it("renders horizontal rules in read-only MarkdownView", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<MarkdownView value={"Section 1\n\n---\n\nSection 2"} />);
    });

    const hrLine = container.querySelector(".cm-hr-line");
    expect(hrLine).not.toBeNull();

    const syntaxMark = hrLine?.querySelector(".cm-markdown-syntax");
    expect(syntaxMark).not.toBeNull();
    expect(syntaxMark?.textContent).toBe("---");

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it("correctly decorates horizontal rules with readOnlyEditorTheme", () => {
    const container = document.createElement("div");
    const view = new EditorView({
      state: EditorState.create({
        doc: "First\n\n***\n\nSecond",
        extensions: [
          readOnlyEditorTheme,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          markdown(),
          livePreviewExtension,
        ],
      }),
      parent: container,
    });

    const hrLine = container.querySelector(".cm-hr-line");
    expect(hrLine).not.toBeNull();

    view.destroy();
  });
});

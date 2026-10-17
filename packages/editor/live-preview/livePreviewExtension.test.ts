// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { highlightExtension } from "./highlightExtension";
import { livePreviewExtension } from "./livePreviewExtension";

function createEditor(doc: string, selectionHead = 0) {
  const state = EditorState.create({
    doc,
    selection: { anchor: selectionHead },
    extensions: [
      markdown({ extensions: [Strikethrough, highlightExtension] }),
      livePreviewExtension,
    ],
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  return { view, cleanup: () => container.remove() };
}

describe("livePreviewExtension marker visibility", () => {
  it("hides heading markers when cursor is not in heading, reveals when cursor is in heading", () => {
    const text = "# Heading 1\nSecond line";
    // Cursor on line 2 (offset 15)
    const { view, cleanup } = createEditor(text, 15);
    try {
      const line1 = view.dom.querySelector(".cm-line");
      const hiddenMarks = line1?.querySelectorAll(".cm-marker-hidden");
      expect(hiddenMarks?.length).toBeGreaterThan(0);

      // Move cursor inside heading on line 1 (offset 5)
      view.dispatch({ selection: { anchor: 5 } });
      const activeMarks = line1?.querySelectorAll(".cm-marker-active");
      expect(activeMarks?.length).toBeGreaterThan(0);
    } finally {
      cleanup();
    }
  });

  it("hides bold and italic markers when cursor is outside, reveals when cursor enters", () => {
    const text = "Normal text **bold** and *italic* text";
    // Cursor at position 0 (outside bold and italic)
    const { view, cleanup } = createEditor(text, 0);
    try {
      let hidden = view.dom.querySelectorAll(".cm-marker-hidden");
      expect(hidden.length).toBeGreaterThanOrEqual(4);

      // Move cursor into bold text (offset 16)
      view.dispatch({ selection: { anchor: 16 } });
      const activeBold = view.dom.querySelectorAll(".cm-marker-active");
      expect(activeBold.length).toBeGreaterThanOrEqual(2);

      // Italic markers should remain hidden
      hidden = view.dom.querySelectorAll(".cm-marker-hidden");
      expect(hidden.length).toBeGreaterThanOrEqual(2);
    } finally {
      cleanup();
    }
  });

  it("hides inline code markers when cursor is outside, reveals when inside", () => {
    const text = "Prefix `code` suffix";
    const { view, cleanup } = createEditor(text, 0);
    try {
      const hidden = view.dom.querySelectorAll(".cm-marker-hidden");
      expect(hidden.length).toBeGreaterThanOrEqual(2);

      // Move cursor into code (offset 9)
      view.dispatch({ selection: { anchor: 9 } });
      const active = view.dom.querySelectorAll(".cm-marker-active");
      expect(active.length).toBeGreaterThanOrEqual(2);
    } finally {
      cleanup();
    }
  });

  it("hides wikilink markers when cursor is outside, reveals when inside", () => {
    const text = "Note [[Target Note|Alias]] end";
    const { view, cleanup } = createEditor(text, 0);
    try {
      const hidden = view.dom.querySelectorAll(".cm-marker-hidden");
      expect(hidden.length).toBeGreaterThanOrEqual(2);

      // Move cursor into wikilink (offset 10)
      view.dispatch({ selection: { anchor: 10 } });
      const active = view.dom.querySelectorAll(".cm-marker-active");
      expect(active.length).toBeGreaterThanOrEqual(2);
    } finally {
      cleanup();
    }
  });

  it("preserves raw markers in doc slices for copy operations across hidden spans", () => {
    const text = "Before **bold** after";
    const { view, cleanup } = createEditor(text, 0);
    try {
      // Select across the bold range
      const slice = view.state.sliceDoc(7, 15);
      expect(slice).toBe("**bold**");
    } finally {
      cleanup();
    }
  });
});

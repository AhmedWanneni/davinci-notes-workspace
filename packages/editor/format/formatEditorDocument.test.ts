// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history, undo } from "@codemirror/commands";
import { formatEditorDocument } from "./formatEditorDocument";

if (typeof Range.prototype.getClientRects !== "function") {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}

describe("formatEditorDocument", () => {
  const views: EditorView[] = [];

  afterEach(() => {
    views.forEach((v) => v.destroy());
    views.length = 0;
  });

  function createView(
    doc: string,
    selection?: { anchor: number; head?: number },
  ) {
    const state = EditorState.create({
      doc,
      selection: selection
        ? { anchor: selection.anchor, head: selection.head ?? selection.anchor }
        : undefined,
      extensions: [history()],
    });
    const view = new EditorView({ state });
    views.push(view);
    return view;
  }

  it("formats the whole document and single undo restores original", () => {
    const original = "Paragraph 1    \n\n\n\nParagraph 2   ";
    const view = createView(original, { anchor: 5 });

    const result = formatEditorDocument(view);
    expect(result.changed).toBe(true);
    expect(view.state.doc.toString()).toBe("Paragraph 1\n\nParagraph 2\n");

    // Single undo restores the exact original text
    undo(view);
    expect(view.state.doc.toString()).toBe(original);
  });

  it("returns changed: false when document is already tidy", () => {
    const tidy = "Paragraph 1\n\nParagraph 2\n";
    const view = createView(tidy);

    const result = formatEditorDocument(view);
    expect(result.changed).toBe(false);
    expect(view.state.doc.toString()).toBe(tidy);
  });

  it("formats only selection when selectionOnly is true and text is selected", () => {
    const doc = "Line 1   \nLine 2   \nLine 3   ";
    // Select Line 2 (offsets 10 to 18)
    const view = createView(doc, { anchor: 10, head: 18 });

    const result = formatEditorDocument(view, { selectionOnly: true });
    expect(result.changed).toBe(true);
    expect(result.isSelection).toBe(true);
    // Line 1 and 3 should retain trailing spaces; Line 2 trimmed
    expect(view.state.doc.toString()).toBe("Line 1   \nLine 2\nLine 3   ");
  });

  it("keeps cursor position mapped through the changes", () => {
    const doc = "Hello world    \nNext line";
    // Cursor at "world" (index 11)
    const view = createView(doc, { anchor: 11 });

    formatEditorDocument(view);
    // After trimming trailing spaces, cursor should still be right after "world"
    expect(view.state.selection.main.head).toBe(11);
  });
});

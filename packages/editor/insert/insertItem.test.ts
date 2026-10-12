// @vitest-environment jsdom
import { history, undo } from "@codemirror/commands";
import { EditorSelection, EditorState } from "@codemirror/state";
import { nextSnippetField } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { findInsertItem } from "./InsertRegistry";
import { insertItem } from "./InsertAction";

if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}

const views: EditorView[] = [];

function createEditor(doc: string, from = 0, to = from, editable = true) {
  const v = new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.range(from, to),
      extensions: [history(), EditorView.editable.of(editable)],
    }),
  });
  views.push(v);
  return v;
}

afterEach(() => {
  while (views.length > 0) {
    views.pop()?.destroy();
  }
});

describe("insertItem", () => {
  it("replaces selected text and pads a block in one undoable insertion", () => {
    const editor = createEditor("Before chosen after", 7, 13);
    insertItem(editor, findInsertItem("quote")!);

    expect(editor.state.doc.toString()).toBe("Before \n\n> chosen\n\n after");
    expect(undo(editor)).toBe(true);
    expect(editor.state.doc.toString()).toBe("Before chosen after");
  });

  it("activates snippet fields", () => {
    const editor = createEditor("text", 4);
    insertItem(editor, findInsertItem("callout")!);

    expect(editor.state.doc.toString()).toBe("text\n\n> [!note] Title\n> Content");
    expect(editor.state.selection.main.from).toBe(16);
    expect(nextSnippetField(editor)).toBe(true);
  });

  it("uses a saved selection after the menu has taken focus", () => {
    const editor = createEditor("first second", 0, 5);
    const saved = editor.state.selection;
    editor.dispatch({ selection: { anchor: 12 } });
    insertItem(editor, findInsertItem("heading-1")!, saved);

    expect(editor.state.doc.toString()).toBe("# first\n\n second");
  });

  it("does nothing in a read-only view", () => {
    const editor = createEditor("text", 0, 4, false);
    expect(insertItem(editor, findInsertItem("quote")!)).toBe(false);
    expect(editor.state.doc.toString()).toBe("text");
  });

  it("inserts note-embed item with input, pads block, is undoable, and no-ops in read-only view", () => {
    const editor = createEditor("Before\nAfter", 7);
    const item = findInsertItem("note-embed")!;
    insertItem(editor, item, undefined, "", { target: "MyNote", heading: "Heading" });

    expect(editor.state.doc.toString()).toBe("Before\n\n![[MyNote#Heading]]\n\nAfter");
    expect(undo(editor)).toBe(true);
    expect(editor.state.doc.toString()).toBe("Before\nAfter");

    const readOnly = createEditor("Text", 0, 4, false);
    expect(insertItem(readOnly, item, undefined, "", { target: "MyNote" })).toBe(false);
    expect(readOnly.state.doc.toString()).toBe("Text");
  });
});

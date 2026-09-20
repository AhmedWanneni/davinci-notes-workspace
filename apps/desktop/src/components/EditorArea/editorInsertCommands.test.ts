// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  insertEditorText,
  prefixEditorLines,
  wrapEditorSelection,
} from "./editorInsertCommands";

function editor(doc: string, from = 0, to = from) {
  const host = document.createElement("div");
  document.body.append(host);
  return new EditorView({
    state: EditorState.create({ doc, selection: { anchor: from, head: to } }),
    parent: host,
  });
}

describe("editor insert commands", () => {
  it("wraps a selection in one dispatch", () => {
    const view = editor("text", 0, 4);
    wrapEditorSelection(view, "**");
    expect(view.state.doc.toString()).toBe("**text**");
    view.destroy();
  });
  it("prefixes every selected line", () => {
    const view = editor("one\ntwo", 0, 7);
    prefixEditorLines(view, "> ");
    expect(view.state.doc.toString()).toBe("> one\n> two");
    view.destroy();
  });
  it("inserts at the active selection", () => {
    const view = editor("", 0);
    insertEditorText(view, "2026-09-20");
    expect(view.state.doc.toString()).toBe("2026-09-20");
    view.destroy();
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  insertEditorText,
  insertDate,
  insertHorizontalRule,
  insertTime,
  prefixEditorLines,
  toggleHeading,
  toggleLinePrefix,
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
  it("replaces and toggles a heading prefix", () => {
    const view = editor("## Two", 0, 6);
    toggleHeading(view, 1);
    expect(view.state.doc.toString()).toBe("# Two");
    toggleHeading(view, 1);
    expect(view.state.doc.toString()).toBe("Two");
    view.destroy();
  });
  it("toggles selected list and quote prefixes", () => {
    const view = editor("one\ntwo", 0, 7);
    toggleLinePrefix(view, "> ");
    expect(view.state.doc.toString()).toBe("> one\n> two");
    toggleLinePrefix(view, "> ");
    expect(view.state.doc.toString()).toBe("one\ntwo");
    view.destroy();
  });
  it("inserts a rule with blank lines and stable date formats", () => {
    const view = editor("text", 1);
    insertHorizontalRule(view);
    expect(view.state.doc.toString()).toBe("text\n\n---\n\n");
    insertDate(view, new Date("2026-09-20T12:34:00Z"));
    insertTime(view, new Date("2026-09-20T12:34:00Z"));
    expect(view.state.doc.toString()).toMatch(/2026-09-20\d{2}:34/);
    view.destroy();
  });
});

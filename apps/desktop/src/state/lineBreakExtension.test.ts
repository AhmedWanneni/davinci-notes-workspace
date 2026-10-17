// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import {
  insertHardLineBreak,
  softLineBreakExtension,
} from "../../../../packages/editor/live-preview/lineBreakExtension";

function softBreakRanges(doc: string): Array<[number, number]> {
  const state = EditorState.create({
    doc,
    extensions: [markdown(), softLineBreakExtension],
  });
  const ranges: Array<[number, number]> = [];
  state.field(softLineBreakExtension).between(0, doc.length, (from, to) => {
    ranges.push([from, to]);
  });
  return ranges;
}

describe("soft line break decorations", () => {
  it("replaces a single paragraph newline with a space", () => {
    expect(softBreakRanges("line one\nline two")).toEqual([[8, 9]]);
  });

  it("preserves two-space hard breaks and blank paragraph boundaries", () => {
    expect(softBreakRanges("line one  \nline two")).toEqual([]);
    expect(softBreakRanges("first paragraph\n\nsecond paragraph")).toEqual([]);
  });

  it("renders a soft break as an inline space widget", () => {
    const container = document.createElement("div");
    const view = new EditorView({
      state: EditorState.create({
        doc: "line one\nline two",
        extensions: [markdown(), softLineBreakExtension],
      }),
      parent: container,
    });

    expect(container.querySelector(".cm-soft-line-break")?.textContent).toBe(
      " ",
    );
    view.destroy();
  });

  it("inserts a Markdown hard break for Shift+Enter", () => {
    const state = EditorState.create({
      doc: "line one",
      selection: EditorSelection.cursor(8),
    });
    let nextState = state;

    expect(
      insertHardLineBreak({
        state,
        dispatch: (transaction) => {
          nextState = transaction.state;
        },
      }),
    ).toBe(true);
    expect(nextState.doc.toString()).toBe("line one  \n");
  });
});

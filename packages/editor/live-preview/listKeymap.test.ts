// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  handleListEnter,
  handleListTab,
  handleListShiftTab,
  handleListBackspace,
} from "./listKeymap";

function createTestView(doc: string, cursorOffset: number) {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursorOffset },
  });
  return new EditorView({ state });
}

describe("listKeymap", () => {
  it("continues numeric list on Enter", () => {
    const text = "1. First item";
    const view = createTestView(text, text.length);
    const handled = handleListEnter(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("1. First item\n2. ");
  });

  it("continues alphabetic list on Enter", () => {
    const text = "a. Item";
    const view = createTestView(text, text.length);
    const handled = handleListEnter(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("a. Item\nb. ");
  });

  it("clears empty list item on Enter", () => {
    const text = "2. ";
    const view = createTestView(text, text.length);
    const handled = handleListEnter(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("");
  });

  it("restarts sub-numeric list at 1. when Tab is pressed", () => {
    const text = "2. Subitem";
    const view = createTestView(text, 2);
    const handled = handleListTab(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("   1. Subitem");
  });

  it("unindents list when Shift-Tab is pressed", () => {
    const text = "   1. Subitem";
    const view = createTestView(text, 5);
    const handled = handleListShiftTab(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("1. Subitem");
  });

  it("completes sublist on empty item Enter and returns to parent level", () => {
    const text = "1. Parent\n   1. Sub\n   2. ";
    const view = createTestView(text, text.length);
    const handled = handleListEnter(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("1. Parent\n   1. Sub\n2. ");
  });

  it("continues sublist on Enter at the exact same indent level (does not indent further)", () => {
    const text = "1. Parent\n   5. Sub item";
    const view = createTestView(text, text.length);
    const handled = handleListEnter(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("1. Parent\n   5. Sub item\n   6. ");
  });

  it("outdents empty sublist on Backspace", () => {
    const text = "1. Parent\n   1. Sub\n   2. ";
    const view = createTestView(text, text.length);
    const handled = handleListBackspace(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("1. Parent\n   1. Sub\n2. ");
  });

  it("clears top-level empty list on Backspace", () => {
    const text = "2. ";
    const view = createTestView(text, text.length);
    const handled = handleListBackspace(view);
    expect(handled).toBe(true);
    expect(view.state.doc.toString()).toBe("");
  });
});

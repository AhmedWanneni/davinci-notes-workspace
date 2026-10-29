// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history } from "@app/editor";

if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}
import {
  handleBold,
  handleItalic,
  handleUnderline,
  handleStrikethrough,
  handleHighlight,
  handleInlineCode,
  handleHeadingChange,
  handleBulletList,
  handleNumberedList,
  handleTaskList,
  handleQuote,
  handleDivider,
  handleLink,
  handleTable,
  handleCodeBlock,
  handleUndo,
  handleRedo,
} from "./formattingCommands";

function createTestView(doc: string, from = 0, to = from) {
  const state = EditorState.create({
    doc,
    selection: { anchor: from, head: to },
    extensions: [history()],
  });
  return new EditorView({ state });
}

describe("formattingCommands", () => {
  it("wraps selection with bold and unwraps", () => {
    const view = createTestView("hello world", 6, 11);
    handleBold(view);
    expect(view.state.doc.toString()).toBe("hello **world**");

    view.dispatch({ selection: { anchor: 6, head: 15 } });
    handleBold(view);
    expect(view.state.doc.toString()).toBe("hello world");
    view.destroy();
  });

  it("handles italic, underline, strikethrough, highlight, code", () => {
    const view = createTestView("sample", 0, 6);
    handleItalic(view);
    expect(view.state.doc.toString()).toBe("*sample*");
    view.destroy();

    const v2 = createTestView("sample", 0, 6);
    handleUnderline(v2);
    expect(v2.state.doc.toString()).toBe("<u>sample</u>");
    v2.destroy();

    const v3 = createTestView("sample", 0, 6);
    handleStrikethrough(v3);
    expect(v3.state.doc.toString()).toBe("~~sample~~");
    v3.destroy();

    const v4 = createTestView("sample", 0, 6);
    handleHighlight(v4);
    expect(v4.state.doc.toString()).toBe("==sample==");
    v4.destroy();

    const v5 = createTestView("sample", 0, 6);
    handleInlineCode(v5);
    expect(v5.state.doc.toString()).toBe("`sample`");
    v5.destroy();
  });

  it("toggles headings and clears them with level 0", () => {
    const view = createTestView("My Heading", 0, 0);
    handleHeadingChange(view, 1);
    expect(view.state.doc.toString()).toBe("# My Heading");

    handleHeadingChange(view, 0);
    expect(view.state.doc.toString()).toBe("My Heading");
    view.destroy();
  });

  it("toggles bullet list, numbered list, task list, and quote", () => {
    const view = createTestView("item 1", 0, 0);
    handleBulletList(view);
    expect(view.state.doc.toString()).toBe("- item 1");
    view.destroy();

    const v2 = createTestView("item 1", 0, 0);
    handleNumberedList(v2);
    expect(v2.state.doc.toString()).toBe("1. item 1");
    v2.destroy();

    const v3 = createTestView("task", 0, 0);
    handleTaskList(v3);
    expect(v3.state.doc.toString()).toBe("- [ ] task");
    v3.destroy();

    const v4 = createTestView("quote", 0, 0);
    handleQuote(v4);
    expect(v4.state.doc.toString()).toBe("> quote");
    v4.destroy();
  });

  it("inserts link, table, code block, and divider", () => {
    const view = createTestView("davinci", 0, 7);
    handleLink(view);
    expect(view.state.doc.toString()).toBe("[davinci](url)");
    view.destroy();

    const v2 = createTestView("");
    handleTable(v2);
    expect(v2.state.doc.toString()).toContain("| Header 1 | Header 2 |");
    v2.destroy();

    const v3 = createTestView("");
    handleCodeBlock(v3);
    expect(v3.state.doc.toString()).toBe("```\n\n```\n\n");
    v3.destroy();

    const v4 = createTestView("");
    handleDivider(v4);
    expect(v4.state.doc.toString()).toBe("---\n\n");
    v4.destroy();
  });

  it("handles undo and redo", () => {
    const view = createTestView("test", 0, 4);
    handleBold(view);
    expect(view.state.doc.toString()).toBe("**test**");

    handleUndo(view);
    expect(view.state.doc.toString()).toBe("test");

    handleRedo(view);
    expect(view.state.doc.toString()).toBe("**test**");
    view.destroy();
  });
});

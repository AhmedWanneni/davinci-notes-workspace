// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history, undo } from "@codemirror/commands";
import {
  runInsertItem,
  closeInsertDialog,
  completeInsertDialog,
  cancelInsertDialog,
  getInsertDialogRequest,
} from "./insertDialogStore";
import { findInsertItem } from "./InsertRegistry";
import { clearRecentInserts, getRecentInsertIds } from "./recentInsertStore";

if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}

function createTestView(doc: string, editable = true, pos = 0) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const state = EditorState.create({
    doc,
    selection: { anchor: pos },
    extensions: [
      EditorView.editable.of(editable),
      history({ newGroupDelay: 0 }),
    ],
  });
  const view = new EditorView({ state, parent: container });
  return {
    view,
    destroy: () => {
      view.destroy();
      container.remove();
    },
  };
}

describe("insertDialogStore runner and lifecycle", () => {
  beforeEach(() => {
    closeInsertDialog();
    clearRecentInserts();
  });

  it("does nothing when editor view is read-only", () => {
    const { view, destroy } = createTestView("hello", false);
    const item = findInsertItem("youtube")!;
    const started = runInsertItem(view, item);

    expect(started).toBe(false);
    expect(getInsertDialogRequest()).toBeNull();
    destroy();
  });

  it("opens dialog for items with dialog spec", () => {
    const { view, destroy } = createTestView("hello", true, 5);
    const item = findInsertItem("youtube")!;
    const started = runInsertItem(view, item);

    expect(started).toBe(true);
    const req = getInsertDialogRequest();
    expect(req).not.toBeNull();
    expect(req?.item.id).toBe("youtube");
    destroy();
  });

  it("inserts in one transaction with padding and restores text on undo", () => {
    const { view, destroy } = createTestView("before\n\nafter", true, 7);
    const item = findInsertItem("youtube")!;
    runInsertItem(view, item);
    const req = getInsertDialogRequest()!;

    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    completeInsertDialog(req, { url });

    expect(getInsertDialogRequest()).toBeNull();
    expect(view.state.doc.toString()).toContain(`![](${url})`);
    expect(getRecentInsertIds()).toContain("youtube");

    // One undo restores the document
    undo(view);
    expect(view.state.doc.toString()).toBe("before\n\nafter");
    destroy();
  });

  it("cancels dialog, inserting nothing and keeping editor cursor", () => {
    const { view, destroy } = createTestView("hello", true, 3);
    const item = findInsertItem("tweet")!;
    runInsertItem(view, item);
    const req = getInsertDialogRequest()!;

    cancelInsertDialog(req);

    expect(getInsertDialogRequest()).toBeNull();
    expect(view.state.doc.toString()).toBe("hello");
    expect(view.state.selection.main.anchor).toBe(3);
    expect(getRecentInsertIds()).not.toContain("tweet");
    destroy();
  });
});

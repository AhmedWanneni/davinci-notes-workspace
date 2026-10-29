// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  useEditorAiSelection,
  getSelectionBoundingRect,
} from "./useEditorAiSelection";

function createMockView(text: string, from = 0, to = 0) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc: text,
      selection: { anchor: from, head: to },
    }),
    parent: container,
  });

  // Mock coordsAtPos for jsdom
  view.coordsAtPos = vi.fn().mockImplementation((pos: number) => ({
    top: 100,
    bottom: 120,
    left: pos * 10,
    right: pos * 10 + 5,
  }));

  return {
    view,
    destroy() {
      view.destroy();
      document.body.removeChild(container);
    },
  };
}

describe("useEditorAiSelection", () => {
  it("computes bounding rectangle from coordsAtPos", () => {
    const { view, destroy } = createMockView("Hello world", 0, 5);
    const rect = getSelectionBoundingRect(view, 0, 5);

    expect(rect).not.toBeNull();
    expect(rect?.top).toBe(100);
    expect(rect?.bottom).toBe(120);
    expect(rect?.left).toBe(0);
    destroy();
  });

  it("opens popover and captures selected text", () => {
    const { view, destroy } = createMockView("Hello world", 0, 5);
    const { result } = renderHook(() => useEditorAiSelection(view));

    act(() => {
      result.current.openPopover();
    });

    expect(result.current.isPopoverOpen).toBe(true);
    expect(result.current.selectionBounds?.text).toBe("Hello");
    destroy();
  });

  it("replaces selection with generated text", () => {
    const { view, destroy } = createMockView("Hello world", 0, 5);
    const { result } = renderHook(() => useEditorAiSelection(view));

    act(() => {
      result.current.openPopover();
    });

    act(() => {
      result.current.replaceSelection("Greetings");
    });

    expect(view.state.doc.toString()).toBe("Greetings world");
    expect(result.current.isPopoverOpen).toBe(false);
    destroy();
  });

  it("inserts generated text below selection paragraph", () => {
    const { view, destroy } = createMockView("Hello world", 0, 5);
    const { result } = renderHook(() => useEditorAiSelection(view));

    act(() => {
      result.current.openPopover();
    });

    act(() => {
      result.current.insertBelowSelection("Extra note");
    });

    expect(view.state.doc.toString()).toBe("Hello world\n\nExtra note");
    expect(result.current.isPopoverOpen).toBe(false);
    destroy();
  });
});

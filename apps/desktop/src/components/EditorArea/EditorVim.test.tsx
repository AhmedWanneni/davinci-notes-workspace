// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, act, fireEvent } from "@testing-library/react";
import { Editor } from "@app/editor";

if (typeof Range.prototype.getClientRects !== "function") {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}
if (typeof Range.prototype.getBoundingClientRect !== "function") {
  Range.prototype.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

describe("Editor Vim mode toggle", () => {
  it("enables vim mode, transitions modes, and handles vim key commands", async () => {
    let capturedView: any = null;
    let currentVimMode: string | null = null;
    const onChange = vi.fn();
    const { rerender } = render(
      <Editor
        value="Hello world\nSecond line"
        onChange={onChange}
        notePaths={[]}
        sourcePath="test.md"
        onLinkClick={vi.fn()}
        useVimMode={false}
        onVimModeChange={(mode) => {
          currentVimMode = mode;
        }}
        onViewReady={(view) => {
          capturedView = view;
        }}
      />,
    );

    expect(capturedView).not.toBeNull();
    expect(currentVimMode).toBeNull();

    // 1. User activates Vim in settings:
    await act(async () => {
      rerender(
        <Editor
          value="Hello world\nSecond line"
          onChange={onChange}
          notePaths={[]}
          sourcePath="test.md"
          onLinkClick={vi.fn()}
          useVimMode={true}
          onVimModeChange={(mode) => {
            currentVimMode = mode;
          }}
          onViewReady={(view) => {
            capturedView = view;
          }}
        />,
      );
    });

    const cm = (capturedView as any).cm;
    expect(cm?.state?.vim).toBeDefined();
    expect(currentVimMode).toBe("NORMAL");

    // 2. Press 'x' in normal mode (deletes char 'H')
    capturedView.focus();
    fireEvent.keyDown(capturedView.contentDOM, { key: "x", code: "KeyX" });
    const currentDoc = capturedView.state.doc.toString();
    expect(currentDoc.startsWith("ello world")).toBe(true);

    // 3. Press 'i' to enter INSERT mode
    fireEvent.keyDown(capturedView.contentDOM, { key: "i", code: "KeyI" });
    expect(currentVimMode).toBe("INSERT");

    // 4. Send Escape to return to NORMAL mode
    fireEvent.keyDown(capturedView.contentDOM, { key: "Escape", code: "Escape" });
    expect(currentVimMode).toBe("NORMAL");

    // 5. User disables Vim in settings:
    await act(async () => {
      rerender(
        <Editor
          value={capturedView.state.doc.toString()}
          onChange={onChange}
          notePaths={[]}
          sourcePath="test.md"
          onLinkClick={vi.fn()}
          useVimMode={false}
          onVimModeChange={(mode) => {
            currentVimMode = mode;
          }}
          onViewReady={(view) => {
            capturedView = view;
          }}
        />,
      );
    });

    expect(currentVimMode).toBeNull();
  });

  it("initializes immediately in Vim mode when useVimMode is true on initial mount", async () => {
    let capturedView: any = null;
    let currentVimMode: string | null = null;
    render(
      <Editor
        value="Alpha Beta"
        onChange={vi.fn()}
        notePaths={[]}
        sourcePath="alpha.md"
        onLinkClick={vi.fn()}
        useVimMode={true}
        onVimModeChange={(mode) => {
          currentVimMode = mode;
        }}
        onViewReady={(view) => {
          capturedView = view;
        }}
      />,
    );

    expect(capturedView).not.toBeNull();
    const cm = (capturedView as any).cm;
    expect(cm?.state?.vim).toBeDefined();
    expect(currentVimMode).toBe("NORMAL");
  });
});

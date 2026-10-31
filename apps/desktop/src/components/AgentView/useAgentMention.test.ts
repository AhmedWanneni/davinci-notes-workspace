// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentMention } from "./useAgentMention";

describe("useAgentMention", () => {
  it("detects @ mention query from cursor position and inserts selected path", () => {
    let inputVal = "Check note @me";
    const setInput = vi.fn((val: string) => {
      inputVal = val;
    });

    const textarea = document.createElement("textarea");
    textarea.value = inputVal;
    textarea.selectionStart = inputVal.length;
    textarea.selectionEnd = inputVal.length;
    const ref = { current: textarea };

    const { result } = renderHook(() =>
      useAgentMention(inputVal, setInput, ref),
    );

    // Simulate typing
    act(() => {
      result.current.handleInputChange({
        target: textarea,
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });

    expect(result.current.mentionQuery).toBe("me");

    // Select mention
    act(() => {
      result.current.handleSelectMention({
        id: "file:Meeting.md",
        type: "file",
        path: "Notes/Meeting.md",
        label: "Meeting.md",
      });
    });

    expect(result.current.mentions).toEqual([
      expect.objectContaining({ path: "Notes/Meeting.md" }),
    ]);
    expect(result.current.mentionQuery).toBeNull();
  });
});

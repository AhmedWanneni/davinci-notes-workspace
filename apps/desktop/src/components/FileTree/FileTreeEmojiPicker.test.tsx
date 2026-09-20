// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileTreeEmojiPicker } from "./FileTreeEmojiPicker";

vi.mock("frimousse", () => ({
  EmojiPicker: {
    Root: ({
      children,
      onEmojiSelect,
    }: {
      children: React.ReactNode;
      onEmojiSelect?: (emoji: { emoji: string; label: string }) => void;
    }) => (
      <div>
        <button
          type="button"
          onClick={() => onEmojiSelect?.({ emoji: "🚀", label: "rocket" })}
        >
          rocket
        </button>
        {children}
      </div>
    ),
    Search: () => <input aria-label="Search emoji" />,
    Viewport: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Loading: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    Empty: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    List: () => null,
  },
}));

describe("FileTreeEmojiPicker", () => {
  it("selects an emoji and can close", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<FileTreeEmojiPicker onSelect={onSelect} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "rocket" }));
    expect(onSelect).toHaveBeenCalledWith("🚀");

    fireEvent.click(screen.getByRole("button", { name: "Close emoji picker" }));
    expect(onClose).toHaveBeenCalled();
  });
});

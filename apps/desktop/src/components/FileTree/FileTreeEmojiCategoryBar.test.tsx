// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileTreeEmojiCategoryBar } from "./FileTreeEmojiCategoryBar";

describe("FileTreeEmojiCategoryBar", () => {
  it("triggers category jump on click", () => {
    const onJump = vi.fn();
    render(<FileTreeEmojiCategoryBar onJump={onJump} />);

    fireEvent.click(screen.getByRole("button", { name: "Smileys & people" }));
    expect(onJump).toHaveBeenCalledWith("smileys");
  });
});

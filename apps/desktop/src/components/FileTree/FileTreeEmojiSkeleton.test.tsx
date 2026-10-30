// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileTreeEmojiSkeleton } from "./FileTreeEmojiSkeleton";

describe("FileTreeEmojiSkeleton", () => {
  it("renders status with accessible label", () => {
    render(<FileTreeEmojiSkeleton />);
    expect(screen.getByRole("status").textContent).toContain("Loading emoji…");
  });
});

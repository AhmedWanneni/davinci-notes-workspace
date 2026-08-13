import { describe, it, expect } from "vitest";
import { computeNoteStats } from "./StatusBar";

describe("computeNoteStats", () => {
  it("computes word count, character count, and property count from note content", () => {
    const content = `---
tags: [test, doc]
author: Leonardo
---
# Hello World

This is a test note with eight words.`;

    const stats = computeNoteStats(content);
    expect(stats.propertyCount).toBe(2);
    // Body is: # Hello World\n\nThis is a test note with eight words.
    expect(stats.wordCount).toBe(10);
    expect(stats.charCount).toBeGreaterThan(0);
  });

  it("handles empty content", () => {
    const stats = computeNoteStats("");
    expect(stats).toEqual({ wordCount: 0, charCount: 0, propertyCount: 0 });
  });
});

import { describe, expect, it } from "vitest";
import {
  emptyNoteHistory,
  moveNoteHistory,
  pushNoteHistory,
  renameNoteHistory,
} from "./noteHistory";

describe("note history", () => {
  it("pushes, drops forward history, and avoids duplicate entries", () => {
    let history = pushNoteHistory(emptyNoteHistory, "a.md");
    history = pushNoteHistory(history, "b.md");
    history = moveNoteHistory(history, -1);
    history = pushNoteHistory(history, "c.md");
    expect(history).toEqual({ paths: ["a.md", "c.md"], index: 1 });
    expect(pushNoteHistory(history, "c.md")).toBe(history);
  });

  it("clamps navigation and rewrites folder entries", () => {
    const history = { paths: ["old/a.md", "old/nested/b.md"], index: 0 };
    expect(moveNoteHistory(history, -1).index).toBe(0);
    expect(renameNoteHistory(history, "old", "new").paths).toEqual([
      "new/a.md",
      "new/nested/b.md",
    ]);
  });
});

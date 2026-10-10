import { describe, expect, it } from "vitest";
import { getRecentNotes } from "./recentNotes";

describe("getRecentNotes", () => {
  it("extracts unique recent notes in reverse chronological order", () => {
    const history = ["note-1.md", "note-2.md", "note-1.md", "note-3.md"];
    const all = ["note-1.md", "note-2.md", "note-3.md", "note-4.md"];
    const recents = getRecentNotes(history, [], null, all, 5);

    expect(recents).toEqual([
      { path: "note-3.md", title: "note-3" },
      { path: "note-1.md", title: "note-1" },
      { path: "note-2.md", title: "note-2" },
    ]);
  });

  it("caps results at the specified limit", () => {
    const history = ["1.md", "2.md", "3.md", "4.md", "5.md", "6.md", "7.md"];
    const all = ["1.md", "2.md", "3.md", "4.md", "5.md", "6.md", "7.md"];
    const recents = getRecentNotes(history, [], null, all, 5);

    expect(recents).toHaveLength(5);
    expect(recents.map((r) => r.path)).toEqual([
      "7.md",
      "6.md",
      "5.md",
      "4.md",
      "3.md",
    ]);
  });

  it("filters out deleted/non-existent notes", () => {
    const history = ["deleted.md", "existing.md"];
    const all = ["existing.md"];
    const recents = getRecentNotes(history, [], null, all, 5);

    expect(recents).toEqual([{ path: "existing.md", title: "existing" }]);
  });

  it("includes open tabs and active note when history is empty", () => {
    const history: string[] = [];
    const openNotes = ["tab1.md", "tab2.md"];
    const active = "tab1.md";
    const all = ["tab1.md", "tab2.md"];
    const recents = getRecentNotes(history, openNotes, active, all, 5);

    expect(recents).toEqual([
      { path: "tab1.md", title: "tab1" },
      { path: "tab2.md", title: "tab2" },
    ]);
  });
});

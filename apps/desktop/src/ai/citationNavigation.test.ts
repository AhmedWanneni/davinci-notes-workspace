import { describe, expect, it, vi } from "vitest";
import { revealCitationLine } from "./citationNavigation";

describe("revealCitationLine", () => {
  it("selects the exact offset for a citation near the end of a long note", () => {
    const setSelection = vi.fn();
    const content = Array.from({ length: 120 }, (_, index) => `line ${index + 1}`).join("\n");

    revealCitationLine({ getContent: () => content, setSelection }, { notePath: "long.md", startLine: 119 });

    const expected = content.split("\n").slice(0, 118).join("\n").length + 1;
    expect(setSelection).toHaveBeenCalledWith({ from: expected, to: expected });
  });

  it("clamps invalid source lines to the document", () => {
    const setSelection = vi.fn();
    revealCitationLine({ getContent: () => "one\ntwo", setSelection }, { notePath: "note.md", startLine: 99 });
    expect(setSelection).toHaveBeenCalledWith({ from: 4, to: 4 });
  });
});

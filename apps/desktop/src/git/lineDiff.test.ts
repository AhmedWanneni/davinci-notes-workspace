import { describe, expect, it } from "vitest";
import { lineDiff } from "./lineDiff";

describe("lineDiff", () => {
  it("shows unchanged, removed, and added lines in Git-compatible order", () => {
    expect(lineDiff("# Note\nfirst\n", "# Note\nsecond\n")).toEqual([
      { kind: "unchanged", text: "# Note" },
      { kind: "removed", text: "first" },
      { kind: "added", text: "second" },
      { kind: "unchanged", text: "" },
    ]);
  });
});

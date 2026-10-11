import { describe, expect, it } from "vitest";
import { findInsertItem, insertRegistry } from "./InsertRegistry";

describe("insertRegistry", () => {
  it("contains every Phase 1 item", () => {
    expect(insertRegistry).toHaveLength(15);
    expect(insertRegistry.map((item) => item.group)).toEqual(
      expect.arrayContaining(["Basics", "Code and data", "HTML"]),
    );
  });

  it("uses selected text as the first snippet placeholder", () => {
    expect(
      findInsertItem("heading-1")?.build({ selectedText: "Chosen" }),
    ).toEqual({
      text: "# ${1:Chosen}",
      block: true,
    });
  });

  it("builds the table and footnote templates with placeholders", () => {
    expect(findInsertItem("table")?.build({ selectedText: "" }).text).toContain(
      "${1:Header 1}",
    );
    expect(findInsertItem("footnote")?.build({ selectedText: "" }).text).toBe(
      "[^${1:1}]\n\n[^${1:1}]: ${2:Footnote}",
    );
  });
});

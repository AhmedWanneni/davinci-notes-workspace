import { describe, expect, it } from "vitest";
import { updateWikilinksForRename } from "./updateWikilinksForRename";

describe("updateWikilinksForRename", () => {
  it("updates plain and aliased wikilinks", () => {
    const content = "See [[Old Name]] and [[Old Name|alias]].";
    expect(updateWikilinksForRename(content, "Old Name", "New Name")).toBe(
      "See [[New Name]] and [[New Name|alias]].",
    );
  });

  it("preserves heading and block fragments", () => {
    const content = "[[Old#Heading]] and [[Old#^block-id]]";
    expect(updateWikilinksForRename(content, "Old", "New")).toBe(
      "[[New#Heading]] and [[New#^block-id]]",
    );
  });

  it("preserves embed prefixes while renaming embedded note targets", () => {
    expect(updateWikilinksForRename("![[Old#Overview]]", "Old", "New")).toBe(
      "![[New#Overview]]",
    );
  });

  it("leaves unrelated links unchanged", () => {
    const content = "[[Other Note]]";
    expect(updateWikilinksForRename(content, "Old", "New")).toBe(content);
  });
});

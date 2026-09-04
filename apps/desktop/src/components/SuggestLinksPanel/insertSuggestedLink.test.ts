import { describe, expect, it, vi } from "vitest";
import { insertSuggestedLink } from "./insertSuggestedLink";

describe("insertSuggestedLink", () => {
  it("uses the editor insertion path and canonical wikilink syntax", () => {
    const editor = { insertText: vi.fn() };
    insertSuggestedLink(editor, "projects/alpha.md");
    expect(editor.insertText).toHaveBeenCalledWith("[[projects/alpha.md]]");
  });
});

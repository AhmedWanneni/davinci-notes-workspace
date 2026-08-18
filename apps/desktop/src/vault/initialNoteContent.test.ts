import { describe, expect, it } from "vitest";
import { initialNoteContent, noteTitleFromPath } from "./initialNoteContent";

describe("noteTitleFromPath", () => {
  it("strips .md and uses basename only", () => {
    expect(noteTitleFromPath("Meeting Notes.md")).toBe("Meeting Notes");
    expect(noteTitleFromPath("daily/2026-08-17.md")).toBe("2026-08-17");
    expect(noteTitleFromPath("Untitled 2.md")).toBe("Untitled 2");
  });
});

describe("initialNoteContent", () => {
  it("produces an H1 from the file name plus a trailing blank line", () => {
    expect(initialNoteContent("Some Link.md")).toBe("# Some Link\n\n");
    expect(initialNoteContent("folder/Meeting Notes.md")).toBe(
      "# Meeting Notes\n\n",
    );
    expect(initialNoteContent("Untitled.md")).toBe("# Untitled\n\n");
  });
});

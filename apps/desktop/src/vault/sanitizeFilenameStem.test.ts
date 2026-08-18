import { describe, expect, it } from "vitest";
import {
  buildNotePathInFolder,
  noteStemsEqual,
  sanitizeFilenameStem,
} from "./sanitizeFilenameStem";

describe("sanitizeFilenameStem", () => {
  it("strips invalid filename characters", () => {
    expect(sanitizeFilenameStem('Meet:ing / Notes')).toBe("Meet ing   Notes");
  });

  it("returns null for empty or whitespace-only text", () => {
    expect(sanitizeFilenameStem("")).toBeNull();
    expect(sanitizeFilenameStem("   ")).toBeNull();
    expect(sanitizeFilenameStem("...")).toBeNull();
  });
});

describe("noteStemsEqual", () => {
  it("compares case-insensitively", () => {
    expect(noteStemsEqual("Meeting", "meeting")).toBe(true);
  });
});

describe("buildNotePathInFolder", () => {
  it("preserves folder prefix", () => {
    expect(buildNotePathInFolder("daily/note.md", "Renamed")).toBe(
      "daily/Renamed.md",
    );
  });
});

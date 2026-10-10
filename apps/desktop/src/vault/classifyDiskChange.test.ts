import { describe, expect, it } from "vitest";
import { classifyDiskChange } from "./classifyDiskChange";

describe("classifyDiskChange", () => {
  it("classifies identical content as touched_only", () => {
    expect(classifyDiskChange("Hello world\n", "Hello world\n")).toEqual({
      type: "touched_only",
    });
  });

  it("classifies pure appends and extracts tail", () => {
    const original = "Line 1\nLine 2\n";
    const disk = "Line 1\nLine 2\nLine 3 appended\n";
    expect(classifyDiskChange(original, disk)).toEqual({
      type: "pure_append",
      tail: "Line 3 appended\n",
    });
  });

  it("handles missing trailing newline in original with external append", () => {
    const original = "Line 1";
    const disk = "Line 1\nLine 2\n";
    expect(classifyDiskChange(original, disk)).toEqual({
      type: "pure_append",
      tail: "\nLine 2\n",
    });
  });

  it("handles CRLF line endings gracefully", () => {
    const original = "Line 1\r\nLine 2\r\n";
    const disk = "Line 1\r\nLine 2\r\nLine 3\r\n";
    expect(classifyDiskChange(original, disk)).toEqual({
      type: "pure_append",
      tail: "Line 3\r\n",
    });
  });

  it("classifies mid-file edits as conflict", () => {
    const original = "Line 1\nLine 2\nLine 3\n";
    const disk = "Line 1\nMODIFIED Line 2\nLine 3\n";
    expect(classifyDiskChange(original, disk)).toEqual({
      type: "conflict",
    });
  });

  it("classifies truncations as conflict", () => {
    const original = "Line 1\nLine 2\nLine 3\n";
    const disk = "Line 1\n";
    expect(classifyDiskChange(original, disk)).toEqual({
      type: "conflict",
    });
  });

  it("classifies total replacement as conflict", () => {
    const original = "Original document";
    const disk = "Completely different document";
    expect(classifyDiskChange(original, disk)).toEqual({
      type: "conflict",
    });
  });

  it("classifies missing/deleted file as deleted", () => {
    expect(classifyDiskChange("Any content", null)).toEqual({
      type: "deleted",
    });
  });

  it("handles note with YAML frontmatter correctly", () => {
    const original = "---\ntitle: Note\n---\nBody line 1\n";
    const disk =
      "---\ntitle: Note\n---\nBody line 1\n- [2026-10-10] Quick capture entry\n";
    expect(classifyDiskChange(original, disk)).toEqual({
      type: "pure_append",
      tail: "- [2026-10-10] Quick capture entry\n",
    });
  });
});

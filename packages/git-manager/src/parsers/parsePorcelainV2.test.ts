import { describe, it, expect } from "vitest";
import { parsePorcelainV2 } from "./parsePorcelainV2";

describe("parsePorcelainV2", () => {
  it("returns empty arrays for empty status", () => {
    const result = parsePorcelainV2("");
    expect(result.staged).toEqual([]);
    expect(result.unstaged).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.untracked).toEqual([]);
  });

  it("parses ordinary tracked changes (Type 1)", () => {
    // 1 .M = unstaged modified
    // 1 M. = staged modified
    // 1 MM = staged modified AND unstaged modified
    // 1 A. = staged addition
    // 1 .D = unstaged deletion
    const raw = [
      "1 .M N... 100644 100644 100644 abcdef1 abcdef2 Notes/Unstaged.md",
      "1 M. N... 100644 100644 100644 abcdef1 abcdef2 Notes/Staged.md",
      "1 MM N... 100644 100644 100644 abcdef1 abcdef2 Notes/Both.md",
      "1 A. N... 000000 100644 100644 0000000 abcdef3 Notes/New.md",
      "1 .D N... 100644 100644 000000 abcdef4 abcdef4 Notes/Deleted.md",
      "",
    ].join("\0");

    const result = parsePorcelainV2(raw);

    expect(result.staged).toHaveLength(3);
    expect(result.staged[0]).toEqual({
      path: "Notes/Staged.md",
      statusCode: "M",
      staged: true,
    });
    expect(result.staged[1]).toEqual({
      path: "Notes/Both.md",
      statusCode: "M",
      staged: true,
    });
    expect(result.staged[2]).toEqual({
      path: "Notes/New.md",
      statusCode: "A",
      staged: true,
    });

    expect(result.unstaged).toHaveLength(3);
    expect(result.unstaged[0]).toEqual({
      path: "Notes/Unstaged.md",
      statusCode: "M",
      staged: false,
    });
    expect(result.unstaged[1]).toEqual({
      path: "Notes/Both.md",
      statusCode: "M",
      staged: false,
    });
    expect(result.unstaged[2]).toEqual({
      path: "Notes/Deleted.md",
      statusCode: "D",
      staged: false,
    });
  });

  it("parses renamed entries (Type 2)", () => {
    const raw = [
      "2 R. N... 100644 100644 100644 abcdef1 abcdef2 R100 Notes/Renamed New.md",
      "Notes/Renamed Old.md",
      "",
    ].join("\0");

    const result = parsePorcelainV2(raw);

    expect(result.staged).toHaveLength(1);
    expect(result.staged[0]).toEqual({
      path: "Notes/Renamed New.md",
      oldPath: "Notes/Renamed Old.md",
      statusCode: "R",
      staged: true,
    });
  });

  it("parses unmerged conflict entries (Type u)", () => {
    const raw = [
      "u AA N... 000000 100644 100644 100644 0000000 1111111 2222222 Notes/Conflict.md",
      "",
    ].join("\0");

    const result = parsePorcelainV2(raw);

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toEqual({
      path: "Notes/Conflict.md",
      statusCode: "U",
      staged: false,
    });
  });

  it("parses untracked entries (Type ?)", () => {
    const raw = ["? Notes/Untracked.md", ""].join("\0");

    const result = parsePorcelainV2(raw);

    expect(result.untracked).toHaveLength(1);
    expect(result.untracked[0]).toEqual({
      path: "Notes/Untracked.md",
      statusCode: "?",
      staged: false,
    });
  });

  it("handles complex paths with unicode, emojis, and spaces", () => {
    const raw = [
      "1 .M N... 100644 100644 100644 abcdef1 abcdef2 Notes/💡 Ideas & Projects/2026 Étude — François & Müller.md",
      "? Attachments/photo 📸 with space.png",
      "",
    ].join("\0");

    const result = parsePorcelainV2(raw);

    expect(result.unstaged[0].path).toBe(
      "Notes/💡 Ideas & Projects/2026 Étude — François & Müller.md",
    );
    expect(result.untracked[0].path).toBe("Attachments/photo 📸 with space.png");
  });
});

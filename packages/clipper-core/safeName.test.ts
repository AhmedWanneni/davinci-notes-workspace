import { describe, expect, it } from "vitest";
import { isSafeRelativePath, safeName } from "./safeName";

describe("safeName", () => {
  it("cannot escape a folder from hostile input", () => {
    const hostile = [
      "../../etc/passwd",
      "..\\..\\Windows\\system32",
      "/absolute/path",
      "a/../../b",
      "....//....//x",
    ];
    for (const input of hostile) {
      const safe = safeName(input);
      expect(safe).not.toContain("/");
      expect(safe).not.toContain("\\");
      expect(safe).not.toContain("..");
      expect(safe.startsWith(".")).toBe(false);
    }
  });

  it("applies platform-specific illegal characters", () => {
    expect(safeName("a:b", { os: "linux" })).toBe("a:b");
    expect(safeName("a:b", { os: "mac" })).toBe("ab");
    expect(safeName("a:b", { os: "windows" })).toBe("ab");
    expect(safeName("a?b", { os: "linux" })).toBe("a?b");
    expect(safeName("a?b")).toBe("ab");
  });

  it("escapes Windows reserved device names only under Windows rules", () => {
    expect(safeName("CON")).toBe("_CON");
    expect(safeName("con.txt")).toBe("_con.txt");
    expect(safeName("CON", { os: "linux" })).toBe("CON");
  });

  it("falls back for empty results", () => {
    expect(safeName("")).toBe("Untitled");
    expect(safeName("   ")).toBe("Untitled");
    expect(safeName("...", { fallback: "Note" })).toBe("Note");
  });

  it("trims trailing dots and spaces and caps length", () => {
    expect(safeName("name. ")).toBe("name");
    expect(safeName("x".repeat(300)).length).toBe(200);
  });
});

describe("isSafeRelativePath", () => {
  it("accepts only forward, non-empty, non-traversing segments", () => {
    expect(isSafeRelativePath("Clippings/Recipes")).toBe(true);
    expect(isSafeRelativePath("../evil")).toBe(false);
    expect(isSafeRelativePath("a//b")).toBe(false);
    expect(isSafeRelativePath("a/./b")).toBe(false);
    expect(isSafeRelativePath("a\\b")).toBe(false);
    expect(isSafeRelativePath("")).toBe(false);
  });
});

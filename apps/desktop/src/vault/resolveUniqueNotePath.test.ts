import { describe, expect, it } from "vitest";
import { resolveUniqueNotePath } from "./resolveUniqueNotePath";

describe("resolveUniqueNotePath", () => {
  it("returns Untitled.md when no collision", () => {
    expect(resolveUniqueNotePath(["a.md", "b.md"])).toBe("Untitled.md");
  });

  it("increments suffix until unique", () => {
    expect(
      resolveUniqueNotePath(["Untitled.md", "Untitled 1.md", "other.md"]),
    ).toBe("Untitled 2.md");
  });
});

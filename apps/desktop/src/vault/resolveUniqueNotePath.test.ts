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

  it("uses a preferred path and preserves its folder and extension", () => {
    expect(
      resolveUniqueNotePath(
        ["projects/Plan copy.md", "projects/Plan copy 1.md"],
        "projects/Plan copy.md",
      ),
    ).toBe("projects/Plan copy 2.md");
  });
});

import { describe, expect, it } from "vitest";
import { resolveUniqueFolderPath } from "./resolveUniqueFolderPath";

describe("resolveUniqueFolderPath", () => {
  it("creates at vault root", () => {
    expect(resolveUniqueFolderPath("", [])).toBe("New Folder");
  });

  it("auto-disambiguates collisions", () => {
    expect(
      resolveUniqueFolderPath("", ["New Folder", "New Folder 2"]),
    ).toBe("New Folder 3");
  });

  it("creates inside a parent folder", () => {
    expect(resolveUniqueFolderPath("projects", ["projects/existing"])).toBe(
      "projects/New Folder",
    );
  });
});

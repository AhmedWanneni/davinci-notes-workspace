import { describe, expect, it } from "vitest";
import { buildTreeFromPaths } from "./tree-utils";

describe("buildTreeFromPaths", () => {
  it("shows empty folders from folderPaths", () => {
    const tree = buildTreeFromPaths([], ["empty-folder", "nested/child"]);
    expect(tree.map((node) => node.name)).toEqual(["empty-folder", "nested"]);
    expect(tree[1].children?.map((node) => node.name)).toEqual(["child"]);
  });

  it("merges folders implied by files with explicit empty folders", () => {
    const tree = buildTreeFromPaths(["projects/note.md"], ["projects/empty"]);
    const projects = tree.find((node) => node.name === "projects");
    expect(projects?.children?.map((node) => node.name).sort()).toEqual([
      "empty",
      "note.md",
    ]);
  });
});

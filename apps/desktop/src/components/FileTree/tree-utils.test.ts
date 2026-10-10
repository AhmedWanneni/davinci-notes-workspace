import { describe, expect, it } from "vitest";
import { buildTreeFromPaths, getAllFolderPaths } from "./tree-utils";

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

  it("sorts nodes alphabetically ascending and descending", () => {
    const files = ["banana.md", "apple.md", "cherry.md"];
    const asc = buildTreeFromPaths(files, [], "name-asc");
    expect(asc.map((n) => n.name)).toEqual([
      "apple.md",
      "banana.md",
      "cherry.md",
    ]);

    const desc = buildTreeFromPaths(files, [], "name-desc");
    expect(desc.map((n) => n.name)).toEqual([
      "cherry.md",
      "banana.md",
      "apple.md",
    ]);
  });

  it("extracts all folder paths with getAllFolderPaths", () => {
    const tree = buildTreeFromPaths(
      ["a/b/c.md", "docs/guide.md"],
      ["empty", "a/other"],
    );
    const paths = getAllFolderPaths(tree);
    expect(paths).toContain("a");
    expect(paths).toContain("a/b");
    expect(paths).toContain("a/other");
    expect(paths).toContain("docs");
    expect(paths).toContain("empty");
  });
});

import { describe, expect, it } from "vitest";
import { renderFrontmatter, yamlScalar } from "./frontmatter";

describe("yamlScalar", () => {
  it("leaves plain values unquoted and quotes risky ones", () => {
    expect(yamlScalar("Hello")).toBe("Hello");
    expect(yamlScalar("clippings")).toBe("clippings");
    expect(yamlScalar("https://x.y/z")).toBe('"https://x.y/z"');
    expect(yamlScalar("true")).toBe('"true"');
    expect(yamlScalar("2026")).toBe('"2026"');
    expect(yamlScalar("")).toBe('""');
  });
});

describe("renderFrontmatter", () => {
  it("returns an empty string when there is nothing to emit", () => {
    expect(renderFrontmatter({}, [])).toBe("");
  });

  it("emits scalars, numbers, arrays, and tags", () => {
    const block = renderFrontmatter(
      { title: "Hello", year: 2026, authors: ["a", "b"] },
      ["clippings"],
    );
    expect(block).toBe(
      "---\ntitle: Hello\nyear: 2026\nauthors:\n  - a\n  - b\ntags:\n  - clippings\n---\n",
    );
  });

  it("cannot be broken out of by a hostile value", () => {
    const block = renderFrontmatter({ title: "evil\n---\ntags: [hacked]" });
    const delimiters = block.split("\n").filter((line) => line === "---");
    expect(delimiters).toHaveLength(2);
    expect(block).toContain("\\n");
  });

  it("deduplicates tags and ignores a template `tags` property", () => {
    const block = renderFrontmatter({ tags: "nope", title: "T" }, [
      "a",
      "a",
      " b ",
    ]);
    expect(block).toBe("---\ntitle: T\ntags:\n  - a\n  - b\n---\n");
  });

  it("emits an explicit empty array", () => {
    expect(renderFrontmatter({ authors: [] })).toBe("---\nauthors: []\n---\n");
  });
});

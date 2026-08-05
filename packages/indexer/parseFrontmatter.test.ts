import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./parseFrontmatter";

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/frontmatter",
);

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf8");
}

describe("parseFrontmatter", () => {
  it("extracts valid YAML frontmatter and returns the body", () => {
    const raw = readFixture("valid.md");
    const result = parseFrontmatter(raw);

    expect(result.error).toBeUndefined();
    expect(result.frontmatter).toMatchObject({
      title: "Valid Note",
      tags: ["demo"],
    });
    expect(result.content.trim()).toBe("Body after frontmatter.");
  });

  it("returns an empty object when frontmatter is missing", () => {
    const raw = readFixture("missing.md");
    const result = parseFrontmatter(raw);

    expect(result.frontmatter).toEqual({});
    expect(result.error).toBeUndefined();
    expect(result.content).toBe(raw);
  });

  it("handles malformed frontmatter without throwing", () => {
    const raw = readFixture("malformed.md");
    const result = parseFrontmatter(raw);

    expect(result.frontmatter).toEqual({});
    expect(result.error).toBeDefined();
    expect(result.content.trim()).toBe("Body survives malformed YAML.");
  });
});

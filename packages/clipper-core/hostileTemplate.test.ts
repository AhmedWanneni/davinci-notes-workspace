import { describe, expect, it } from "vitest";
import { renderFrontmatter } from "./frontmatter";
import { createFilterRegistry } from "./filterRegistry";
import { validateClipTemplate } from "./validateClipTemplate";
import { renderClipTemplate } from "./renderClipTemplate";
import {
  renderTemplateString,
  type RenderContext,
} from "./renderTemplateString";
import type { ClipTemplate } from "./ClipTemplate";
import type { VariableValue } from "./VariableValue";

function context(preset: Record<string, VariableValue> = {}): RenderContext {
  return {
    variables: { preset },
    filters: createFilterRegistry(),
    runtime: { now: new Date(2026, 9, 17) },
  };
}

describe("hostile templates", () => {
  it("never resolves prototype members as variables or filters", () => {
    expect(renderTemplateString("{{__proto__}}", context())).toBe("");
    expect(renderTemplateString("{{constructor}}", context())).toBe("");
    expect(renderTemplateString("{{prototype}}", context())).toBe("");
    expect(
      renderTemplateString("{{title|constructor}}", context({ title: "x" })),
    ).toBe("x");
    expect(
      renderTemplateString("{{title|__proto__}}", context({ title: "x" })),
    ).toBe("x");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("treats code-like template text as data, never evaluating it", () => {
    expect(renderTemplateString("{{import('node:fs')}}", context())).toBe("");
    expect(renderTemplateString("${process.env.SECRET}", context())).toBe(
      "${process.env.SECRET}",
    );
    expect(renderTemplateString('{{"1+1"}}', context())).toBe(
      "[unsupported prompt variable]",
    );
  });

  it("drops reserved frontmatter property names in both render and validate", () => {
    const template: ClipTemplate = {
      id: "t",
      name: "T",
      behavior: "create",
      noteNameFormat: "{{title}}",
      folder: "",
      properties: [
        { name: "__proto__", value: "x" },
        { name: "constructor", value: "y" },
        { name: "safe", value: "z" },
      ],
      tags: [],
      body: "",
      triggers: [],
    };
    const rendered = renderClipTemplate(template, context({ title: "N" }));
    expect(Object.keys(rendered.properties)).toEqual(["safe"]);

    const result = validateClipTemplate(template);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      'properties[0].name must not be "__proto__"',
    );
  });

  it("cannot be broken out of the frontmatter block", () => {
    const template: ClipTemplate = {
      id: "t",
      name: "T",
      behavior: "create",
      noteNameFormat: "{{title}}",
      folder: "",
      properties: [{ name: "title", value: "{{title}}" }],
      tags: [],
      body: "{{content}}",
      triggers: [],
    };
    const rendered = renderClipTemplate(
      template,
      context({ title: "evil\n---\ntags: [x]", content: "body\n---\nmore" }),
    );
    const frontmatter = renderFrontmatter(rendered.properties, rendered.tags);
    expect(
      frontmatter.split("\n").filter((line) => line === "---"),
    ).toHaveLength(2);
    expect(frontmatter).toContain("\\n");
  });

  it("renders a large template in bounded time", () => {
    const preset: Record<string, VariableValue> = {
      title: "x",
      url: "https://e.x",
      date: "2026-10-17",
    };
    const lines = Array.from(
      { length: 200 },
      (_, index) => `Line ${index}: {{title|upper}} {{url}} {{date}}`,
    ).join("\n");

    const start = performance.now();
    for (let iteration = 0; iteration < 2000; iteration += 1) {
      renderTemplateString(lines, context(preset));
    }
    const elapsedMs = performance.now() - start;

    // 2,000 variables x 200 template lines. Generous bound: a regression that
    // makes rendering superlinear fails here long before it reaches a user.
    expect(elapsedMs).toBeLessThan(3000);
  });
});

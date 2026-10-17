import { describe, expect, it } from "vitest";
import { parseTemplateExpression, splitTopLevel } from "./TemplateExpression";

describe("splitTopLevel", () => {
  it("ignores separators inside quotes", () => {
    expect(splitTopLevel('a|"b|c"|d', ["|"])).toEqual(["a", '"b|c"', "d"]);
  });

  it("ignores separators inside parentheses/brackets", () => {
    expect(splitTopLevel("f:(1,2)|g", ["|"])).toEqual(["f:(1,2)", "g"]);
    expect(splitTopLevel("a[b|c]", ["|"])).toEqual(["a[b|c]"]);
  });
});

describe("parseTemplateExpression", () => {
  it("parses a preset variable with filtered arguments", () => {
    expect(parseTemplateExpression('date|date:"YYYY-MM-DD"')).toEqual({
      source: 'date|date:"YYYY-MM-DD"',
      reference: { kind: "preset", name: "date" },
      filters: [{ name: "date", args: ["YYYY-MM-DD"] }],
    });
  });

  it("parses meta, selector, selectorHtml, schema, and prompt references", () => {
    expect(parseTemplateExpression("meta:property:og:title").reference).toEqual(
      {
        kind: "meta",
        attribute: "property",
        key: "og:title",
      },
    );
    expect(parseTemplateExpression("meta:name:author").reference).toEqual({
      kind: "meta",
      attribute: "name",
      key: "author",
    });
    expect(parseTemplateExpression("selector:img.hero?src").reference).toEqual({
      kind: "selector",
      selector: "img.hero",
      attribute: "src",
    });
    expect(
      parseTemplateExpression("selectorHtml:body|markdown").reference,
    ).toEqual({
      kind: "selectorHtml",
      selector: "body",
    });
    expect(
      parseTemplateExpression("schema:Recipe:recipeIngredient|list").reference,
    ).toEqual({
      kind: "schema",
      path: "Recipe:recipeIngredient",
    });
    expect(parseTemplateExpression('"summarize the page"').reference).toEqual({
      kind: "prompt",
      prompt: "summarize the page",
    });
  });

  it("keeps a pipe that appears inside a quoted filter argument", () => {
    expect(parseTemplateExpression('title|replace:"|":""').filters).toEqual([
      { name: "replace", args: ["|", ""] },
    ]);
  });

  it("parses parenthesised argument lists", () => {
    expect(
      parseTemplateExpression('rows|table:("Name","Role")').filters,
    ).toEqual([{ name: "table", args: ["Name", "Role"] }]);
  });

  it("parses comma-separated bare numeric arguments", () => {
    expect(parseTemplateExpression("content|slice:0,50").filters).toEqual([
      { name: "slice", args: [0, 50] },
    ]);
  });

  it("treats an unknown name as a preset variable", () => {
    expect(parseTemplateExpression("somethingCustom").reference).toEqual({
      kind: "preset",
      name: "somethingCustom",
    });
  });
});

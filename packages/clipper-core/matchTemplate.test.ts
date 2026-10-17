import { describe, expect, it } from "vitest";
import type { ClipTemplate } from "./ClipTemplate";
import { matchesTrigger, matchTemplate } from "./matchTemplate";
import { ARTICLE_TEMPLATE, RECIPE_TEMPLATE } from "./starterTemplates";
import { MAX_TRIGGER_URL_LENGTH } from "./triggerRule";

function template(overrides: Partial<ClipTemplate>): ClipTemplate {
  return { ...ARTICLE_TEMPLATE, ...overrides };
}

const templates = [RECIPE_TEMPLATE, ARTICLE_TEMPLATE];

describe("matchTemplate", () => {
  it("matches a schema.org type trigger", () => {
    expect(
      matchTemplate(templates, { url: "https://x/y", schemaTypes: ["Recipe"] })
        ?.id,
    ).toBe("recipe");
  });

  it("matches a URL prefix trigger", () => {
    const scoped = template({
      id: "scoped",
      triggers: ["https://blog.example/"],
    });
    expect(
      matchTemplate([scoped], {
        url: "https://blog.example/post",
        schemaTypes: [],
      })?.id,
    ).toBe("scoped");
    expect(
      matchTemplate([scoped], {
        url: "https://other.example/",
        schemaTypes: [],
      }),
    ).toBe(undefined);
  });

  it("matches a /regex/ trigger and ignores an invalid pattern", () => {
    const regexed = template({
      id: "regexed",
      triggers: ["/^https:\\/\\/news\\./"],
    });
    expect(
      matchTemplate([regexed], {
        url: "https://news.example/a",
        schemaTypes: [],
      })?.id,
    ).toBe("regexed");

    const broken = template({ id: "broken", triggers: ["/(/"] });
    expect(() =>
      matchTemplate([broken], { url: "https://x/", schemaTypes: [] }),
    ).not.toThrow();
  });

  it("returns undefined when nothing matches", () => {
    expect(
      matchTemplate(templates, { url: "https://x/y", schemaTypes: ["Thing"] }),
    ).toBe(undefined);
  });

  it("first match wins, so user templates can override starters", () => {
    const override = template({
      id: "override",
      triggers: ["schema:@Recipe"],
    });
    expect(
      matchTemplate([override, RECIPE_TEMPLATE], {
        url: "https://x/y",
        schemaTypes: ["Recipe"],
      })?.id,
    ).toBe("override");
  });
});

describe("bounded rule matching", () => {
  const context = (url: string) => ({ url, schemaTypes: [] });

  it("never tests a rule against more URL than the cap", () => {
    const beyondCap = `https://x/${"a".repeat(MAX_TRIGGER_URL_LENGTH)}needle`;
    expect(matchesTrigger("/needle/", context(beyondCap))).toBe(false);
    expect(matchesTrigger("/needle/", context("https://x/needle"))).toBe(true);
  });

  it("treats a rule that does not parse as no match, never as a throw", () => {
    expect(matchesTrigger("", context("https://x/"))).toBe(false);
    expect(matchesTrigger("/^https://news", context("https://x/"))).toBe(false);
  });

  it("refuses to run a backtracking pattern, however it got here", () => {
    // Storage validates before saving, so this is a second line of defence: a
    // pattern that slipped through must not be executed against a long URL.
    const hostile = `${"a".repeat(5000)}!`;
    expect(matchesTrigger("/^(a+)+$/", context(hostile))).toBe(false);
  });
});

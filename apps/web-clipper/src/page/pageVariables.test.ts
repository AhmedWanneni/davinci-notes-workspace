import { describe, expect, it } from "vitest";
import { ARTICLE_PAGE_HTML, RECIPE_PAGE_HTML } from "../fixtures/pages";
import { buildVariableContext } from "./buildVariableContext";
import { parsePageHtml } from "./parsePageHtml";
import { querySelectorValues } from "./querySelectorValues";
import { readMeta } from "./readMeta";
import { readSchemaOrg, resolveSchemaVariable } from "./readSchemaOrg";
import { schemaTypesOf } from "./schemaTypes";

const NOW = new Date(2026, 9, 17, 9, 5, 7);
const URL = "https://probe.example/a";

function parse(html: string): Document {
  return parsePageHtml(html, URL);
}

describe("readMeta", () => {
  it("reads name and property metadata, and falls back to the other form", () => {
    const doc = parse(ARTICLE_PAGE_HTML);
    expect(readMeta(doc, "property", "og:site_name")).toBe("Probe Site");
    expect(readMeta(doc, "name", "author")).toBe("Ada Lovelace");
    expect(readMeta(doc, "property", "author")).toBe("Ada Lovelace");
    expect(readMeta(doc, "name", "missing")).toBeUndefined();
  });

  it("does not throw on a key that would break the selector", () => {
    const doc = parse(ARTICLE_PAGE_HTML);
    expect(() => readMeta(doc, "name", 'a"] , b')).not.toThrow();
  });
});

describe("querySelectorValues", () => {
  it("returns text, attributes, html, and arrays", () => {
    const doc = parse(ARTICLE_PAGE_HTML);
    expect(querySelectorValues(doc, "h1")).toBe("Probe Article");
    expect(querySelectorValues(doc, "img.hero", "src")).toBe(
      "https://probe.example/images/hero.jpg",
    );
    expect(querySelectorValues(doc, "img.hero", "html")).toContain("<img");
    expect(querySelectorValues(doc, "article p")).toEqual([
      "First paragraph with a bold word.",
      "Second paragraph that mentions another page.",
    ]);
  });

  it("returns undefined for an invalid selector instead of throwing", () => {
    const doc = parse(ARTICLE_PAGE_HTML);
    expect(querySelectorValues(doc, ">>>bad")).toBeUndefined();
    expect(querySelectorValues(doc, "")).toBeUndefined();
    expect(querySelectorValues(doc, "table")).toBeUndefined();
  });
});

describe("readSchemaOrg / resolveSchemaVariable", () => {
  it("indexes JSON-LD by @type and reads dotted property paths", () => {
    const index = readSchemaOrg(parse(RECIPE_PAGE_HTML));
    expect(resolveSchemaVariable(index, "Recipe:recipeCuisine")).toBe(
      "Testish",
    );
    expect(resolveSchemaVariable(index, "Recipe:recipeIngredient")).toEqual([
      "1 cup probes",
      "2 cups water",
    ]);
  });

  it("reads a single node from an @graph and nested objects by name", () => {
    const index = readSchemaOrg(parse(ARTICLE_PAGE_HTML));
    expect(resolveSchemaVariable(index, "Article:headline")).toBe(
      "Probe Article",
    );
    expect(resolveSchemaVariable(index, "Article:author")).toBe("Ada Lovelace");
  });

  it("returns undefined for missing paths and survives malformed JSON-LD", () => {
    const index = readSchemaOrg(parse(ARTICLE_PAGE_HTML));
    expect(
      resolveSchemaVariable(index, "Recipe:recipeCuisine"),
    ).toBeUndefined();
    expect(resolveSchemaVariable(index, "Article:nope")).toBeUndefined();

    const broken = parse(
      `<html><head><script type="application/ld+json">{ not json }</script></head><body></body></html>`,
    );
    expect(() => readSchemaOrg(broken)).not.toThrow();
    expect(readSchemaOrg(broken).nodes).toHaveLength(0);
  });
});

describe("schemaTypesOf", () => {
  it("reports the page's top-level schema types for auto-apply rules", () => {
    expect(schemaTypesOf(parse(ARTICLE_PAGE_HTML))).toEqual(["Article"]);
    expect(schemaTypesOf(parse(RECIPE_PAGE_HTML))).toEqual(["Recipe"]);
    expect(schemaTypesOf(parse("<html><body></body></html>"))).toEqual([]);
  });

  it("does not report nested types, so schema:@Person cannot fire on an article", () => {
    // The article fixture's JSON-LD has `author: { "@type": "Person" }`.
    expect(schemaTypesOf(parse(ARTICLE_PAGE_HTML))).not.toContain("Person");
  });
});

describe("buildVariableContext", () => {
  it("fills the preset variables from metadata and the extractor", () => {
    const doc = parse(ARTICLE_PAGE_HTML);
    const context = buildVariableContext({
      doc,
      snapshot: { url: "https://probe.example/a?x=1", title: "Probe Article" },
      extracted: {
        markdown: "Body text here",
        html: "<p>Body text here</p>",
        wordCount: 3,
      },
      now: NOW,
    });

    expect(context.preset.title).toBe("Probe Article");
    expect(context.preset.url).toBe("https://probe.example/a?x=1");
    expect(context.preset.domain).toBe("probe.example");
    expect(context.preset.site).toBe("Probe Site");
    expect(context.preset.author).toBe("Ada Lovelace");
    expect(context.preset.description).toBe(
      "A short description of the probe article.",
    );
    expect(context.preset.image).toBe("https://probe.example/images/og.png");
    expect(context.preset.favicon).toBe("https://probe.example/favicon.ico");
    expect(context.preset.language).toBe("en");
    expect(context.preset.words).toBe(3);
    expect(context.preset.content).toBe("Body text here");
    expect(context.preset.contentHtml).toBe("<p>Body text here</p>");
    expect(context.preset.fullHtml).toContain("<article>");
    expect(context.preset.selection).toBe("");
    expect(context.preset.highlights).toEqual([]);
    expect(typeof context.preset.date).toBe("string");
    expect(context.preset.time).toBe("09:05");
  });

  it("resolves meta, selector, selectorHtml, and schema variables through the context", () => {
    const doc = parse(RECIPE_PAGE_HTML);
    const schema = readSchemaOrg(doc);
    const context = buildVariableContext({
      doc,
      snapshot: { url: "https://probe.example/recipe", title: "Probe Soup" },
      extracted: { markdown: "", html: "" },
      now: NOW,
      schema,
    });

    expect(context.meta("property", "og:site_name")).toBeUndefined();
    expect(context.selector("h1")).toBe("Probe Soup");
    expect(context.selectorHtml("h1")).toContain("<h1");
    expect(context.schema("Recipe:recipeCuisine")).toBe("Testish");
  });

  it("caps fullHtml so a pathological page cannot exhaust memory", () => {
    const doc = parse(ARTICLE_PAGE_HTML);
    const context = buildVariableContext({
      doc,
      snapshot: { url: "https://probe.example/a", title: "t" },
      extracted: { markdown: "", html: "" },
      now: NOW,
      fullHtmlMaxLength: 10,
    });
    expect(context.preset.fullHtml).toHaveLength(10);
  });
});

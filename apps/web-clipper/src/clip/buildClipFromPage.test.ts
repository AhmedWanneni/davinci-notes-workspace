import {
  ARTICLE_TEMPLATE,
  type ClipTemplate,
  type ClipPayload,
} from "@app/clipper-core";
import { describe, expect, it } from "vitest";
import type { PageCapture } from "../capture/readPage";
import {
  ARTICLE_PAGE_HTML,
  HOSTILE_PAGE_HTML,
  RECIPE_PAGE_HTML,
} from "../fixtures/pages";
import { parsePageHtml } from "../page/parsePageHtml";
import { buildClipFromPage } from "./buildClipFromPage";

const NOW = new Date(2026, 9, 17, 9, 5, 7);

function capture(overrides: Partial<PageCapture> = {}): PageCapture {
  return {
    url: "https://probe.example/a",
    title: "Probe Article",
    html: ARTICLE_PAGE_HTML,
    ...overrides,
  };
}

function build(
  template: ClipTemplate = ARTICLE_TEMPLATE,
  overrides: Partial<PageCapture> = {},
  mode: ClipPayload["mode"] = "full",
) {
  const cap = capture(overrides);
  return buildClipFromPage({
    capture: cap,
    doc: parsePageHtml(cap.html, cap.url),
    template,
    mode,
    now: NOW,
    clipId: "clip-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
  });
}

describe("buildClipFromPage", () => {
  it("renders the article template into a payload", () => {
    const { payload } = build();

    expect(payload.version).toBe(1);
    expect(payload.clipId).toBe("clip-1");
    expect(payload.mode).toBe("full");
    expect(payload.templateId).toBe("article");
    expect(payload.behavior).toBe("create");
    expect(payload.target.noteName).toBe("Probe Article.md");
    expect(payload.target.folder).toBe("Clippings");
    expect(payload.tags).toEqual(["clippings"]);
    expect(payload.properties.author).toBe("Ada Lovelace");
    expect(payload.properties.source).toBe("https://probe.example/a");
    expect(payload.properties.created).toBe("2026-10-17");
    expect(payload.body).toContain("First paragraph");
    expect(payload.contentHash).toHaveLength(16);
  });

  it("resolves schema variables through the template", () => {
    const recipe: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      id: "recipe",
      folder: "Clippings/Recipes",
      properties: [
        { name: "cuisine", value: "{{schema:Recipe:recipeCuisine}}" },
        {
          name: "ingredients",
          value: '{{schema:Recipe:recipeIngredient|join:"; "}}',
        },
      ],
      tags: ["clippings"],
      body: "{{content}}",
      triggers: ["schema:@Recipe"],
    };

    const { payload } = build(recipe, {
      html: RECIPE_PAGE_HTML,
      url: "https://probe.example/r",
    });
    expect(payload.properties.cuisine).toBe("Testish");
    expect(payload.properties.ingredients).toBe("1 cup probes; 2 cups water");
  });

  it("runs the injected markdown filter for selectorHtml variables", () => {
    const template: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      properties: [],
      tags: [],
      body: "{{selectorHtml:article|markdown}}",
      triggers: [],
    };

    const { payload } = build(template);
    expect(payload.body).toContain("**bold**");
    expect(payload.body).not.toContain("<strong>");
  });

  it("uses the selection verbatim in selection mode", () => {
    const template: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      properties: [],
      tags: [],
      body: "{{selection}}",
      triggers: [],
    };
    const { payload, extracted } = build(
      template,
      { selection: "just this bit", selectionHtml: "<p>just this bit</p>" },
      "selection",
    );

    expect(payload.mode).toBe("selection");
    expect(payload.body).toBe("just this bit");
    expect(extracted.markdown).toBe("just this bit");
  });

  it("builds a highlights list in highlights mode", () => {
    const template: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      properties: [],
      tags: [],
      body: "{{highlights|list}}",
      triggers: [],
    };
    const { payload } = buildClipFromPage({
      capture: capture(),
      doc: parsePageHtml(ARTICLE_PAGE_HTML, "https://probe.example/a"),
      template,
      mode: "highlights",
      now: NOW,
      clipId: "clip-h",
      capturedAt: "2026-10-17T09:05:07.000Z",
      highlights: ["first quote", "second quote"],
    });

    expect(payload.body).toBe("- first quote\n- second quote");
    expect(payload.highlights).toEqual([
      { text: "first quote", createdAt: "2026-10-17T09:05:07.000Z" },
      { text: "second quote", createdAt: "2026-10-17T09:05:07.000Z" },
    ]);
  });

  it("cannot be made to write outside the vault by hostile page metadata", () => {
    const template: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      noteNameFormat: "{{title}}",
      folder: "{{title}}",
      properties: [{ name: "title", value: "{{title}}" }],
      tags: [],
      triggers: [],
    };
    const { payload } = build(template, {
      html: HOSTILE_PAGE_HTML,
      title: "../../escape",
    });

    expect(payload.target.noteName).not.toContain("/");
    expect(payload.target.noteName).not.toContain("..");
    expect(payload.target.folder).not.toContain("..");
    expect(payload.target.folder.startsWith("/")).toBe(false);
  });
});

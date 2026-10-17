import {
  ARTICLE_TEMPLATE,
  RECIPE_TEMPLATE,
  type ClipTemplate,
} from "@app/clipper-core";
import { describe, expect, it } from "vitest";
import { matchTemplate } from "./matchTemplate";
import {
  TEMPLATES_KEY,
  defaultTemplates,
  fallbackTemplate,
  loadTemplates,
  saveTemplates,
  templatesFromStorageValue,
  type StorageArea,
} from "./templateStore";

function memoryStorage(initial: Record<string, unknown> = {}): StorageArea & {
  data: Record<string, unknown>;
} {
  const data = { ...initial };
  return {
    data,
    async get(keys) {
      if (keys === null) return { ...data };
      const list = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, unknown> = {};
      for (const key of list) if (key in data) result[key] = data[key];
      return result;
    },
    async set(items) {
      Object.assign(data, items);
    },
  };
}

describe("templateStore", () => {
  it("falls back to the starter templates when storage is empty", async () => {
    const templates = await loadTemplates(memoryStorage());
    expect(templates.map((template) => template.id)).toEqual(
      defaultTemplates().map((template) => template.id),
    );
  });

  it("round-trips saved templates", async () => {
    const storage = memoryStorage();
    await saveTemplates(storage, [ARTICLE_TEMPLATE]);
    const templates = await loadTemplates(storage);
    expect(templates).toHaveLength(1);
    expect(templates[0].id).toBe("article");
    expect(storage.data[TEMPLATES_KEY]).toBeDefined();
  });

  it("drops invalid entries instead of repairing them", () => {
    const templates = templatesFromStorageValue([
      {
        id: "good",
        name: "Good",
        noteNameFormat: "{{title}}",
        behavior: "create",
      },
      { id: "bad" },
      "not a template",
      {
        id: "reserved",
        name: "R",
        noteNameFormat: "{{title}}",
        behavior: "create",
        properties: [{ name: "__proto__", value: "x" }],
      },
    ]);

    expect(templates.map((template) => template.id)).toEqual(["good"]);
  });

  it("falls back to starters when every stored entry is invalid", () => {
    expect(templatesFromStorageValue([{ nope: true }]).length).toBeGreaterThan(
      0,
    );
    expect(templatesFromStorageValue("nonsense")).toHaveLength(
      defaultTemplates().length,
    );
  });

  it("refuses to persist an invalid template", async () => {
    const storage = memoryStorage();
    await saveTemplates(storage, [{ id: "bad" } as unknown as ClipTemplate]);
    expect(storage.data[TEMPLATES_KEY]).toEqual([]);
  });

  it("provides a fallback template that is a copy", () => {
    const first = fallbackTemplate();
    first.id = "mutated";
    expect(fallbackTemplate().id).not.toBe("mutated");
  });
});

describe("matchTemplate", () => {
  const templates = [RECIPE_TEMPLATE, ARTICLE_TEMPLATE];

  it("matches a schema.org type trigger", () => {
    expect(
      matchTemplate(templates, { url: "https://x/y", schemaTypes: ["Recipe"] })
        ?.id,
    ).toBe("recipe");
  });

  it("matches a URL prefix trigger", () => {
    const scoped: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      id: "scoped",
      triggers: ["https://blog.example/"],
    };
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
    const regexed: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      id: "regexed",
      triggers: ["/^https:\\/\\/news\\./"],
    };
    expect(
      matchTemplate([regexed], {
        url: "https://news.example/a",
        schemaTypes: [],
      })?.id,
    ).toBe("regexed");

    const broken: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      id: "broken",
      triggers: ["/(/"],
    };
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
    const override: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      id: "override",
      triggers: ["schema:@Recipe"],
    };
    expect(
      matchTemplate([override, RECIPE_TEMPLATE], {
        url: "https://x/y",
        schemaTypes: ["Recipe"],
      })?.id,
    ).toBe("override");
  });
});

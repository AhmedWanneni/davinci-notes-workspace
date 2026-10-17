import { describe, expect, it } from "vitest";
import { ARTICLE_TEMPLATE, RECIPE_TEMPLATE } from "@app/clipper-core";
import {
  appendTemplate,
  copyTemplate,
  freshTemplate,
  removeTemplate,
  replaceTemplate,
} from "./templateDraft";

describe("template list and draft transforms", () => {
  it("starts a new template in the default folder with the default tag", () => {
    const created = freshTemplate("new-id");
    expect(created).toMatchObject({
      id: "new-id",
      folder: "Clippings",
      tags: ["clippings"],
      behavior: "create",
      properties: [],
    });
  });

  it("copies a draft without sharing its lists", () => {
    const source = { ...ARTICLE_TEMPLATE };
    const copy = copyTemplate(source);

    copy.tags.push("inbox");
    copy.properties[0]!.value = "changed";
    copy.triggers.length = 0;

    expect(source.tags).toEqual(["clippings"]);
    expect(source.properties[0]?.value).toBe("{{author}}");
    expect(source.triggers).toHaveLength(3);
  });

  it("appends, replaces by id, and removes by id", () => {
    const list = [ARTICLE_TEMPLATE];
    const withRecipe = appendTemplate(list, RECIPE_TEMPLATE);
    expect(withRecipe.map((template) => template.id)).toEqual([
      "article",
      "recipe",
    ]);

    const renamed = { ...ARTICLE_TEMPLATE, name: "Articles" };
    expect(replaceTemplate(withRecipe, renamed)[0]?.name).toBe("Articles");
    expect(replaceTemplate(withRecipe, renamed)).toHaveLength(2);

    expect(removeTemplate(withRecipe, "article").map((t) => t.id)).toEqual([
      "recipe",
    ]);
    expect(removeTemplate(list, "missing").map((t) => t.id)).toEqual([
      "article",
    ]);
  });

  it("does not mutate the list it was given", () => {
    const list = [ARTICLE_TEMPLATE];
    appendTemplate(list, RECIPE_TEMPLATE);
    removeTemplate(list, "article");
    expect(list).toHaveLength(1);
  });
});

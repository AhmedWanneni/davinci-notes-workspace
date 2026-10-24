import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PropertiesBlock } from "./PropertiesBlock";

describe("PropertiesBlock", () => {
  it("renders frontmatter keys, tags, and string values correctly", () => {
    const frontmatter = {
      tags: ["recipe", "dessert"],
      created: "2026-08-14",
      author: "Leonardo",
    };

    const html = renderToString(<PropertiesBlock frontmatter={frontmatter} />);

    expect(html).toContain("Properties");
    expect(html).toContain("3");
    expect(html).toContain("tags");
    expect(html).toContain("recipe");
    expect(html).toContain("dessert");
    expect(html).toContain("created");
    expect(html).toContain("2026-08-14");
    expect(html).toContain("author");
    expect(html).toContain("Leonardo");
  });

  it("handles wikilinks in property values", () => {
    const frontmatter = {
      author: "[[Leonardo da Vinci]]",
    };

    const html = renderToString(<PropertiesBlock frontmatter={frontmatter} />);
    expect(html).toContain("Leonardo da Vinci");
    expect(html).toContain("properties-block__link");
  });

  it("returns empty when frontmatter is empty", () => {
    const html = renderToString(<PropertiesBlock frontmatter={{}} />);
    expect(html).toBe("");
  });

  it("filters out cover, banner, icon, and kanban-plugin properties", () => {
    const frontmatter = {
      cover: "https://example.com/cover.jpg",
      cover_y: 50,
      banner: "https://example.com/banner.jpg",
      icon: "📚",
      "kanban-plugin": "board",
    };
    const html = renderToString(<PropertiesBlock frontmatter={frontmatter} />);
    expect(html).toBe("");
  });
});

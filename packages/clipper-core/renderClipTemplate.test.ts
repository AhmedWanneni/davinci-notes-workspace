import { describe, expect, it } from "vitest";
import type { ClipTemplate } from "./ClipTemplate";
import { createFilterRegistry } from "./filterRegistry";
import { normalizeFolder, renderClipTemplate } from "./renderClipTemplate";
import type { RenderContext } from "./renderTemplateString";
import type { VariableValue } from "./VariableValue";

function context(preset: Record<string, VariableValue> = {}): RenderContext {
  return {
    variables: { preset },
    filters: createFilterRegistry(),
    runtime: { now: new Date(2026, 9, 17, 9, 5, 7) },
  };
}

const template: ClipTemplate = {
  id: "test",
  name: "Test",
  behavior: "create",
  noteNameFormat: "{{title}}",
  folder: "Clippings/{{site}}",
  properties: [
    { name: "source", value: "{{url}}" },
    { name: "created", value: '{{date|date:"YYYY-MM-DD"}}' },
  ],
  tags: ["clippings", "{{site}}"],
  body: "# {{title}}\n\n{{content}}",
  triggers: [],
};

describe("renderClipTemplate", () => {
  it("renders every field of the clip", () => {
    const rendered = renderClipTemplate(
      template,
      context({
        title: "Hello",
        site: "Example",
        url: "https://e.x/p",
        content: "Body",
      }),
    );
    expect(rendered).toEqual({
      noteName: "Hello.md",
      folder: "Clippings/Example",
      properties: { source: "https://e.x/p", created: "2026-10-17" },
      tags: ["clippings", "Example"],
      body: "# Hello\n\nBody",
    });
  });

  it("neutralises traversal coming from page data", () => {
    const rendered = renderClipTemplate(
      { ...template, folder: "{{site}}" },
      context({ title: "../../evil", site: "../../etc", url: "", content: "" }),
    );
    expect(rendered.noteName).toBe("evil.md");
    expect(rendered.folder).toBe("etc");
  });
});

describe("normalizeFolder", () => {
  it("drops empty, dot, and traversal segments", () => {
    expect(normalizeFolder("a//b/./../c")).toBe("a/b/c");
    expect(normalizeFolder("../..")).toBe("");
    expect(normalizeFolder("a\\b")).toBe("a/b");
  });

  it("caps depth", () => {
    expect(normalizeFolder("1/2/3/4/5/6/7/8/9/10")).toBe("1/2/3/4/5/6/7/8");
  });
});

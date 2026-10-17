import { describe, expect, it } from "vitest";
import { STARTER_TEMPLATES } from "./starterTemplates";
import { validateClipTemplate } from "./validateClipTemplate";

describe("starter templates", () => {
  it("are the four documented categories and all validate", () => {
    expect(STARTER_TEMPLATES.map((template) => template.id)).toEqual([
      "article",
      "recipe",
      "movie",
      "paper",
    ]);
    for (const template of STARTER_TEMPLATES) {
      const result = validateClipTemplate(template);
      expect(result.errors).toEqual([]);
      expect(result.ok).toBe(true);
    }
  });
});

describe("validateClipTemplate", () => {
  it("rejects non-objects", () => {
    expect(validateClipTemplate(null).ok).toBe(false);
    expect(validateClipTemplate([]).ok).toBe(false);
    expect(validateClipTemplate("nope").ok).toBe(false);
  });

  it("reports every missing required field", () => {
    const result = validateClipTemplate({ name: "X" });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("id is required");
    expect(result.errors).toContain("behavior is required");
    expect(result.errors).toContain("noteNameFormat is required");
  });

  it("rejects an unknown behavior", () => {
    const result = validateClipTemplate({
      id: "x",
      name: "X",
      noteNameFormat: "{{title}}",
      behavior: "explode",
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("behavior must be one of");
  });

  it("rejects malformed properties and tags", () => {
    const result = validateClipTemplate({
      id: "x",
      name: "X",
      noteNameFormat: "{{title}}",
      behavior: "create",
      properties: [{ value: "no name" }],
      tags: [1],
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("properties[0].name is required");
    expect(result.errors).toContain("tags must be an array of strings");
  });

  it("accepts a minimal template and defaults optional fields", () => {
    const result = validateClipTemplate({
      id: "x",
      name: "X",
      noteNameFormat: "{{title}}",
      behavior: "create",
    });
    expect(result.ok).toBe(true);
    expect(result.template).toMatchObject({
      folder: "",
      tags: [],
      body: "",
      triggers: [],
    });
  });
});

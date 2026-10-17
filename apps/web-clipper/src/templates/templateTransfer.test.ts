import { ARTICLE_TEMPLATE, RECIPE_TEMPLATE } from "@app/clipper-core";
import { describe, expect, it } from "vitest";
import {
  MAX_TEMPLATE_IMPORT_BYTES,
  parseTemplateImport,
  serializeTemplateExport,
} from "./templateTransfer";

describe("template transfer", () => {
  it("round-trips the validated templates without changing their semantics", () => {
    const exported = serializeTemplateExport([
      ARTICLE_TEMPLATE,
      RECIPE_TEMPLATE,
    ]);
    expect(parseTemplateImport(exported)).toEqual({
      ok: true,
      templates: [ARTICLE_TEMPLATE, RECIPE_TEMPLATE],
    });
  });

  it("refuses malformed, empty, and unsafe imports atomically", () => {
    expect(parseTemplateImport("{")).toEqual({
      ok: false,
      error: "The import is not valid JSON.",
    });
    expect(parseTemplateImport("[]")).toEqual({
      ok: false,
      error: "The import must be a non-empty template array.",
    });
    expect(
      parseTemplateImport(
        JSON.stringify([{ ...ARTICLE_TEMPLATE, folder: "../../.." }]),
      ),
    ).toMatchObject({ ok: false, error: expect.stringContaining("folder") });
  });

  it("bounds the input before JSON parsing", () => {
    expect(
      parseTemplateImport("x".repeat(MAX_TEMPLATE_IMPORT_BYTES + 1)),
    ).toEqual({
      ok: false,
      error: "The import is larger than 1 MiB.",
    });
  });

  it("rejects duplicate ids so selection and order stay unambiguous", () => {
    expect(
      parseTemplateImport(
        JSON.stringify([
          ARTICLE_TEMPLATE,
          { ...RECIPE_TEMPLATE, id: "article" },
        ]),
      ),
    ).toEqual({ ok: false, error: "Template 2 repeats an existing id." });
  });
});

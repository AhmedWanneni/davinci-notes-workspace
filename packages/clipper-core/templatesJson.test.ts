import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STARTER_TEMPLATES } from "./starterTemplates";
import { validateClipTemplate } from "./validateClipTemplate";

/**
 * The shipped `.json` templates are what Phase 4 imports and exports, so they are
 * the real contract. This test keeps them from drifting from the typed starters
 * the engine is developed against.
 */
const templatesDir = join(dirname(fileURLToPath(import.meta.url)), "templates");

function readTemplate(id: string): unknown {
  return JSON.parse(readFileSync(join(templatesDir, `${id}.json`), "utf8"));
}

describe("shipped template JSON fixtures", () => {
  it("match the typed starter templates exactly", () => {
    for (const template of STARTER_TEMPLATES) {
      expect(readTemplate(template.id)).toEqual(template);
    }
  });

  it("all validate as templates", () => {
    for (const template of STARTER_TEMPLATES) {
      const result = validateClipTemplate(readTemplate(template.id));
      expect(result.errors).toEqual([]);
      expect(result.ok).toBe(true);
    }
  });
});

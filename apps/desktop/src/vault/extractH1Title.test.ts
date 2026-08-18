import { describe, expect, it } from "vitest";
import { extractH1Title } from "./extractH1Title";

describe("extractH1Title", () => {
  it("reads the first H1 after frontmatter", () => {
    expect(
      extractH1Title("---\ntitle: ignored\n---\n\n# Meeting Notes\n\nBody"),
    ).toBe("Meeting Notes");
  });

  it("returns null when the H1 is missing or empty", () => {
    expect(extractH1Title("# \n\nBody")).toBeNull();
    expect(extractH1Title("No heading\n\nBody")).toBeNull();
    expect(extractH1Title("")).toBeNull();
  });
});

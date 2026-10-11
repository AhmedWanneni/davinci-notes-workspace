import { describe, expect, it } from "vitest";
import { getEditorFont, loadEditorFont } from "./editorFontRegistry";

describe("editor font registry", () => {
  it("falls back to the system font for an unknown persisted id", () => {
    expect(getEditorFont("removed-font").id).toBe("system");
    expect(getEditorFont("removed-font").cssFamily).toBe("var(--font-ui)");
  });

  it("exposes only allowlisted font family values for curated options", () => {
    expect(getEditorFont("system").cssFamily).toBe("var(--font-ui)");
    expect(getEditorFont("serif").cssFamily).toContain("Georgia");
    expect(getEditorFont("monospace").cssFamily).toContain("JetBrains Mono");
    expect(getEditorFont("montserrat").cssFamily).toContain(
      "Montserrat Variable",
    );
    expect(getEditorFont("raleway").cssFamily).toContain("Raleway Variable");
    expect(getEditorFont("roboto").cssFamily).toContain("Roboto Variable");
  });

  it("resolves sanitized custom font family when custom is selected", () => {
    const valid = getEditorFont("custom", "Consolas");
    expect(valid.id).toBe("custom");
    expect(valid.cssFamily).toBe('"Consolas", var(--font-ui)');

    const injection = getEditorFont("custom", "x; } body { display:none");
    expect(injection.id).toBe("custom");
    expect(injection.cssFamily).toBe("var(--font-ui)");

    const empty = getEditorFont("custom", "");
    expect(empty.id).toBe("custom");
    expect(empty.cssFamily).toBe("var(--font-ui)");
  });

  it("loads editor font definitions safely without throwing", async () => {
    const system = await loadEditorFont("system");
    expect(system.id).toBe("system");

    const serif = await loadEditorFont("serif");
    expect(serif.id).toBe("serif");

    const custom = await loadEditorFont("custom", "Menlo");
    expect(custom.id).toBe("custom");
    expect(custom.cssFamily).toBe('"Menlo", var(--font-ui)');
  });
});

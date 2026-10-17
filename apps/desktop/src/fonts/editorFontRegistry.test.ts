import { describe, expect, it } from "vitest";
import { getEditorFont, loadEditorFont } from "./editorFontRegistry";

describe("editor font registry", () => {
  it("falls back to the system font for an unknown persisted id", () => {
    expect(getEditorFont("removed-font").id).toBe("system");
    expect(getEditorFont("removed-font").cssFamily).toBe("var(--font-ui)");
  });

  it("exposes only allowlisted font family values for curated options", () => {
    expect(getEditorFont("system").cssFamily).toBe("var(--font-ui)");
    expect(getEditorFont("inter").cssFamily).toContain("Inter Variable");
    expect(getEditorFont("ibm-plex-sans").cssFamily).toContain("IBM Plex Sans");
    expect(getEditorFont("literata").cssFamily).toContain("Literata Variable");
    expect(getEditorFont("source-serif-4").cssFamily).toContain(
      "Source Serif 4 Variable",
    );
    expect(getEditorFont("jetbrains-mono").cssFamily).toContain(
      "JetBrains Mono Variable",
    );
    expect(getEditorFont("montserrat").cssFamily).toContain(
      "Montserrat Variable",
    );
    expect(getEditorFont("raleway").cssFamily).toContain("Raleway Variable");
    expect(getEditorFont("roboto").cssFamily).toContain("Roboto Variable");
    expect(getEditorFont("serif").cssFamily).toContain("Georgia");
    expect(getEditorFont("monospace").cssFamily).toContain("monospace");
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

    const inter = await loadEditorFont("inter");
    expect(inter.id).toBe("inter");

    const jetbrainsMono = await loadEditorFont("jetbrains-mono");
    expect(jetbrainsMono.id).toBe("jetbrains-mono");

    const custom = await loadEditorFont("custom", "Menlo");
    expect(custom.id).toBe("custom");
    expect(custom.cssFamily).toBe('"Menlo", var(--font-ui)');
  });
});

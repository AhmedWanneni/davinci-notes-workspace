import { RECIPE_TEMPLATE, STARTER_TEMPLATES } from "@app/clipper-core";
import { describe, expect, it } from "vitest";
import type { PageCapture } from "../capture/readPage";
import { ARTICLE_PAGE_HTML, RECIPE_PAGE_HTML } from "../fixtures/pages";
import { defaultClipMode, runClipSession } from "./runClipSession";

const NOW = new Date(2026, 9, 17, 9, 5, 7);

function capture(overrides: Partial<PageCapture> = {}): PageCapture {
  return {
    url: "https://probe.example/a",
    title: "Probe Article",
    html: ARTICLE_PAGE_HTML,
    ...overrides,
  };
}

function session(
  overrides: Partial<Parameters<typeof runClipSession>[0]> = {},
) {
  return runClipSession({
    capture: capture(),
    templates: STARTER_TEMPLATES,
    now: NOW,
    clipId: "clip-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
    ...overrides,
  });
}

describe("defaultClipMode", () => {
  it("uses selection when text is selected, otherwise the full page", () => {
    expect(defaultClipMode(capture())).toBe("full");
    expect(defaultClipMode(capture({ selection: "picked" }))).toBe("selection");
    expect(defaultClipMode(capture({ selection: "   " }))).toBe("full");
  });
});

describe("runClipSession", () => {
  it("auto-applies the template matching the page", () => {
    const result = session({
      capture: capture({
        html: RECIPE_PAGE_HTML,
        url: "https://probe.example/r",
        title: "Probe Soup",
      }),
    });

    expect(result.template.id).toBe(RECIPE_TEMPLATE.id);
    expect(result.payload.target.folder).toBe("Clippings/Recipes");
    expect(result.payload.properties.cuisine).toBe("Testish");
  });

  it("falls back to the article template when nothing matches", () => {
    expect(session().template.id).toBe("article");
  });

  it("produces the note file and the suggested download path", () => {
    const result = session();

    expect(result.mode).toBe("full");
    expect(result.noteFile.startsWith("---\n")).toBe(true);
    expect(result.noteFile).toContain("First paragraph");
    expect(result.noteFile).toContain(
      "Source: [Probe Article](https://probe.example/a)",
    );
    expect(result.suggestedPath).toBe("Clippings/Probe Article.md");
  });

  it("honours an explicit mode override", () => {
    const result = session({
      capture: capture({ selection: "picked text" }),
      mode: "full",
    });
    expect(result.mode).toBe("full");
  });

  it("uses the fallback template when the caller has no templates", () => {
    expect(session({ templates: [] }).template.id).toBe("article");
  });
});

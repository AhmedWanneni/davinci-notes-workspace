import { STARTER_TEMPLATES } from "@app/clipper-core";
import { describe, expect, it } from "vitest";
import { runClipSession } from "./runClipSession";

/**
 * Plan Phase 2 adversarial check 4: a large page must clip without hanging the
 * popup. The expensive work — page DOM parse, extraction, Markdown conversion —
 * must happen exactly once per clip.
 *
 * Bounds are deliberately loose. These run in jsdom, which is several times
 * slower than a browser DOM, so the numbers here are upper bounds, not the
 * user-visible cost. Recorded medians of three runs on the development machine:
 * 7.6 KB page 24.9 ms, 18.6 KB 30.4 ms, 37 KB 44.8 ms, 1.48 MB 2,781.8 ms.
 */
const PARAGRAPH =
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam. ".repeat(
    3,
  );

function page(paragraphs: number, links = 20): string {
  const body = Array.from(
    { length: paragraphs },
    (_, index) => `<p>Paragraph ${index}. ${PARAGRAPH}</p>`,
  ).join("");
  const anchors = Array.from(
    { length: links },
    (_, index) => `<a href="/x/${index}">link ${index}</a>`,
  ).join("");
  return (
    `<!doctype html><html><head><title>Large</title>` +
    `<meta property="og:site_name" content="Large Site"></head><body>` +
    `<nav>${anchors}</nav><article><h1>Large</h1>${body}</article>` +
    `<footer>${anchors}</footer></body></html>`
  );
}

function clip(html: string) {
  const started = performance.now();
  const result = runClipSession({
    capture: { url: "https://probe.example/big", title: "Large", html },
    templates: STARTER_TEMPLATES,
    now: new Date(2026, 9, 17, 9, 5, 7),
    clipId: "clip-big",
    capturedAt: "2026-10-17T09:05:07.000Z",
  });
  return { result, elapsed: performance.now() - started };
}

describe("clip pipeline cost", () => {
  it("clips a typical article-sized page quickly", () => {
    const html = page(50);

    const { result, elapsed } = clip(html);

    expect(html.length).toBeGreaterThan(15_000);
    expect(result.payload.body).toContain("Paragraph 49.");
    expect(elapsed).toBeLessThan(1000);
  });

  it("clips a ~1.5 MB page with ~4k paragraphs without a stack or format failure", () => {
    const html = page(4000, 200);

    const { result, elapsed } = clip(html);

    expect(html.length).toBeGreaterThan(1_400_000);
    expect(result.payload.target.noteName).toBe("Large.md");
    expect(result.payload.body).toContain("Paragraph 3999.");
    expect(result.payload.contentHash).toHaveLength(16);
    expect(elapsed).toBeLessThan(8000);
  }, 60_000);
});

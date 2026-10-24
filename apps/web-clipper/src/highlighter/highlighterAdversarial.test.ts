import { describe, expect, it } from "vitest";
import {
  ARTICLE_TEMPLATE,
  createFilterRegistry,
  renderClipTemplate,
  type ClipTemplate,
  type RenderContext,
} from "@app/clipper-core";
import { prepareClipContext } from "../clip/prepareClipContext";
import { parsePageHtml } from "../page/parsePageHtml";
import {
  MAX_HIGHLIGHTS,
  MAX_HIGHLIGHTS_PER_URL,
  type HighlightRecord,
} from "./HighlightRecord";
import { boundedHighlights } from "./highlightStore";
import { restoreHighlights } from "./pageHighlights";

describe("Phase 5: Highlighter Adversarial Verification", () => {
  it("check 1: restores highlights across 5,000 nodes and adds no cost on zero highlights", () => {
    const doc = document.implementation.createHTMLDocument("Large Page");
    const container = doc.createElement("div");
    for (let index = 0; index < 5000; index += 1) {
      const p = doc.createElement("p");
      p.textContent = `Paragraph ${index} contains searchable snippet ${index % 50}.`;
      container.appendChild(p);
    }
    doc.body.appendChild(container);

    // Assert zero cost on 0 highlights
    const startZero = performance.now();
    const restoredZero = restoreHighlights(doc, []);
    const durationZero = performance.now() - startZero;
    expect(restoredZero).toBe(0);
    expect(durationZero).toBeLessThan(10);

    // 200 stored highlights
    const records: HighlightRecord[] = Array.from(
      { length: 200 },
      (_, index) => ({
        id: `hl-${index}`,
        url: "https://example.test/large",
        text: `snippet ${index % 50}`,
        occurrence: Math.floor(index / 50),
        createdAt: new Date().toISOString(),
      }),
    );

    const start = performance.now();
    const restored = restoreHighlights(doc, records);
    const duration = performance.now() - start;

    expect(restored).toBeGreaterThan(0);
    // Performance assertion: 200 highlights on 5,000 nodes completes promptly
    expect(duration).toBeLessThan(1500);
  });

  it("check 2: skips an anchor gracefully if text was deleted or DOM changed", () => {
    const doc = document.implementation.createHTMLDocument("Changed Page");
    doc.body.innerHTML = "<p>Completely different article text.</p>";

    const missingRecord: HighlightRecord = {
      id: "hl-missing",
      url: "https://example.test/",
      text: "Text that no longer exists anywhere on this page",
      occurrence: 0,
      createdAt: new Date().toISOString(),
    };

    expect(() => restoreHighlights(doc, [missingRecord])).not.toThrow();
    expect(restoreHighlights(doc, [missingRecord])).toBe(0);
  });

  it("check 3: clipping with mode highlights safely escapes ==, ]], |, and newlines", () => {
    const hostileQuote =
      "Unsafe == highlight ]] wikilink | column\nSecond line text";

    const doc = parsePageHtml(
      `<article><p>${hostileQuote}</p></article>`,
      "https://example.test/article",
    );

    const context = prepareClipContext({
      capture: {
        url: "https://example.test/article",
        title: "Adversarial Article",
        html: doc.documentElement.outerHTML,
      },
      doc,
      mode: "highlights",
      now: new Date("2026-10-17T12:00:00Z"),
      highlights: [hostileQuote],
    });

    const templateWithFilters: ClipTemplate = {
      ...ARTICLE_TEMPLATE,
      body: [
        "Raw content:",
        "{{content}}",
        "",
        "Highlighted:",
        "{{highlights|highlight}}",
        "",
        "Wikilink:",
        "{{highlights|wikilink}}",
        "",
        "Table cell:",
        '{{highlights|table:("Quote")}}',
      ].join("\n"),
    };

    const renderContext: RenderContext = {
      variables: context.variables,
      filters: createFilterRegistry(),
      runtime: { now: context.now },
    };

    const rendered = renderClipTemplate(templateWithFilters, renderContext, {});

    // Highlight syntax must escape == and handle newlines without unclosed tags
    expect(rendered.body).toContain(
      "==Unsafe \\=\\= highlight ]] wikilink | column==",
    );
    expect(rendered.body).toContain("==Second line text==");

    // Wikilink must not contain raw ]] in the target
    expect(rendered.body).not.toContain("[[Unsafe == highlight ]] wikilink");
    expect(rendered.body).toContain(
      "[[Unsafe == highlight  wikilink | column Second line text]]",
    );

    // Table cell must escape | to \| and newlines to spaces
    expect(rendered.body).toContain(
      "| Unsafe == highlight ]] wikilink \\| column Second line text |",
    );
  });

  it("check 4: enforces MAX_HIGHLIGHTS and MAX_HIGHLIGHTS_PER_URL with oldest-first eviction", () => {
    expect(MAX_HIGHLIGHTS).toBe(2000);
    expect(MAX_HIGHLIGHTS_PER_URL).toBe(200);

    // 250 highlights on single URL -> capped at 200
    const urlRecords = Array.from({ length: 250 }, (_, index) => ({
      id: `url-hl-${index}`,
      url: "https://example.test/single",
      text: `Quote ${index}`,
      occurrence: 0,
      createdAt: `2026-01-01T00:${String(index).padStart(4, "0")}Z`,
    }));
    const boundedSingle = boundedHighlights(urlRecords);
    expect(boundedSingle).toHaveLength(200);
    // Oldest (index 0..49) evicted, newest retained
    expect(boundedSingle[0]?.id).toBe("url-hl-50");
    expect(boundedSingle[199]?.id).toBe("url-hl-249");

    // 2,500 highlights across 25 URLs (100 each) -> capped at 2,000 total
    const multiUrlRecords: HighlightRecord[] = [];
    for (let u = 0; u < 25; u += 1) {
      for (let i = 0; i < 100; i += 1) {
        multiUrlRecords.push({
          id: `multi-${u}-${i}`,
          url: `https://example.test/page-${u}`,
          text: `Text ${u}-${i}`,
          occurrence: 0,
          createdAt: new Date(
            1700000000000 + (u * 100 + i) * 1000,
          ).toISOString(),
        });
      }
    }
    const boundedTotal = boundedHighlights(multiUrlRecords);
    expect(boundedTotal).toHaveLength(2000);
    // 500 oldest evicted
    expect(boundedTotal[0]?.id).toBe("multi-5-0");
  });
});

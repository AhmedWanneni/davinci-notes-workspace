import { describe, it, expect } from "vitest";
import { buildWidgetHtml, extractThemeTokens } from "./widgetHtmlBuilder";

describe("widgetHtmlBuilder", () => {
  it("extracts design token variables for theme parity", () => {
    const tokens = extractThemeTokens();
    expect(tokens["--color-bg-primary"]).toBeDefined();
    expect(tokens["--color-text-normal"]).toBeDefined();
    expect(tokens["--color-border-subtle"]).toBeDefined();
  });

  it("injects strict Content-Security-Policy restricting network and parent access", () => {
    const html = buildWidgetHtml("<h1>Test Widget</h1>", "w-123");
    expect(html).toContain('http-equiv="Content-Security-Policy"');
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain("script-src 'unsafe-inline'");
    expect(html).toContain("style-src 'unsafe-inline'");
  });

  it("injects auto-resize postMessage script with widgetId", () => {
    const html = buildWidgetHtml("<div>Interactive Counter</div>", "w-456");
    expect(html).toContain('"w-456"');
    expect(html).toContain("davinci:widget-resize");
    expect(html).toContain("ResizeObserver");
  });

  it("handles snippet source by wrapping in HTML5 structure", () => {
    const snippet =
      "<canvas id='cv'></canvas><script>console.log('hi');</script>";
    const html = buildWidgetHtml(snippet, "w-snippet");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<canvas id='cv'></canvas>");
    expect(html).toContain("<script>console.log('hi');</script>");
  });

  it("handles full HTML source without duplicate html/head tags", () => {
    const fullSource = `<!DOCTYPE html><html><head><title>Custom</title></head><body><div>Ready</div></body></html>`;
    const html = buildWidgetHtml(fullSource, "w-full");
    expect(html).toContain("<title>Custom</title>");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("davinci:widget-resize");
  });
});

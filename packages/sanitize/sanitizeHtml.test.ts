import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeHtml } from "./sanitizeHtml";
import { applyIframePolicy, DEFAULT_SANDBOX, validateIframeSrc, YOUTUBE_SANDBOX } from "./iframePolicy";

const dom = new JSDOM("");
vi.stubGlobal("window", dom.window);

afterEach(() => dom.window.document.body.replaceChildren());

describe("sanitizeHtml", () => {
  it("preserves every allowlisted tag and supported class/style", () => {
    const output = sanitizeHtml(
      '<u>u</u><s>s</s><span class="accent" style="color: red; font-weight: bold">span</span><div>div</div><table><tr><td>cell</td></tr></table><!-- note -->',
    );
    expect(output).toContain("<u>u</u>");
    expect(output).toContain("<s>s</s>");
    expect(output).toContain('class="accent"');
    expect(output).toContain("color: red");
    expect(output).toContain("<table>");
    expect(output).toContain("<td>cell</td>");
    expect(output).toContain("<!-- note -->");
  });

  it("neutralizes the source-document script example", () => {
    const output = sanitizeHtml("<script>alert('xss')</script><p>safe</p>");
    expect(output).not.toContain("script");
    expect(output).not.toContain("alert('xss')");
    expect(output).toContain("safe");
  });

  it("strips scripts, styles, iframes, handlers, and unsafe URLs", () => {
    const output = sanitizeHtml(
      '<style>body{display:none}</style><iframe src="http://localhost:3000"></iframe><img onerror="alert(1)" src="javascript:alert(1)"><a href="data:text/html,x">x</a><div onclick="alert(1)">safe</div>',
    );
    expect(output).not.toMatch(/style|iframe|onerror|onclick|javascript:|data:/i);
    expect(output).toContain("Embed blocked");
    expect(output).toContain("safe");
  });

  it("removes unsafe CSS while preserving the approved declarations", () => {
    const output = sanitizeHtml(
      '<span style="color: #fff; background-color: rgb(1, 2, 3); text-align: center; width: 100px; background: url(javascript:evil)">x</span>',
    );
    expect(output).toContain("color: #fff");
    expect(output).toContain("background-color: rgb(1, 2, 3)");
    expect(output).toContain("text-align: center");
    expect(output).not.toContain("width");
    expect(output).not.toContain("javascript");
  });

  it("handles malformed and encoded payloads without allowing markup escape", () => {
    const output = sanitizeHtml('<div><span title="&lt;script&gt;">broken<span style="color: expression(alert(1)">text');
    expect(output).not.toMatch(/expression|title=/i);
    expect(output).toContain("text");
  });

  it("applies fixed policy values and preserves a compliant iframe", () => {
    const output = sanitizeHtml('<iframe src="https://www.youtube.com/embed/abc" sandbox="allow-same-origin" allow="camera; autoplay" referrerpolicy="unsafe-url"></iframe>');
    expect(output).toContain('src="https://www.youtube.com/embed/abc"');
    expect(output).toContain(`sandbox="${YOUTUBE_SANDBOX}"`);
    expect(output).toContain("autoplay 'src'; fullscreen 'src'; encrypted-media 'src'; picture-in-picture 'src'");
    expect(output).toContain('referrerpolicy="no-referrer"');
    expect(output).not.toContain("camera");
  });

  it("uses the strict default sandbox for arbitrary hosts", () => {
    const output = sanitizeHtml('<iframe src="https://example.com/embed"></iframe>');
    expect(output).toContain(`sandbox="${DEFAULT_SANDBOX}"`);
    expect(output).not.toContain("allow-same-origin");
  });

  it("contains only valid sandbox tokens", () => {
    const valid = new Set([
      "allow-downloads", "allow-forms", "allow-modals", "allow-orientation-lock",
      "allow-pointer-lock", "allow-popups", "allow-popups-to-escape-sandbox",
      "allow-presentation", "allow-same-origin", "allow-scripts", "allow-storage-access-by-user-activation",
      "allow-top-navigation", "allow-top-navigation-by-user-activation", "allow-top-navigation-to-custom-protocols",
    ]);
    for (const policy of [DEFAULT_SANDBOX, YOUTUBE_SANDBOX]) {
      expect(policy.split(" ").every((token) => valid.has(token))).toBe(true);
    }
  });

  it.each(["http://localhost:3000", "http://127.0.0.1:8080", "file:///tmp/a", "tauri://localhost"]) (
    "blocks unsafe iframe source %s",
    (src) => {
      expect(validateIframeSrc(src)).toBeNull();
      expect(applyIframePolicy(`<iframe src="${src}"></iframe>`).html).toContain("Embed blocked");
    },
  );
});

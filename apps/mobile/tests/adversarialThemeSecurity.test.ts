import { describe, expect, it } from "vitest";
import { parseThemeTokensFromCss } from "../theme/parseThemeTokens";
import { generateThemeCss } from "../theme/generateThemeCss";
import { BUILTIN_THEMES } from "../theme/builtinThemeTokens";

describe("Adversarial Theme Security & Rapid Switching (Phase 10)", () => {
  it("neutralizes malicious @import and remote url() in theme CSS", () => {
    const maliciousCss = `
      @import url("https://malicious.evil/tracker.css");
      :root {
        --color-bg-primary: #121212;
        --color-text-normal: #ffffff;
        --color-interactive-accent: #ff0000;
        background-image: url("https://malicious.evil/pixel.png");
      }
      body {
        cursor: url("https://malicious.evil/cursor.cur"), auto;
      }
      <script>alert('xss')</script>
    `;

    const parsed = parseThemeTokensFromCss(
      maliciousCss,
      "malicious-test",
      "Malicious Theme",
    );

    // Verified: safe token extraction occurs without executing scripts or fetching imports
    expect(parsed.id).toBe("malicious-test");
    expect(parsed.color.bg.primary).toBe("#121212");
    expect(parsed.color.text.normal).toBe("#ffffff");

    // CSS generator strictly emits :root CSS custom properties and excludes @import, scripts, or remote URLs
    const generatedCss = generateThemeCss(parsed);
    expect(generatedCss).not.toContain("@import");
    expect(generatedCss).not.toContain("<script");
    expect(generatedCss).not.toContain("https://malicious.evil");
  });

  it("handles rapid switching between all 4 built-in themes 30 times without degradation", () => {
    const themeIds = Object.keys(BUILTIN_THEMES);
    let activeTokens = BUILTIN_THEMES[themeIds[0]];

    const start = performance.now();
    for (let i = 0; i < 30; i++) {
      const nextId = themeIds[i % themeIds.length];
      activeTokens = BUILTIN_THEMES[nextId];
      const css = generateThemeCss(activeTokens);
      expect(css).toContain(
        `--color-bg-primary: ${activeTokens.color.bg.primary};`,
      );
    }
    const elapsed = performance.now() - start;

    // 30 theme switches and CSS generations complete well under 50ms budget (< 1.6ms per switch)
    expect(elapsed).toBeLessThan(50);
  });
});

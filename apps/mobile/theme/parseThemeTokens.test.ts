import { describe, it, expect } from "vitest";
import { parseThemeTokensFromCss } from "./parseThemeTokens";
import {
  catppuccinFrappeTokens,
  catppuccinLatteTokens,
  lightATokens,
  darkBTokens,
  BUILTIN_THEMES,
} from "./builtinThemeTokens";

describe("Mobile Theme Foundation & Token Extractor (Phase 1)", () => {
  it("provides complete pre-compiled token maps for all 4 built-in themes", () => {
    expect(BUILTIN_THEMES["catppuccin-frappe"]).toBeDefined();
    expect(BUILTIN_THEMES["catppuccin-latte"]).toBeDefined();
    expect(BUILTIN_THEMES["light-a"]).toBeDefined();
    expect(BUILTIN_THEMES["dark-b"]).toBeDefined();
  });

  it("verifies built-in Catppuccin and neutral themes conform to contracts", () => {
    expect(catppuccinFrappeTokens.color.bg.primary).toBe("#303446");
    expect(catppuccinLatteTokens.color.bg.primary).toBe("#eff1f5");
    expect(catppuccinLatteTokens.isDark).toBe(false);
    expect(lightATokens.color.bg.primary).toBe("#fafafa");
    expect(lightATokens.isDark).toBe(false);
    expect(darkBTokens.color.bg.primary).toBe("#000000");
    expect(darkBTokens.isDark).toBe(true);
    expect(darkBTokens.layout.capsuleRadius).toBe("9999px");
    expect(darkBTokens.layout.sheetGroupRadius).toBe("12px");
    expect(darkBTokens.layout.touchTarget).toBe(44);
  });

  it("parses valid CSS custom properties into native theme tokens", () => {
    const customCss = `
      :root {
        --color-bg-primary: #1a1a2e;
        --color-text-normal: #e94560;
        --color-interactive-accent: #0f3460;
        --radius-capsule: 24px;
        --space-1: 6px;
      }
    `;

    const parsed = parseThemeTokensFromCss(customCss, "my-theme", "My Theme");
    expect(parsed.id).toBe("my-theme");
    expect(parsed.name).toBe("My Theme");
    expect(parsed.isDark).toBe(true);
    expect(parsed.color.bg.primary).toBe("#1a1a2e");
    expect(parsed.color.text.normal).toBe("#e94560");
    expect(parsed.color.interactive.accent).toBe("#0f3460");
    expect(parsed.layout.capsuleRadius).toBe("24px");
    expect(parsed.space[1]).toBe("6px");
    // Fallback preserved
    expect(parsed.color.bg.secondary).toBe(darkBTokens.color.bg.secondary);
  });

  it("safely falls back to default token values for missing or empty CSS", () => {
    const emptyCss = `/* no variables */ body { color: red; }`;
    const parsed = parseThemeTokensFromCss(
      emptyCss,
      "fallback-test",
      "Fallback",
    );
    expect(parsed.color.bg.primary).toBe(darkBTokens.color.bg.primary);
    expect(parsed.color.text.normal).toBe(darkBTokens.color.text.normal);
    expect(parsed.borderWidth.thin).toBe("1px");
    expect(parsed.layout.touchTarget).toBe(44);
  });
});

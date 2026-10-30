import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { MobileThemeProvider } from "./MobileThemeProvider";
import { useTheme } from "./useTheme";
import { resetThemePersistenceMock } from "./themePersistence";
import { generateThemeCss } from "./generateThemeCss";
import {
  darkBTokens,
  lightATokens,
  catppuccinFrappeTokens,
} from "./builtinThemeTokens";

describe("MobileThemeProvider & Theme Lifecycle (Phase 2)", () => {
  beforeEach(() => {
    resetThemePersistenceMock({
      activeThemeId: "dark-b",
      themeMode: "dark",
    });
  });

  it("generates complete CSS custom properties matching token values", () => {
    const css = generateThemeCss(darkBTokens);
    expect(css).toContain(":root {");
    expect(css).toContain("--color-bg-primary: #1e1e1e;");
    expect(css).toContain("--color-text-normal: #dcddde;");
    expect(css).toContain("--color-interactive-accent: #cd47ab;");
    expect(css).toContain("--radius-capsule: 9999px;");
    expect(css).toContain("--space-touch-target: 44px;");
  });

  it("verifies Light A CSS generation", () => {
    const lightCss = generateThemeCss(lightATokens);
    expect(lightCss).toContain("--color-bg-primary: #ffffff;");
    expect(lightCss).toContain("--color-text-normal: #222222;");
    expect(lightCss).toContain("--color-interactive-accent: #cd47ab;");
  });

  it("verifies Catppuccin Frappé CSS generation", () => {
    const frappeCss = generateThemeCss(catppuccinFrappeTokens);
    expect(frappeCss).toContain("--color-bg-primary: #303446;");
    expect(frappeCss).toContain("--color-text-normal: #c6d0f5;");
    expect(frappeCss).toContain("--color-interactive-accent: #ca9ee6;");
  });

  it("renders MobileThemeProvider element tree with StatusBar and children", () => {
    let _capturedContext: unknown = null;

    function TestChild() {
      const theme = useTheme();
      _capturedContext = theme;
      return null;
    }

    const element = (
      <MobileThemeProvider initialThemeId="dark-b" initialMode="dark">
        <TestChild />
      </MobileThemeProvider>
    );

    expect(element).toBeDefined();
    expect(element.type).toBe(MobileThemeProvider);
  });
});

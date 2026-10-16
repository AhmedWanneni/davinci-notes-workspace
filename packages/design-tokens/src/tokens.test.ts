import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { colorTokens } from "./colors.js";
import { desktopTokens } from "./desktopTokens.js";
import { fullMobileTokens } from "./mobileTheme.js";
import { mobileTokens } from "./mobile.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

describe("Design Tokens Verification", () => {
  it("ensures mobile outputs contain every desktop color token", () => {
    const missingTokens: string[] = [];

    // Helper to flatten color tokens object paths
    function collectColorLeaves(
      obj: Record<string, unknown>,
      prefix = "",
    ): string[] {
      const keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "object" && v !== null) {
          keys.push(
            ...collectColorLeaves(v as Record<string, unknown>, fullKey),
          );
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const desktopColorKeys = collectColorLeaves(
      colorTokens as unknown as Record<string, unknown>,
    );
    const mobileColors = fullMobileTokens.color as unknown as Record<
      string,
      unknown
    >;

    for (const key of desktopColorKeys) {
      const parts = key.split(".");
      let current: unknown = mobileColors;
      for (const part of parts) {
        if (
          current &&
          typeof current === "object" &&
          part in (current as Record<string, unknown>)
        ) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current === undefined) {
        missingTokens.push(key);
      }
    }

    if (missingTokens.length > 0) {
      console.error(
        "Missing desktop color tokens in mobile output:",
        missingTokens,
      );
    }
    expect(missingTokens).toEqual([]);
  });

  it("verifies mobile-only tokens live in a separate namespace", () => {
    expect(mobileTokens.minTouchTarget).toBe(44);
    expect(mobileTokens.safeArea).toBeDefined();
    expect(mobileTokens.safeArea.headerHeight).toBe(44);
    expect(mobileTokens.bodySize).toBe("16px");
    expect(mobileTokens.bodyLineHeight).toBe("1.4");
    expect(mobileTokens.bottomSheetRadius).toBe("16px");
    expect(mobileTokens.pressState.active).toBeDefined();

    expect(fullMobileTokens.mobile).toBeDefined();
    expect(
      (desktopTokens as unknown as { mobile?: unknown }).mobile,
    ).toBeUndefined();
  });

  it("ensures mobile tokens do NOT appear in desktop CSS/SCSS outputs", () => {
    const css = fs.readFileSync(
      path.join(distDir, "css/variables.css"),
      "utf8",
    );
    const scss = fs.readFileSync(
      path.join(distDir, "scss/_variables.scss"),
      "utf8",
    );

    const mobileKeywords = [
      "touch-target",
      "safe-area",
      "bottom-sheet",
      "press-state",
      "mobile-body",
    ];
    for (const kw of mobileKeywords) {
      expect(css).not.toContain(kw);
      expect(scss).not.toContain(kw);
    }
  });

  it("ensures webview editorVariables string contains essential variables", () => {
    const webviewCss = fs.readFileSync(
      path.join(distDir, "webview/editorVariables.css"),
      "utf8",
    );
    expect(webviewCss).toContain("--color-bg-primary");
    expect(webviewCss).toContain("--editor-obsidian-color-link");
    expect(webviewCss).toContain("--editor-line-height");
  });
});

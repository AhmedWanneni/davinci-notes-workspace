import { describe, expect, it } from "vitest";
import {
  clampEditorFontSize,
  defaultEditorSettings,
  editorFonts,
  isEditorFont,
  loadEditorSettings,
  MAX_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  DEFAULT_EDITOR_FONT_SIZE,
  saveEditorSetting,
  validateAndSanitizeCustomFont,
  type EditorSettings,
} from "./editorSettings";

describe("editorSettings", () => {
  describe("clampEditorFontSize", () => {
    it("returns default font size for invalid or non-numeric inputs", () => {
      expect(clampEditorFontSize(null)).toBe(DEFAULT_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize(undefined)).toBe(DEFAULT_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize("abc")).toBe(DEFAULT_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize(Number.NaN)).toBe(DEFAULT_EDITOR_FONT_SIZE);
    });

    it("clamps values below MIN_EDITOR_FONT_SIZE to 12", () => {
      expect(clampEditorFontSize(8)).toBe(MIN_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize("10")).toBe(MIN_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize(-5)).toBe(MIN_EDITOR_FONT_SIZE);
    });

    it("clamps values above MAX_EDITOR_FONT_SIZE to 28", () => {
      expect(clampEditorFontSize(32)).toBe(MAX_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize("30")).toBe(MAX_EDITOR_FONT_SIZE);
      expect(clampEditorFontSize(100)).toBe(MAX_EDITOR_FONT_SIZE);
    });

    it("rounds and preserves numbers within the valid range", () => {
      expect(clampEditorFontSize(12)).toBe(12);
      expect(clampEditorFontSize(16)).toBe(16);
      expect(clampEditorFontSize(18.4)).toBe(18);
      expect(clampEditorFontSize(18.6)).toBe(19);
      expect(clampEditorFontSize("22")).toBe(22);
      expect(clampEditorFontSize(24)).toBe(24);
    });
  });

  describe("isEditorFont", () => {
    it("recognizes all curated font options and legacy roboto", () => {
      for (const font of editorFonts) {
        expect(isEditorFont(font)).toBe(true);
      }
      expect(isEditorFont("system")).toBe(true);
      expect(isEditorFont("inter")).toBe(true);
      expect(isEditorFont("ibm-plex-sans")).toBe(true);
      expect(isEditorFont("literata")).toBe(true);
      expect(isEditorFont("source-serif-4")).toBe(true);
      expect(isEditorFont("jetbrains-mono")).toBe(true);
      expect(isEditorFont("montserrat")).toBe(true);
      expect(isEditorFont("raleway")).toBe(true);
      expect(isEditorFont("custom")).toBe(true);
      expect(isEditorFont("serif")).toBe(true);
      expect(isEditorFont("monospace")).toBe(true);
      expect(isEditorFont("roboto")).toBe(true);
    });

    it("rejects invalid or unknown font names", () => {
      expect(isEditorFont("comic-sans")).toBe(false);
      expect(isEditorFont("arial")).toBe(false);
      expect(isEditorFont("")).toBe(false);
      expect(isEditorFont(null)).toBe(false);
      expect(isEditorFont(undefined)).toBe(false);
    });
  });

  describe("validateAndSanitizeCustomFont", () => {
    it("rejects empty or whitespace-only inputs with safe fallback", () => {
      const resNull = validateAndSanitizeCustomFont(null);
      expect(resNull.isValid).toBe(false);
      expect(resNull.cssFamily).toBe("var(--font-ui)");

      const resEmpty = validateAndSanitizeCustomFont("");
      expect(resEmpty.isValid).toBe(false);
      expect(resEmpty.cssFamily).toBe("var(--font-ui)");

      const resWhitespace = validateAndSanitizeCustomFont("   ");
      expect(resWhitespace.isValid).toBe(false);
      expect(resWhitespace.cssFamily).toBe("var(--font-ui)");
    });

    it("accepts valid system font names", () => {
      const res = validateAndSanitizeCustomFont("Fira Code");
      expect(res.isValid).toBe(true);
      expect(res.sanitized).toBe("Fira Code");
      expect(res.cssFamily).toBe('"Fira Code", var(--font-ui)');

      const resApos = validateAndSanitizeCustomFont("Courier New");
      expect(resApos.isValid).toBe(true);
      expect(resApos.sanitized).toBe("Courier New");
      expect(resApos.cssFamily).toBe('"Courier New", var(--font-ui)');
    });

    it("rejects font names exceeding 50 characters", () => {
      const longName = "A".repeat(55);
      const res = validateAndSanitizeCustomFont(longName);
      expect(res.isValid).toBe(false);
      expect(res.sanitized).toHaveLength(50);
      expect(res.cssFamily).toBe("var(--font-ui)");
      expect(res.error).toContain("50 characters or less");
    });

    it("rejects CSS injection attempts and malicious characters", () => {
      const injections = [
        "x; } body { display:none",
        '"><script>alert(1)</script>',
        "font; color: red;",
        "font { zoom: 2 }",
        "url('https://evil.com')",
        "test/*comment*/font",
      ];

      for (const injection of injections) {
        const res = validateAndSanitizeCustomFont(injection);
        expect(res.isValid).toBe(false);
        expect(res.cssFamily).toBe("var(--font-ui)");
        expect(res.error).toBe("Font name contains invalid characters");
      }
    });

    it("escapes quotes safely into CSS string format", () => {
      const res = validateAndSanitizeCustomFont("Charcoal's Font");
      expect(res.isValid).toBe(true);
      expect(res.cssFamily).toBe('"Charcoal\'s Font", var(--font-ui)');
    });
  });

  describe("loadEditorSettings & saveEditorSetting", () => {
    it("loads default settings when storage is empty", async () => {
      const storageMap = new Map<string, string>();
      const storage = {
        get: async (key: keyof EditorSettings) => storageMap.get(key) ?? null,
        set: async (key: keyof EditorSettings, val: string) => {
          storageMap.set(key, val);
        },
      };

      const settings = await loadEditorSettings(storage);
      expect(settings).toEqual(defaultEditorSettings);
    });

    it("persists and reloads valid customized settings", async () => {
      const storageMap = new Map<string, string>();
      const storage = {
        get: async (key: keyof EditorSettings) => storageMap.get(key) ?? null,
        set: async (key: keyof EditorSettings, val: string) => {
          storageMap.set(key, val);
        },
      };

      await saveEditorSetting(storage, "editorFont", "custom");
      await saveEditorSetting(storage, "editorCustomFont", "Menlo");
      await saveEditorSetting(storage, "editorFontSize", 18);
      await saveEditorSetting(storage, "strictLineBreaks", true);
      await saveEditorSetting(storage, "useVimMode", true);
      await saveEditorSetting(storage, "vimMonospaceMode", false);

      const loaded = await loadEditorSettings(storage);
      expect(loaded.editorFont).toBe("custom");
      expect(loaded.editorCustomFont).toBe("Menlo");
      expect(loaded.editorFontSize).toBe(18);
      expect(loaded.strictLineBreaks).toBe(true);
      expect(loaded.useVimMode).toBe(true);
      expect(loaded.vimMonospaceMode).toBe(false);
    });

    it("sanitizes invalid custom font names upon loading", async () => {
      const storageMap = new Map<string, string>([
        ["editorFont", "custom"],
        ["editorCustomFont", "malicious; } body { display:none"],
      ]);
      const storage = {
        get: async (key: keyof EditorSettings) => storageMap.get(key) ?? null,
        set: async (key: keyof EditorSettings, val: string) => {
          storageMap.set(key, val);
        },
      };

      const loaded = await loadEditorSettings(storage);
      expect(loaded.editorFont).toBe("custom");
      expect(loaded.editorCustomFont).toBe("");
    });
  });
});

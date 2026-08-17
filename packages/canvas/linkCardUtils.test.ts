import { describe, expect, it } from "vitest";
import {
  extractDomain,
  FORBIDDEN_SANDBOX_TOKENS,
  getEmbedUrl,
  getYouTubeEmbedUrl,
  isSandboxSafe,
  isValidWebUrl,
  isYouTubeUrl,
  SANDBOX_PERMISSIONS,
  sanitizeWebUrl,
} from "./linkCardUtils";

describe("linkCardUtils", () => {
  describe("isValidWebUrl", () => {
    it("accepts valid https and http URLs", () => {
      expect(isValidWebUrl("https://example.com")).toBe(true);
      expect(isValidWebUrl("http://localhost:3000/page")).toBe(true);
      expect(isValidWebUrl("https://news.ycombinator.com/item?id=12345")).toBe(
        true,
      );
    });

    it("rejects invalid, non-web, or dangerous schemes", () => {
      expect(isValidWebUrl("")).toBe(false);
      expect(isValidWebUrl("not-a-url")).toBe(false);
      expect(isValidWebUrl("javascript:alert(1)")).toBe(false);
      expect(isValidWebUrl("file:///etc/passwd")).toBe(false);
      expect(isValidWebUrl("tauri://localhost")).toBe(false);
      expect(isValidWebUrl("data:text/html,<h1>hi</h1>")).toBe(false);
    });
  });

  describe("sanitizeWebUrl", () => {
    it("preserves valid https URL", () => {
      expect(sanitizeWebUrl("https://github.com/facebook/react")).toBe(
        "https://github.com/facebook/react",
      );
    });

    it("prepends https to bare domains", () => {
      expect(sanitizeWebUrl("github.com/foo/bar")).toBe(
        "https://github.com/foo/bar",
      );
      expect(sanitizeWebUrl("www.nytimes.com")).toBe("https://www.nytimes.com/");
    });

    it("returns null for dangerous protocols", () => {
      expect(sanitizeWebUrl("javascript:void(0)")).toBeNull();
      expect(sanitizeWebUrl("file:///Users/me/secret.txt")).toBeNull();
      expect(sanitizeWebUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(sanitizeWebUrl("blob:https://evil.com/uuid")).toBeNull();
      expect(sanitizeWebUrl("tauri://main")).toBeNull();
    });

    it("returns null for non-domains", () => {
      expect(sanitizeWebUrl("just some text")).toBeNull();
      expect(sanitizeWebUrl("")).toBeNull();
    });
  });

  describe("extractDomain", () => {
    it("extracts clean hostnames without www prefix", () => {
      expect(extractDomain("https://www.wikipedia.org/wiki/Main_Page")).toBe(
        "wikipedia.org",
      );
      expect(extractDomain("https://sub.domain.example.com:8080/path")).toBe(
        "sub.domain.example.com",
      );
    });

    it("falls back gracefully on invalid URLs", () => {
      expect(extractDomain("invalid")).toBe("invalid");
    });
  });

  describe("isYouTubeUrl & getYouTubeEmbedUrl", () => {
    it("identifies YouTube domain variants", () => {
      expect(isYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
        true,
      );
      expect(isYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
      expect(isYouTubeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
        true,
      );
      expect(isYouTubeUrl("https://example.com")).toBe(false);
    });

    it("converts standard watch URLs to nocookie embed URLs", () => {
      expect(
        getYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      ).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("converts youtu.be shortlinks", () => {
      expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
    });

    it("converts shorts URLs", () => {
      expect(getYouTubeEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
    });

    it("preserves start timestamps (seconds and hms notation)", () => {
      expect(
        getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=120"),
      ).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=120");
      expect(
        getYouTubeEmbedUrl("https://youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s"),
      ).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90");
    });
  });

  describe("getEmbedUrl", () => {
    it("converts YouTube links and preserves generic web URLs", () => {
      expect(getEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
      expect(getEmbedUrl("https://wikipedia.org")).toBe(
        "https://wikipedia.org/",
      );
    });

    it("returns empty string for invalid URLs", () => {
      expect(getEmbedUrl("javascript:evil()")).toBe("");
    });
  });

  describe("Sandboxing security helpers", () => {
    it("verifies default SANDBOX_PERMISSIONS is safe", () => {
      expect(isSandboxSafe(SANDBOX_PERMISSIONS)).toBe(true);
      expect(SANDBOX_PERMISSIONS).toContain("allow-scripts");
      expect(SANDBOX_PERMISSIONS).toContain("allow-same-origin");
      expect(SANDBOX_PERMISSIONS).toContain("allow-forms");
    });

    it("detects forbidden sandbox tokens", () => {
      for (const token of FORBIDDEN_SANDBOX_TOKENS) {
        expect(isSandboxSafe(`${SANDBOX_PERMISSIONS} ${token}`)).toBe(false);
      }
      expect(
        isSandboxSafe("allow-scripts allow-top-navigation"),
      ).toBe(false);
    });
  });
});

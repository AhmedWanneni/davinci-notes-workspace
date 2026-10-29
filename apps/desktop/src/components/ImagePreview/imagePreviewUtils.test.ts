import { describe, expect, it } from "vitest";
import { formatFileSize, isImagePath } from "./imagePreviewUtils";

describe("imagePreviewUtils", () => {
  describe("isImagePath", () => {
    it("recognizes all standard image extensions", () => {
      expect(isImagePath("images/cat.png")).toBe(true);
      expect(isImagePath("photos/dog.JPG")).toBe(true);
      expect(isImagePath("banner.jpeg")).toBe(true);
      expect(isImagePath("diagram.svg")).toBe(true);
      expect(isImagePath("anim.gif")).toBe(true);
      expect(isImagePath("asset.webp")).toBe(true);
      expect(isImagePath("icon.ico")).toBe(true);
      expect(isImagePath("photo.avif")).toBe(true);
    });

    it("rejects non-image paths", () => {
      expect(isImagePath("notes/daily.md")).toBe(false);
      expect(isImagePath("board.canvas")).toBe(false);
      expect(isImagePath("document.pdf")).toBe(false);
      expect(isImagePath("track.mp3")).toBe(false);
      expect(isImagePath("")).toBe(false);
      expect(isImagePath(null)).toBe(false);
      expect(isImagePath(undefined)).toBe(false);
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes, kilobytes, and megabytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(2048)).toBe("2.0 KB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
    });

    it("handles empty or invalid inputs", () => {
      expect(formatFileSize(undefined)).toBe("");
      expect(formatFileSize(NaN)).toBe("");
    });
  });
});

import { describe, expect, it } from "vitest";
import type { FileCardType } from "./mediaCardUtils";
import {
  getFileCardType,
  getFileExtension,
  IMAGE_EXTENSIONS,
  isMediaFile,
  isPdfFile,
  PDF_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from "./mediaCardUtils";

describe("mediaCardUtils", () => {
  describe("getFileExtension", () => {
    it("extracts lowercase extension from paths", () => {
      expect(getFileExtension("notes/report.pdf")).toBe("pdf");
      expect(getFileExtension("report.PDF")).toBe("pdf");
      expect(getFileExtension("image.PNG")).toBe("png");
      expect(getFileExtension("video.MP4")).toBe("mp4");
      expect(getFileExtension("readme.md")).toBe("md");
    });

    it("returns empty string for no extension or empty path", () => {
      expect(getFileExtension("noextension")).toBe("");
      expect(getFileExtension("")).toBe("");
      expect(getFileExtension("folder/makefile")).toBe("");
    });
  });

  describe("getFileCardType", () => {
    it("identifies markdown files", () => {
      expect(getFileCardType("notes/hello.md")).toBe(
        "markdown" as FileCardType,
      );
      expect(getFileCardType("HELLO.MD")).toBe("markdown" as FileCardType);
    });

    it("identifies image files", () => {
      for (const ext of IMAGE_EXTENSIONS) {
        expect(getFileCardType(`attachments/photo.${ext}`)).toBe(
          "image" as FileCardType,
          `expected .${ext} to be image`,
        );
      }
    });

    it("identifies video files", () => {
      for (const ext of VIDEO_EXTENSIONS) {
        expect(getFileCardType(`media/clip.${ext}`)).toBe(
          "video" as FileCardType,
          `expected .${ext} to be video`,
        );
      }
    });

    it("identifies PDF files", () => {
      expect(getFileCardType("docs/spec.pdf")).toBe("pdf" as FileCardType);
      expect(getFileCardType("SPEC.PDF")).toBe("pdf" as FileCardType);
      for (const ext of PDF_EXTENSIONS) {
        expect(getFileCardType(`file.${ext}`)).toBe("pdf" as FileCardType);
      }
    });

    it("returns unknown for unrecognized or empty paths", () => {
      expect(getFileCardType("file.zip")).toBe("unknown" as FileCardType);
      expect(getFileCardType("")).toBe("unknown" as FileCardType);
      expect(getFileCardType("noext")).toBe("unknown" as FileCardType);
    });
  });

  describe("isMediaFile", () => {
    it("returns true for images and videos only", () => {
      expect(isMediaFile("a.png")).toBe(true);
      expect(isMediaFile("a.mp4")).toBe(true);
      expect(isMediaFile("a.pdf")).toBe(false);
      expect(isMediaFile("a.md")).toBe(false);
      expect(isMediaFile("a.zip")).toBe(false);
    });
  });

  describe("isPdfFile", () => {
    it("returns true for PDF files only", () => {
      expect(isPdfFile("report.pdf")).toBe(true);
      expect(isPdfFile("REPORT.PDF")).toBe(true);
      expect(isPdfFile("photo.png")).toBe(false);
      expect(isPdfFile("note.md")).toBe(false);
      expect(isPdfFile("video.mp4")).toBe(false);
      expect(isPdfFile("")).toBe(false);
    });
  });
});

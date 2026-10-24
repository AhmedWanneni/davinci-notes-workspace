import { describe, expect, it } from "vitest";
import type { ClipPayload } from "@app/clipper-core";
import {
  applyClipEdits,
  FALLBACK_NOTE_NAME,
  sanitizeFolder,
  sanitizeNoteName,
} from "./applyClipEdits";

function payload(): ClipPayload {
  return {
    version: 1,
    clipId: "clip-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: "Probe Article.md" },
    source: { url: "https://probe.example/a", title: "Probe Article" },
    properties: { author: "Ada Lovelace", source: "https://probe.example/a" },
    tags: ["clippings"],
    body: "# Probe Article",
    contentHash: "3a1f",
  };
}

describe("sanitizeNoteName", () => {
  it("keeps a name that already names a markdown file", () => {
    expect(sanitizeNoteName("Probe Article.md")).toBe("Probe Article.md");
  });

  it("adds the markdown extension to a bare name", () => {
    expect(sanitizeNoteName("Probe Article")).toBe("Probe Article.md");
  });

  it("strips path separators so a name stays one file in one folder", () => {
    expect(sanitizeNoteName("../../etc/passwd")).toBe("etc passwd.md");
    expect(sanitizeNoteName("Clippings\\Web\\Note")).toBe(
      "Clippings Web Note.md",
    );
  });

  it("refuses to produce a hidden or empty name", () => {
    expect(sanitizeNoteName("...")).toBe(FALLBACK_NOTE_NAME);
    expect(sanitizeNoteName("   ")).toBe(FALLBACK_NOTE_NAME);
  });

  it("collapses whitespace runs", () => {
    expect(sanitizeNoteName("Probe    Article")).toBe("Probe Article.md");
  });
});

describe("sanitizeFolder", () => {
  it("keeps nested folders", () => {
    expect(sanitizeFolder("Clippings/Recipes")).toBe("Clippings/Recipes");
  });

  it("normalises windows separators and stray slashes", () => {
    expect(sanitizeFolder("\\Clippings\\\\Recipes\\")).toBe(
      "Clippings/Recipes",
    );
  });

  it("drops traversal segments instead of passing them on", () => {
    expect(sanitizeFolder("../../Secrets")).toBe("Secrets");
    expect(sanitizeFolder("Clippings/../../etc")).toBe("Clippings/etc");
  });

  it("treats an emptied folder as the vault root", () => {
    expect(sanitizeFolder("")).toBe("");
    expect(sanitizeFolder("/")).toBe("");
    expect(sanitizeFolder(".")).toBe("");
  });
});

describe("applyClipEdits", () => {
  it("returns the clip unchanged when nothing was edited", () => {
    const original = payload();

    expect(applyClipEdits(original, {})).toEqual(original);
  });

  it("applies a renamed note and a new folder as a sanitised pair", () => {
    const edited = applyClipEdits(payload(), {
      noteName: "../../Probe Soup",
      folder: "../Clippings/Soups/",
    });

    expect(edited.target.noteName).toBe("Probe Soup.md");
    expect(edited.target.folder).toBe("Clippings/Soups");
  });

  it("overrides a property and leaves the others alone", () => {
    const edited = applyClipEdits(payload(), {
      properties: { author: "Grace Hopper" },
    });

    expect(edited.properties).toEqual({
      author: "Grace Hopper",
      source: "https://probe.example/a",
    });
  });

  it("removes a property whose field was emptied", () => {
    const edited = applyClipEdits(payload(), { properties: { author: "  " } });

    expect(edited.properties).not.toHaveProperty("author");
    expect(edited.properties).toHaveProperty("source");
  });

  it("keeps the body hash, because editing does not touch the body", () => {
    const original = payload();
    const edited = applyClipEdits(original, {
      noteName: "Renamed",
      folder: "Elsewhere",
      properties: { author: "Grace Hopper" },
    });

    expect(edited.body).toBe(original.body);
    expect(edited.contentHash).toBe(original.contentHash);
  });

  it("does not modify the clip it was given", () => {
    const original = payload();
    const snapshot = structuredClone(original);

    applyClipEdits(original, {
      noteName: "Renamed",
      properties: { author: "Grace Hopper" },
    });

    expect(original).toEqual(snapshot);
  });
});

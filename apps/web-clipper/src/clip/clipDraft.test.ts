import type { ClipPayload } from "@app/clipper-core";
import { describe, expect, it } from "vitest";
import { buildClipDraft } from "./clipDraft";

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
    properties: {
      author: "Ada Lovelace",
      authors: ["Ada", "Grace"],
    },
    tags: ["clippings"],
    body: "# Probe Article",
    contentHash: "3a1f",
  };
}

describe("buildClipDraft", () => {
  it("shows what the template rendered when nothing was typed", () => {
    const draft = buildClipDraft(payload(), {});

    expect(draft.noteName).toBe("Probe Article.md");
    expect(draft.folder).toBe("Clippings");
    expect(draft.properties).toEqual({
      author: "Ada Lovelace",
      authors: ["Ada", "Grace"],
    });
  });

  it("shows raw typing rather than the sanitised result", () => {
    const draft = buildClipDraft(payload(), {
      noteName: "../../Probe Soup",
      folder: "../Clippings/Soups/",
    });

    expect(draft.noteName).toBe("../../Probe Soup");
    expect(draft.folder).toBe("../Clippings/Soups/");
  });

  it("overlays edited properties and keeps list values as lists", () => {
    const draft = buildClipDraft(payload(), {
      properties: { author: "Grace Hopper" },
    });

    expect(draft.properties.author).toBe("Grace Hopper");
    expect(draft.properties.authors).toEqual(["Ada", "Grace"]);
  });

  it("shows a cleared property as empty rather than dropping it from the field", () => {
    const draft = buildClipDraft(payload(), { properties: { author: "" } });

    expect(draft.properties.author).toBe("");
  });

  it("does not modify the payload it was given", () => {
    const original = payload();
    const snapshot = structuredClone(original);

    buildClipDraft(original, {
      noteName: "Renamed",
      properties: { author: "x" },
    });

    expect(original).toEqual(snapshot);
  });
});

import { describe, expect, it } from "vitest";
import { buildClipPayload, contentHash } from "./buildClipPayload";
import type { ClipTemplate } from "./ClipTemplate";
import type { RenderedClip } from "./renderClipTemplate";

const template: ClipTemplate = {
  id: "article",
  name: "Article",
  behavior: "append-bottom",
  noteNameFormat: "{{title}}",
  folder: "Clippings",
  properties: [],
  tags: [],
  body: "{{content}}",
  triggers: [],
};

const rendered: RenderedClip = {
  noteName: "Note.md",
  folder: "Clippings",
  properties: { source: "https://e.x" },
  tags: ["clippings"],
  body: "# Note\n\nBody",
};

describe("contentHash", () => {
  it("is stable, fixed width, and content sensitive", () => {
    expect(contentHash("abc")).toBe(contentHash("abc"));
    expect(contentHash("abc")).toHaveLength(16);
    expect(contentHash("abc")).not.toBe(contentHash("abd"));
  });
});

describe("buildClipPayload", () => {
  it("assembles a versioned payload with a derived hash", () => {
    const payload = buildClipPayload({
      template,
      rendered,
      source: { url: "https://e.x", title: "Note" },
      mode: "full",
      clipId: "c1",
      capturedAt: "2026-10-17T09:00:00.000Z",
    });
    expect(payload).toMatchObject({
      version: 1,
      clipId: "c1",
      mode: "full",
      templateId: "article",
      behavior: "append-bottom",
      target: { folder: "Clippings", noteName: "Note.md" },
      tags: ["clippings"],
      contentHash: contentHash(rendered.body),
    });
    expect(payload.highlights).toBeUndefined();
    expect(payload.attachments).toBeUndefined();
  });

  it("includes highlights and attachments when present", () => {
    const payload = buildClipPayload({
      template,
      rendered,
      source: { url: "u", title: "t" },
      mode: "highlights",
      clipId: "c2",
      capturedAt: "now",
      highlights: [{ text: "x", createdAt: "now" }],
      attachments: [{ sourceUrl: "s", suggestedName: "n" }],
    });
    expect(payload.highlights).toEqual([{ text: "x", createdAt: "now" }]);
    expect(payload.attachments).toEqual([
      { sourceUrl: "s", suggestedName: "n" },
    ]);
  });
});

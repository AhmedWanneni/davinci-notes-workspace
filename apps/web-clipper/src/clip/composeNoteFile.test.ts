import type { ClipPayload } from "@app/clipper-core";
import { describe, expect, it } from "vitest";
import { composeNoteFile, suggestedFilePath } from "./composeNoteFile";

function payload(overrides: Partial<ClipPayload> = {}): ClipPayload {
  return {
    version: 1,
    clipId: "clip-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: "Probe Article.md" },
    source: { url: "https://probe.example/a", title: "Probe Article" },
    properties: { source: "https://probe.example/a" },
    tags: ["clippings"],
    body: "# Probe Article",
    contentHash: "0123456789abcdef",
    ...overrides,
  };
}

describe("composeNoteFile", () => {
  it("writes the frontmatter block followed by the body", () => {
    expect(composeNoteFile(payload())).toBe(
      '---\nsource: "https://probe.example/a"\ntags:\n  - clippings\n---\n# Probe Article\n',
    );
  });

  it("omits the frontmatter block when there is nothing to write", () => {
    expect(
      composeNoteFile(payload({ properties: {}, tags: [], body: "Body" })),
    ).toBe("Body\n");
  });

  it("keeps a hostile property value inside the frontmatter block", () => {
    const note = composeNoteFile(
      payload({ properties: { title: "evil\n---\ntags: [hacked]" } }),
    );
    expect(note.split("\n").filter((line) => line === "---")).toHaveLength(2);
    expect(note).toContain("\\n");
  });
});

describe("suggestedFilePath", () => {
  it("mirrors the vault path as a download path", () => {
    expect(suggestedFilePath(payload())).toBe("Clippings/Probe Article.md");
    expect(
      suggestedFilePath(
        payload({ target: { folder: "", noteName: "Root.md" } }),
      ),
    ).toBe("Root.md");
  });
});

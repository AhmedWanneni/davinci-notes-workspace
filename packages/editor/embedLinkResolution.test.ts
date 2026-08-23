import { describe, expect, it } from "vitest";
import { resolveEmbedLink } from "./embedLinkResolution";

const paths = [
  "attachments/photo.png",
  "attachments/recording.mp3",
  "attachments/movie.mp4",
  "attachments/guide.pdf",
  "notes/Project.md",
];

describe("resolveEmbedLink", () => {
  it.each([
    ["![[photo.png]]", { type: "image", path: "attachments/photo.png" }],
    ["![[recording.mp3]]", { type: "audio", path: "attachments/recording.mp3" }],
    ["![[movie.mp4]]", { type: "video", path: "attachments/movie.mp4" }],
    ["![[guide.pdf]]", { type: "pdf", path: "attachments/guide.pdf" }],
  ])("resolves attachment syntax produced by paste/drop: %s", (syntax, result) => {
    expect(resolveEmbedLink(syntax, { paths })).toEqual(result);
  });

  it("resolves a whole note and an existing heading section", () => {
    const noteContents = { "notes/Project.md": "# Project\n\n## Design\n" };
    expect(resolveEmbedLink("![[Project]]", { paths, noteContents })).toEqual({
      type: "note", path: "notes/Project.md",
    });
    expect(resolveEmbedLink("![[Project#Design]]", { paths, noteContents })).toEqual({
      type: "note", path: "notes/Project.md", heading: "Design",
    });
  });

  it("returns explicit ambiguity instead of silently choosing a duplicate", () => {
    expect(resolveEmbedLink("![[photo.png]]", {
      paths: ["a/photo.png", "b/photo.png"],
    })).toEqual({ type: "ambiguous", candidates: ["a/photo.png", "b/photo.png"] });
  });

  it("returns clear broken states without throwing", () => {
    expect(resolveEmbedLink("![[missing.png]]", { paths })).toEqual({ type: "unresolved" });
    expect(resolveEmbedLink("![[Project#Missing]]", {
      paths, noteContents: { "notes/Project.md": "# Project\n" },
    })).toEqual({ type: "heading-not-found", path: "notes/Project.md", heading: "Missing" });
  });
});

import { describe, expect, it } from "vitest";
import { resolveEmbedLink } from "./embedLinkResolution";
import {
  extractHeadingSection,
  normalizeHeadingText,
  stripFrontmatter,
} from "./noteSectionExtraction";

describe("noteSectionExtraction and embed parsing", () => {
  const sampleNote = `---
title: Project Overview
tags: [dev, notes]
---
# Intro
Introduction text here.

## Requirements
Core requirements here.

### Functional
Functional items:
- Item 1
- Item 2

### Non-Functional
Performance and security.

## Architecture
Architecture overview.
\`\`\`bash
# This is a comment inside a code block, not a heading
echo "Hello"
\`\`\`
Final notes on architecture.

## **Special** & [Formatted](https://example.com) Heading ##
Content under special formatted heading.

## Conclusion
Final words in the file.`;

  describe("resolveEmbedLink parsing", () => {
    const paths = ["notes/Overview.md", "notes/Arch.md", "archive/Arch.md"];
    const noteContents = {
      "notes/Overview.md": sampleNote,
      "notes/Arch.md": "# Arch\nSome arch text",
    };

    it("parses basic note embed ![[Note]]", () => {
      const res = resolveEmbedLink("![[Overview]]", { paths, noteContents });
      expect(res).toEqual({ type: "note", path: "notes/Overview.md" });
    });

    it("parses note embed with heading ![[Note#Heading]]", () => {
      const res = resolveEmbedLink("![[Overview#Requirements]]", {
        paths,
        noteContents,
      });
      expect(res).toEqual({
        type: "note",
        path: "notes/Overview.md",
        heading: "Requirements",
      });
    });

    it("parses note embed with alias ![[Note#Heading|Display Alias]]", () => {
      const res = resolveEmbedLink("![[Overview#Requirements|Summary]]", {
        paths,
        noteContents,
      });
      expect(res).toEqual({
        type: "note",
        path: "notes/Overview.md",
        heading: "Requirements",
      });
    });

    it("handles spaces in syntax ![[ Note # Heading | Alias ]]", () => {
      const res = resolveEmbedLink(" ![[  Overview # Requirements | Custom ]] ", {
        paths,
        noteContents,
      });
      expect(res).toEqual({
        type: "note",
        path: "notes/Overview.md",
        heading: "Requirements",
      });
    });

    it("detects ambiguous duplicate note names", () => {
      const res = resolveEmbedLink("![[Arch]]", { paths, noteContents });
      expect(res).toEqual({
        type: "ambiguous",
        candidates: ["archive/Arch.md", "notes/Arch.md"],
      });
    });

    it("returns unresolved for missing note", () => {
      const res = resolveEmbedLink("![[NonExistent]]", { paths, noteContents });
      expect(res).toEqual({ type: "unresolved" });
    });

    it("returns heading-not-found for missing heading in existing note", () => {
      const res = resolveEmbedLink("![[Overview#MissingSection]]", {
        paths,
        noteContents,
      });
      expect(res).toEqual({
        type: "heading-not-found",
        path: "notes/Overview.md",
        heading: "MissingSection",
      });
    });
  });

  describe("extractHeadingSection", () => {
    it("extracts section with nested subheadings and stops at same level heading", () => {
      const extracted = extractHeadingSection(sampleNote, "Requirements");
      expect(extracted.found).toBe(true);
      expect(extracted.level).toBe(2);
      expect(extracted.content).toContain("## Requirements");
      expect(extracted.content).toContain("### Functional");
      expect(extracted.content).toContain("### Non-Functional");
      expect(extracted.content).not.toContain("## Architecture");
    });

    it("extracts top-level heading section", () => {
      const extracted = extractHeadingSection(sampleNote, "Intro");
      expect(extracted.found).toBe(true);
      expect(extracted.level).toBe(1);
      expect(extracted.content).toContain("# Intro");
      expect(extracted.content).toContain("Introduction text here.");
      // Stops at next top-level or same/higher level heading
    });

    it("ignores comments inside code blocks", () => {
      const extracted = extractHeadingSection(sampleNote, "Architecture");
      expect(extracted.found).toBe(true);
      expect(extracted.content).toContain("# This is a comment inside a code block");
      expect(extracted.content).toContain("Final notes on architecture.");
      expect(extracted.content).not.toContain("## Conclusion");
    });

    it("extracts the last section in the file extending to EOF", () => {
      const extracted = extractHeadingSection(sampleNote, "Conclusion");
      expect(extracted.found).toBe(true);
      expect(extracted.content).toBe("## Conclusion\nFinal words in the file.");
    });

    it("matches heading with markdown formatting, special chars, and trailing hashes", () => {
      const withFormatting = extractHeadingSection(
        sampleNote,
        "Special & Formatted Heading",
      );
      expect(withFormatting.found).toBe(true);
      expect(withFormatting.content).toContain(
        "Content under special formatted heading.",
      );

      const exact = extractHeadingSection(
        sampleNote,
        "**Special** & [Formatted](https://example.com) Heading",
      );
      expect(exact.found).toBe(true);
    });

    it("returns not found for nonexistent heading", () => {
      const extracted = extractHeadingSection(sampleNote, "Nonexistent");
      expect(extracted.found).toBe(false);
      expect(extracted.content).toBe("");
    });
  });

  describe("stripFrontmatter", () => {
    it("removes YAML block from start of file", () => {
      const stripped = stripFrontmatter(sampleNote);
      expect(stripped.startsWith("# Intro")).toBe(true);
      expect(stripped).not.toContain("title: Project Overview");
    });

    it("returns text unchanged when no frontmatter is present", () => {
      const text = "# Title\nBody";
      expect(stripFrontmatter(text)).toBe(text);
    });
  });

  describe("normalizeHeadingText", () => {
    it("strips bold, italic, code, and links", () => {
      expect(normalizeHeadingText("## **Bold** and _Italic_ with `code`")).toBe(
        "## bold and italic with code",
      );
      expect(
        normalizeHeadingText("[My Link](https://test.com) & **Special**"),
      ).toBe("my link & special");
    });
  });
});

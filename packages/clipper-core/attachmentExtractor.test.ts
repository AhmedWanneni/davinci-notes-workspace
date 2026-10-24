import { describe, expect, it } from "vitest";
import {
  deriveSuggestedImageName,
  extractImageAttachments,
  rewriteMarkdownImageLinks,
} from "./attachmentExtractor";

describe("attachmentExtractor", () => {
  describe("deriveSuggestedImageName", () => {
    it("extracts clean filename and valid extension from URL", () => {
      expect(
        deriveSuggestedImageName(
          "https://example.com/assets/photos/cat.png?width=800",
          0,
        ),
      ).toBe("cat.png");
      expect(
        deriveSuggestedImageName(
          "https://example.com/images/hero.JPEG#main",
          1,
        ),
      ).toBe("hero.jpeg");
      expect(
        deriveSuggestedImageName("https://example.com/vector/logo.svg", 2),
      ).toBe("logo.svg");
    });

    it("sanitizes unsafe characters in filename", () => {
      expect(
        deriveSuggestedImageName(
          "https://example.com/files/c:a*t_name.webp",
          0,
        ),
      ).toBe("c_a_t_name.webp");
    });

    it("falls back to default with index for URLs without filename or extension", () => {
      expect(
        deriveSuggestedImageName("https://example.com/dynamic-img?id=123", 0),
      ).toBe("dynamic-img.png");
      expect(deriveSuggestedImageName("https://example.com/", 2)).toBe(
        "image-3.png",
      );
    });
  });

  describe("extractImageAttachments", () => {
    it("extracts markdown images and skips data/relative URLs", () => {
      const markdown = `
# Title

Here is a photo:
![Cute Cat](https://example.com/cat.jpg)

And an icon:
![Icon](data:image/png;base64,iVBOR)
![Local](./relative.png)

And another image with title:
![Dog](https://example.com/dog.png "Good Boy")
`;
      const attachments = extractImageAttachments(markdown);
      expect(attachments).toEqual([
        {
          sourceUrl: "https://example.com/cat.jpg",
          suggestedName: "cat.jpg",
          alt: "Cute Cat",
        },
        {
          sourceUrl: "https://example.com/dog.png",
          suggestedName: "dog.png",
          alt: "Dog",
        },
      ]);
    });

    it("extracts HTML <img> tags", () => {
      const markdown = `
<img src="https://example.com/banner.webp" width="400">
`;
      const attachments = extractImageAttachments(markdown);
      expect(attachments).toEqual([
        {
          sourceUrl: "https://example.com/banner.webp",
          suggestedName: "banner.webp",
          alt: undefined,
        },
      ]);
    });

    it("deduplicates multiple references to the same URL", () => {
      const markdown = `
![Cat 1](https://example.com/cat.png)
![Cat 2](https://example.com/cat.png)
`;
      const attachments = extractImageAttachments(markdown);
      expect(attachments).toHaveLength(1);
      expect(attachments[0]!.sourceUrl).toBe("https://example.com/cat.png");
    });
  });

  describe("rewriteMarkdownImageLinks", () => {
    it("rewrites markdown and html image URLs according to mapping", () => {
      const markdown = `
![Cat](https://example.com/cat.png "Feline")
![Dog](https://example.com/dog.jpg)
![Unchanged](https://example.com/other.png)
<img src="https://example.com/cat.png" alt="Cat">
`;
      const mapping = new Map<string, string>([
        ["https://example.com/cat.png", "Attachments/cat.png"],
        ["https://example.com/dog.jpg", "Attachments/dog.jpg"],
      ]);

      const rewritten = rewriteMarkdownImageLinks(markdown, mapping);
      expect(rewritten).toContain('![Cat](Attachments/cat.png "Feline")');
      expect(rewritten).toContain("![Dog](Attachments/dog.jpg)");
      expect(rewritten).toContain(
        "![Unchanged](https://example.com/other.png)",
      );
      expect(rewritten).toContain('<img src="Attachments/cat.png" alt="Cat">');
    });
  });
});

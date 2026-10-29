import { describe, expect, it } from "vitest";
import { updateEmbedWidthInText } from "./imageResizeSyntax";

describe("updateEmbedWidthInText", () => {
  describe("wikilink image embeds", () => {
    it("adds width to an undimensioned wikilink embed", () => {
      expect(updateEmbedWidthInText("![[cat.png]]", 400)).toBe(
        "![[cat.png|400]]",
      );
      expect(updateEmbedWidthInText("  ![[images/cat.png]]  ", 350)).toBe(
        "  ![[images/cat.png|350]]  ",
      );
    });

    it("replaces existing width in a wikilink embed", () => {
      expect(updateEmbedWidthInText("![[cat.png|200]]", 450)).toBe(
        "![[cat.png|450]]",
      );
    });

    it("replaces existing width x height in a wikilink embed", () => {
      expect(updateEmbedWidthInText("![[cat.png|640x480]]", 500)).toBe(
        "![[cat.png|500]]",
      );
    });

    it("preserves custom alt label while updating width", () => {
      expect(updateEmbedWidthInText("![[cat.png|Cute Kitten|200]]", 600)).toBe(
        "![[cat.png|Cute Kitten|600]]",
      );
      expect(updateEmbedWidthInText("![[cat.png|Cute Kitten]]", 600)).toBe(
        "![[cat.png|Cute Kitten|600]]",
      );
    });

    it("resets/removes width when width is undefined", () => {
      expect(updateEmbedWidthInText("![[cat.png|400]]", undefined)).toBe(
        "![[cat.png]]",
      );
      expect(
        updateEmbedWidthInText("![[cat.png|Cute Kitten|400]]", undefined),
      ).toBe("![[cat.png|Cute Kitten]]");
      expect(updateEmbedWidthInText("![[cat.png]]", undefined)).toBe(
        "![[cat.png]]",
      );
    });
  });

  describe("markdown image embeds", () => {
    it("adds width to a markdown image embed", () => {
      expect(
        updateEmbedWidthInText("![alt](https://example.com/pic.png)", 300),
      ).toBe("![alt|300](https://example.com/pic.png)");
      expect(
        updateEmbedWidthInText("![](https://example.com/pic.png)", 300),
      ).toBe("![300](https://example.com/pic.png)");
    });

    it("updates existing width in a markdown image embed", () => {
      expect(
        updateEmbedWidthInText("![alt|150](https://example.com/pic.png)", 420),
      ).toBe("![alt|420](https://example.com/pic.png)");
    });

    it("resets/removes width in a markdown image embed when width is undefined", () => {
      expect(
        updateEmbedWidthInText(
          "![alt|420](https://example.com/pic.png)",
          undefined,
        ),
      ).toBe("![alt](https://example.com/pic.png)");
      expect(
        updateEmbedWidthInText(
          "![420](https://example.com/pic.png)",
          undefined,
        ),
      ).toBe("![](https://example.com/pic.png)");
    });
  });

  it("returns unchanged text if no image embed is matched", () => {
    expect(updateEmbedWidthInText("Just some markdown text", 300)).toBe(
      "Just some markdown text",
    );
  });
});

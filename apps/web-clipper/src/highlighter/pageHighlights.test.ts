import { describe, expect, it } from "vitest";
import { restoreHighlights, selectedHighlight } from "./pageHighlights";

describe("page highlights", () => {
  it("records which repeated quote was selected", () => {
    document.body.innerHTML = "<p>same first</p><p>same second</p>";
    const text = document.querySelectorAll("p")[1]!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 4);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    expect(selectedHighlight(document)).toEqual({
      text: "same",
      occurrence: 1,
    });
  });

  it("restores text split across elements", () => {
    document.body.innerHTML = "<p>One <em>two</em> three</p>";
    expect(
      restoreHighlights(document, [
        {
          id: "a",
          url: "https://example.test/",
          text: "two three",
          occurrence: 0,
          createdAt: "now",
        },
      ]),
    ).toBe(1);
    expect(
      document.querySelectorAll("mark[data-davinci-highlight='a']"),
    ).toHaveLength(2);
  });

  it("skips an anchor whose text no longer exists", () => {
    document.body.innerHTML = "<p>Changed page</p>";
    expect(
      restoreHighlights(document, [
        {
          id: "a",
          url: "https://example.test/",
          text: "gone",
          occurrence: 0,
          createdAt: "now",
        },
      ]),
    ).toBe(0);
  });
});

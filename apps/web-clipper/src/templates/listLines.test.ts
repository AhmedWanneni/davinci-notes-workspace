import { describe, expect, it } from "vitest";
import { linesToList, listToLines } from "./listLines";

describe("list lines", () => {
  it("round-trips entries", () => {
    const values = ["clippings", "schema:@Article"];
    expect(linesToList(listToLines(values))).toEqual(values);
  });

  it("drops blank and padded lines, so an empty line is not a tag", () => {
    expect(linesToList("\n  clippings\n\n   \ninbox\n")).toEqual([
      "clippings",
      "inbox",
    ]);
    expect(linesToList("")).toEqual([]);
  });

  it("keeps a regex rule's commas intact", () => {
    expect(linesToList(listToLines(["/^https:\\/\\/a\\/(x,y)\\/z/"]))).toEqual([
      "/^https:\\/\\/a\\/(x,y)\\/z/",
    ]);
  });
});

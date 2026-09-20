import { describe, expect, it } from "vitest";
import { getEditorFont } from "./editorFontRegistry";

describe("editor font registry", () => {
  it("falls back to the system font for an unknown persisted id", () => {
    expect(getEditorFont("removed-font").id).toBe("system");
  });

  it("exposes only allowlisted font family values", () => {
    expect(getEditorFont("montserrat").cssFamily).toContain(
      "Montserrat Variable",
    );
    expect(getEditorFont("raleway").cssFamily).toContain("Raleway Variable");
    expect(getEditorFont("roboto").cssFamily).toContain("Roboto Variable");
  });
});

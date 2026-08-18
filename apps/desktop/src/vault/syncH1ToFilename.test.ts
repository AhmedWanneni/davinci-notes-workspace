import { describe, expect, it } from "vitest";
import { syncH1ToFilename } from "./syncH1ToFilename";

describe("syncH1ToFilename", () => {
  it("replaces the first H1 with the new stem", () => {
    expect(syncH1ToFilename("# Old Title\n\nBody", "New Title")).toBe(
      "# New Title\n\nBody",
    );
  });

  it("inserts an H1 when none exists", () => {
    expect(syncH1ToFilename("Body only", "Added")).toBe("# Added\n\nBody only");
  });
});

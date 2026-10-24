import { describe, expect, it } from "vitest";
import type { PageCapture } from "../capture/readPage";
import { defaultClipMode } from "./defaultClipMode";

function capture(overrides: Partial<PageCapture> = {}): PageCapture {
  return {
    url: "https://probe.example/a",
    title: "Probe Article",
    html: "<html></html>",
    ...overrides,
  };
}

describe("defaultClipMode", () => {
  it("clips the whole page when nothing is selected", () => {
    expect(defaultClipMode(capture())).toBe("full");
  });

  it("clips the selection when there is one", () => {
    expect(defaultClipMode(capture({ selection: "picked" }))).toBe("selection");
  });

  it("ignores a selection that is only whitespace", () => {
    expect(defaultClipMode(capture({ selection: "   " }))).toBe("full");
  });
});

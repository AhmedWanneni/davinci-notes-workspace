import { describe, expect, it } from "vitest";
import { isPluginViewModel } from "./pluginWorkspaceTypes.js";

describe("isPluginViewModel", () => {
  it("accepts the structured declarative nodes", () => {
    expect(isPluginViewModel({ type: "stack", children: [
      { type: "text", text: "Safe text" },
      { type: "button", id: "save", label: "Save" },
      { type: "input", id: "title", value: "A note" },
    ] })).toBe(true);
  });

  it("rejects arbitrary HTML-shaped data", () => {
    expect(isPluginViewModel({ type: "html", html: "<script>run()</script>" })).toBe(false);
    expect(isPluginViewModel({ type: "text", html: "<img src=x>" })).toBe(false);
  });
});

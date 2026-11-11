import { describe, expect, it } from "vitest";
import { isIgnoredAgentArtifact } from "./agentArtifactFilter";

describe("agentArtifactFilter", () => {
  it("identifies walkthrough.md as an ignored artifact", () => {
    expect(isIgnoredAgentArtifact("walkthrough.md")).toBe(true);
    expect(isIgnoredAgentArtifact("sub/walkthrough.md")).toBe(true);
  });

  it("identifies implementation_plan.md as an ignored artifact", () => {
    expect(isIgnoredAgentArtifact("implementation_plan.md")).toBe(true);
    expect(isIgnoredAgentArtifact("implementation_plan_v2.md")).toBe(true);
  });

  it("identifies README.md as ignored unless explicitly requested", () => {
    expect(isIgnoredAgentArtifact("README.md")).toBe(true);
    expect(
      isIgnoredAgentArtifact("README.md", "create README.md for repo"),
    ).toBe(false);
  });

  it("identifies backup and temp files as ignored", () => {
    expect(isIgnoredAgentArtifact("notes.bak")).toBe(true);
    expect(isIgnoredAgentArtifact("notes.tmp")).toBe(true);
    expect(isIgnoredAgentArtifact("notes.old")).toBe(true);
  });

  it("allows standard user notes through", () => {
    expect(isIgnoredAgentArtifact("Recipes.md")).toBe(false);
    expect(isIgnoredAgentArtifact("Finance/Q3.md")).toBe(false);
    expect(isIgnoredAgentArtifact("Daily/2026-11-06.md")).toBe(false);
  });
});

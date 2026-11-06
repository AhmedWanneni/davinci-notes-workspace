import { describe, it, expect } from "vitest";
import { resolveSlashCommand } from "./agentSlashCommandHandler";

describe("agentSlashCommandHandler", () => {
  it("resolves /clear command", () => {
    const res = resolveSlashCommand("/clear", {});
    expect(res.handled).toBe(true);
    expect(res.action).toBe("clear");
  });

  it("resolves /models command", () => {
    const res = resolveSlashCommand("/models", {});
    expect(res.handled).toBe(true);
    expect(res.action).toBe("models");
  });

  it("resolves /help with catalog listing", () => {
    const res = resolveSlashCommand("/help", {});
    expect(res.handled).toBe(true);
    expect(res.directResponse).toContain("/plan");
    expect(res.directResponse).toContain("/grill-me");
    expect(res.directResponse).toContain("/usage");
  });

  it("resolves /usage with active session and provider info", () => {
    const res = resolveSlashCommand("/usage", {
      providerId: "gemini",
      model: "gemini-2.0-flash",
      projectName: "Research Project",
      projectId: "proj_123",
      webSearchEnabled: true,
    });
    expect(res.handled).toBe(true);
    expect(res.directResponse).toContain("gemini");
    expect(res.directResponse).toContain("Research Project");
    expect(res.directResponse).toContain("Enabled");
  });

  it("resolves /plan with planning system augmentation", () => {
    const res = resolveSlashCommand("/plan build search feature", {});
    expect(res.handled).toBe(false);
    expect(res.processedPrompt).toContain("[PLANNING MODE] build search feature");
    expect(res.systemAugmentation).toContain("Execution Mode: PLANNING");
  });

  it("resolves /grill-me with interview mode instructions", () => {
    const res = resolveSlashCommand("/grill-me redesign settings page", {});
    expect(res.handled).toBe(false);
    expect(res.processedPrompt).toContain("[INTERVIEW MODE] redesign settings page");
    expect(res.systemAugmentation).toContain("Execution Mode: INTERVIEW");
  });

  it("resolves /web forcing web search", () => {
    const res = resolveSlashCommand("/web latest react 19 features", {});
    expect(res.handled).toBe(false);
    expect(res.processedPrompt).toBe("latest react 19 features");
    expect(res.forceWebSearch).toBe(true);
  });

  it("passes normal prompts through unmodified", () => {
    const res = resolveSlashCommand("Hello assistant", {});
    expect(res.handled).toBe(false);
    expect(res.processedPrompt).toBe("Hello assistant");
  });
});

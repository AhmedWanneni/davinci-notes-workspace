import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  getContextLimit,
  calculateContextBudget,
} from "./agentTokenEstimator";
import type { ChatMessageItem } from "./agentTypes";

describe("agentTokenEstimator", () => {
  it("estimates token counts proportional to character lengths", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("Hello world")).toBe(3);
    const longText = "a".repeat(380);
    expect(estimateTokens(longText)).toBe(100);
  });

  it("resolves context limit for known CLI agents and models", () => {
    expect(getContextLimit("agy", "default")).toBe(1_000_000);
    expect(getContextLimit("claude", "default")).toBe(200_000);
    expect(getContextLimit("codex", "default")).toBe(128_000);
    expect(getContextLimit(null, "gemini-2.0-flash")).toBe(1_000_000);
    expect(getContextLimit(null, "gpt-4o")).toBe(128_000);
    expect(getContextLimit(null, "custom-unknown-model")).toBe(32_768);
  });

  it("calculates budget status: normal when usage < 70%", () => {
    const messages: ChatMessageItem[] = [
      { id: "1", role: "user", content: "Hi", timestamp: 1 },
    ];
    const budget = calculateContextBudget(messages, "Test", "codex", "gpt-4o");
    expect(budget.status).toBe("normal");
    expect(budget.percentage).toBeLessThan(70);
  });

  it("calculates budget status: warning when usage >= 70%", () => {
    // 128,000 context for codex; 75% is ~96,000 tokens => ~364,800 chars
    const bigContent = "x".repeat(365_000);
    const messages: ChatMessageItem[] = [
      { id: "1", role: "assistant", content: bigContent, timestamp: 1 },
    ];
    const budget = calculateContextBudget(messages, "", "codex", "gpt-4o");
    expect(budget.status).toBe("warning");
    expect(budget.percentage).toBeGreaterThanOrEqual(70);
    expect(budget.warningLabel).toContain("nearing token limit");
  });

  it("calculates budget status: critical when usage >= 90%", () => {
    // 92% of 128,000 tokens => ~117,760 tokens => ~450,000 chars
    const hugeContent = "x".repeat(460_000);
    const messages: ChatMessageItem[] = [
      { id: "1", role: "assistant", content: hugeContent, timestamp: 1 },
    ];
    const budget = calculateContextBudget(messages, "", "codex", "gpt-4o");
    expect(budget.status).toBe("critical");
    expect(budget.percentage).toBeGreaterThanOrEqual(90);
    expect(budget.warningLabel).toContain("Running out of tokens");
  });
});

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAgentUsageReport,
  recordAgentUsage,
  clearAgentUsageReport,
} from "./agentUsageTracker";

describe("agentUsageTracker", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mock = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = String(val);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: 0,
      key: () => null,
    };
    Object.defineProperty(window, "localStorage", {
      value: mock,
      writable: true,
      configurable: true,
    });
  });

  it("loads report with default catalog of agents and models initialized", () => {
    const report = loadAgentUsageReport();
    expect(report.lifetimeTotalRequests).toBe(0);
    expect(report.lifetimeTotalTokens).toBe(0);
    expect(report.models.agy).toBeDefined();
    expect(report.models.codex).toBeDefined();
    expect(report.models["gemini-2.0-flash"]).toBeDefined();
  });

  it("records usage for an agent and increments lifetime totals", () => {
    recordAgentUsage({
      id: "codex",
      name: "Codex CLI",
      type: "cli_agent",
      inputTokens: 500,
      outputTokens: 250,
    });

    const report = loadAgentUsageReport();
    expect(report.lifetimeTotalRequests).toBe(1);
    expect(report.lifetimeTotalTokens).toBe(750);
    expect(report.models.codex.totalRequests).toBe(1);
    expect(report.models.codex.inputTokens).toBe(500);
    expect(report.models.codex.outputTokens).toBe(250);
    expect(report.models.codex.totalTokens).toBe(750);
  });

  it("clears stats and resets counters to zero", () => {
    recordAgentUsage({
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      type: "cloud_model",
      inputTokens: 1000,
      outputTokens: 500,
    });
    expect(loadAgentUsageReport().lifetimeTotalTokens).toBe(1500);

    clearAgentUsageReport();
    const cleared = loadAgentUsageReport();
    expect(cleared.lifetimeTotalTokens).toBe(0);
    expect(cleared.lifetimeTotalRequests).toBe(0);
    expect(cleared.models["gemini-2.0-flash"].totalTokens).toBe(0);
  });
});

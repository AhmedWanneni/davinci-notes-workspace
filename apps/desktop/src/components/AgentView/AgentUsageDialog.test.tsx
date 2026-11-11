// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentUsageDialog } from "./AgentUsageDialog";
import { recordAgentUsage } from "./agentUsageTracker";

describe("AgentUsageDialog", () => {
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

  it("renders when open and displays summary statistics", () => {
    recordAgentUsage({
      id: "codex",
      name: "Codex CLI",
      type: "cli_agent",
      inputTokens: 1200,
      outputTokens: 800,
    });

    render(<AgentUsageDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Model & Agent Usage")).toBeTruthy();
    expect(screen.getByText("Total Requests")).toBeTruthy();
    expect(screen.getByText("Total Tokens")).toBeTruthy();
    expect(screen.getByText("Autonomous CLI Agents")).toBeTruthy();
    expect(screen.getByText("Cloud & Local Models")).toBeTruthy();
    expect(screen.getByText("Codex CLI")).toBeTruthy();
    expect(screen.getByText("2.0k tokens")).toBeTruthy();
  });

  it("resets statistics when clicking reset button", () => {
    recordAgentUsage({
      id: "agy",
      name: "Antigravity CLI (agy)",
      type: "cli_agent",
      inputTokens: 5000,
      outputTokens: 1000,
    });

    render(<AgentUsageDialog isOpen={true} onClose={vi.fn()} />);
    const resetBtn = screen.getByRole("button", { name: /reset stats/i });
    expect(resetBtn).toBeTruthy();

    fireEvent.click(resetBtn);
    expect(screen.getAllByText("0 tokens").length).toBeGreaterThan(0);
  });
});

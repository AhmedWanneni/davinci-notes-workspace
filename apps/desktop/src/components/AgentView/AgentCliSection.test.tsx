// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentCliSection } from "./AgentCliSection";
import * as cliBridge from "./cliAgentBridge";

vi.mock("./cliAgentBridge", () => ({
  detectCliAgents: vi.fn(),
}));

describe("AgentCliSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders detected agents list and handles selection", async () => {
    vi.mocked(cliBridge.detectCliAgents).mockResolvedValueOnce([
      {
        id: "agy",
        name: "Antigravity CLI (agy)",
        binary: "agy",
        installed: true,
        version: "1.0.0",
        description: "Agent",
        installCommand: "npm i -g @google/antigravity-cli",
      },
      {
        id: "claude",
        name: "Claude Code",
        binary: "claude",
        installed: false,
        description: "Agent",
        installCommand: "npm i -g @anthropic-ai/claude-code",
      },
    ]);

    const onSelect = vi.fn();
    render(
      <AgentCliSection selectedCliAgent={null} onSelectCliAgent={onSelect} />,
    );

    expect(await screen.findByText("Antigravity CLI (agy)")).toBeDefined();
    expect(screen.getByText("Claude Code")).toBeDefined();
    expect(screen.getByText("READY")).toBeDefined();
    expect(screen.getByText("NOT FOUND")).toBeDefined();

    fireEvent.click(screen.getByText("Antigravity CLI (agy)"));
    expect(onSelect).toHaveBeenCalledWith("agy");
  });
});

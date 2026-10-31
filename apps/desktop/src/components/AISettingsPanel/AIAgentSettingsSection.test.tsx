// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIAgentSettingsSection } from "./AIAgentSettingsSection";
import * as agentPrefs from "../AgentView/agentPreferences";

vi.mock("../AgentView/agentPreferences", () => ({
  loadAgentPreferences: vi.fn(),
  saveAgentPreference: vi.fn(),
}));

vi.mock("../../vault", () => ({
  getVaultIndexDb: vi.fn().mockResolvedValue({}),
  getSetting: vi.fn().mockResolvedValue("agy"),
  setSetting: vi.fn().mockResolvedValue(undefined),
  withDbLock: vi.fn((cb: () => unknown) => cb()),
}));

vi.mock("../AgentView/cliAgentBridge", () => ({
  detectCliAgents: vi.fn().mockResolvedValue([
    {
      id: "agy",
      name: "Antigravity CLI (agy)",
      binary: "agy",
      installed: true,
      version: "1.0.0",
      description: "Agent",
    },
  ]),
}));

describe("AIAgentSettingsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(agentPrefs.loadAgentPreferences).mockResolvedValue({
      autoApply: true,
      webSearchEnabled: true,
      rewriteEnabled: false,
    });
  });

  it("renders preferences and toggles auto-apply", async () => {
    render(<AIAgentSettingsSection />);

    expect(
      await screen.findByText("Agent Capabilities & Automation"),
    ).toBeDefined();
    expect(screen.getByText("Auto-apply Changes")).toBeDefined();
    expect(screen.getByText("Web Search")).toBeDefined();
    expect(screen.getByText("Prompt Optimization")).toBeDefined();

    const autoApplyCheckbox = screen.getByRole("checkbox", {
      name: "Auto-apply changes",
    });
    fireEvent.click(autoApplyCheckbox);

    await waitFor(() => {
      expect(agentPrefs.saveAgentPreference).toHaveBeenCalledWith(
        "autoApply",
        false,
      );
    });
  });
});

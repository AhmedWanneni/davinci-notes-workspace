// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentPromptModelPicker } from "./AgentPromptModelPicker";
import { useAgentStore } from "./useAgentStore";

describe("AgentPromptModelPicker", () => {
  it("renders trigger button with current model and power tier", () => {
    act(() => {
      useAgentStore.setState({
        selectedModel: "gemini-2.0-flash",
        selectedCliAgent: null,
        powerTier: "medium",
        isModelPickerOpen: false,
      });
    });
    render(<AgentPromptModelPicker />);

    expect(
      screen.getByRole("button", { name: /Select AI Model or Agent/i }),
    ).toBeTruthy();
    expect(screen.getByText(/Gemini 2.0 Flash Medium/i)).toBeTruthy();
  });

  it("opens popover and allows selecting a different model and power tier", () => {
    render(<AgentPromptModelPicker />);

    const btn = screen.getByRole("button", {
      name: /Select AI Model or Agent/i,
    });
    fireEvent.click(btn);

    expect(screen.getByText("Cloud Models")).toBeTruthy();
    expect(screen.getByText("High")).toBeTruthy();

    fireEvent.click(screen.getByText("High"));
    expect(useAgentStore.getState().powerTier).toBe("high");

    fireEvent.click(screen.getByText("Gemini 1.5 Pro"));
    expect(useAgentStore.getState().selectedModel).toBe("gemini-1.5-pro");
  });

  it("switches to agents tab and allows selecting a CLI agent", () => {
    render(<AgentPromptModelPicker />);

    const btn = screen.getByRole("button", {
      name: /Select AI Model or Agent/i,
    });
    fireEvent.click(btn);

    const agentsTab = screen.getByText("AI Agents");
    fireEvent.click(agentsTab);

    expect(screen.getByText("Available Agents")).toBeTruthy();
    expect(screen.getByText("Claude Code")).toBeTruthy();

    fireEvent.click(screen.getByText("Claude Code"));
    expect(useAgentStore.getState().selectedCliAgent).toBe("claude");
  });
});

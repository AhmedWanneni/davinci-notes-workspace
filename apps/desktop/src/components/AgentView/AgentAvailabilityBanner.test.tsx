// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentAvailabilityBanner } from "./AgentAvailabilityBanner";

vi.mock("../../ai/AISubsystem", () => ({
  AI_PROVIDER_NAMES: {
    gemini: "Google Gemini",
    "openai-compatible": "OpenAI-compatible cloud",
    openrouter: "OpenRouter",
    ollama: "Ollama (local server)",
  },
  loadAIProviderStatus: vi.fn().mockImplementation((provider) =>
    provider === "gemini" ? Promise.resolve("failed") : Promise.resolve("ready"),
  ),
  hasStoredProviderCredential: vi.fn().mockImplementation((provider) =>
    provider === "gemini" ? Promise.resolve(false) : Promise.resolve(true),
  ),
}));

vi.mock("./cliAgentBridge", () => ({
  detectCliAgents: vi.fn().mockResolvedValue([
    { id: "agy", installed: true, name: "Antigravity CLI (agy)" },
    { id: "codex", installed: false, name: "Codex CLI" },
  ]),
}));

describe("AgentAvailabilityBanner", () => {
  it("shows warning when selected CLI agent is not installed", async () => {
    render(
      <AgentAvailabilityBanner
        providerId="gemini"
        selectedCliAgent="codex"
      />,
    );

    const alertEl = await screen.findByRole("alert");
    expect(alertEl).toBeTruthy();
    expect(alertEl.textContent).toContain("Codex CLI");
    expect(alertEl.textContent).toContain("is not installed or not found in PATH");
  });

  it("shows warning when cloud provider is not configured", async () => {
    render(
      <AgentAvailabilityBanner
        providerId="gemini"
        selectedCliAgent={null}
        onOpenSettings={vi.fn()}
      />,
    );

    const alertEl = await screen.findByRole("alert");
    expect(alertEl).toBeTruthy();
    expect(alertEl.textContent).toContain("Google Gemini is not configured or offline");
    expect(screen.getByText(/Configure in Settings/i)).toBeTruthy();
  });

  it("renders nothing when provider is ready and installed", async () => {
    const { container } = render(
      <AgentAvailabilityBanner
        providerId="openai-compatible"
        selectedCliAgent={null}
      />,
    );

    await new Promise((r) => setTimeout(r, 60));
    expect(container.querySelector("[role='alert']")).toBeNull();
  });
});

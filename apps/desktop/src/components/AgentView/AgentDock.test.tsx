// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../ai/AISubsystem", () => ({
  saveSelectedProvider: vi.fn().mockResolvedValue(undefined),
  validateAndSaveProviderKey: vi.fn().mockResolvedValue(undefined),
  saveOllamaConfig: vi.fn().mockResolvedValue(undefined),
  saveProviderModels: vi.fn().mockResolvedValue(undefined),
  loadProviderModels: vi
    .fn()
    .mockResolvedValue({
      embeddingModel: "embeddinggemma",
      chatModel: "llama3:latest",
    }),
  fetchOllamaModels: vi.fn().mockResolvedValue(["llama3:latest"]),
}));

import { AgentChatInput } from "./AgentChatInput";
import { AgentModelSelect } from "./AgentModelSelect";
import { AgentCapabilitiesPopover } from "./AgentCapabilitiesPopover";
import { AgentSettingsPanel } from "./AgentSettingsPanel";

describe("Agent UI Controls", () => {
  it("renders input dock and triggers approval toggle", async () => {
    const onToggleAutoApply = vi.fn();
    const onSend = vi.fn();

    await act(async () => {
      render(
        <AgentChatInput
          onSend={onSend}
          isStreaming={false}
          autoApply={false}
          onToggleAutoApply={onToggleAutoApply}
          vaultName="research-vault"
          currentProvider="gemini"
          currentModel="gemini-2.0-flash"
          onSelectModel={vi.fn()}
          webSearchEnabled={true}
          onToggleWebSearch={vi.fn()}
          onOpenSettings={vi.fn()}
        />,
      );
    });

    expect(screen.getByText("Ask for approval")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("Ask for approval"));
    });
    expect(onToggleAutoApply).toHaveBeenCalledWith(true);
  });

  it("renders model select dropdown and changes model", async () => {
    const onSelect = vi.fn();
    await act(async () => {
      render(
        <AgentModelSelect
          currentModel="gemini-2.0-flash"
          currentProvider="gemini"
          onSelectModel={onSelect}
          onOpenSettings={vi.fn()}
        />,
      );
    });

    expect(screen.getByText(/Gemini 2\.0 Flash/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Gemini 2\.0 Flash/i }),
      );
    });
    expect(screen.getByText("OpenRouter: Claude 3.5 Haiku")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("OpenRouter: Claude 3.5 Haiku"));
    });
    expect(onSelect).toHaveBeenCalledWith(
      "anthropic/claude-3.5-haiku",
      "openrouter",
    );
  });

  it("renders capabilities popover and selects prompt preset", () => {
    const onSelect = vi.fn();
    render(
      <AgentCapabilitiesPopover
        isOpen={true}
        onClose={vi.fn()}
        onSelectCapability={onSelect}
      />,
    );

    expect(screen.getByText("What the Agent Can Do")).toBeTruthy();
    expect(screen.getByText("Create Summary or To-Do")).toBeTruthy();

    fireEvent.click(screen.getByText("Create Summary or To-Do"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.stringContaining(
        "Scan my recent notes and create a prioritized to-do list",
      ),
    );
  });

  it("renders shortcuts inside capabilities popover when provided", () => {
    const onSelect = vi.fn();
    render(
      <AgentCapabilitiesPopover
        isOpen={true}
        onClose={vi.fn()}
        onSelectCapability={onSelect}
        shortcuts={[
          {
            id: "daily",
            title: "Daily Review",
            prompt: "Prepare daily note",
            description: "Daily review shortcut",
          },
        ]}
      />,
    );

    expect(screen.getByText("Quick Shortcuts")).toBeTruthy();
    expect(screen.getByText("Daily Review")).toBeTruthy();
    expect(screen.getByText("Daily review shortcut")).toBeTruthy();

    fireEvent.click(screen.getByText("Daily Review"));
    expect(onSelect).toHaveBeenCalledWith("Prepare daily note");
  });

  it("renders on-page settings panel and toggles provider", async () => {
    const onClose = vi.fn();
    const onProviderChanged = vi.fn();

    await act(async () => {
      render(
        <AgentSettingsPanel
          isOpen={true}
          onClose={onClose}
          currentProvider="gemini"
          onProviderChanged={onProviderChanged}
          webSearchEnabled={true}
          onToggleWebSearch={vi.fn()}
          autoApply={false}
          onToggleAutoApply={vi.fn()}
        />,
      );
    });

    expect(screen.getByText("Agent Settings")).toBeTruthy();
    expect(screen.getByText("Google Gemini")).toBeTruthy();
    expect(screen.getByText("Local Ollama")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("Local Ollama"));
    });
    expect(screen.getByText("Ollama Server Endpoint")).toBeTruthy();
  });
});

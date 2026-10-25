// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AgentSettingsPanel } from "./AgentSettingsPanel";
import { useAgentExecution } from "./useAgentExecution";
import { renderHook } from "@testing-library/react";

const mockCreateConfiguredProvider = vi.fn();
const mockSaveSelectedProvider = vi.fn();
const mockSaveProviderModels = vi.fn();
const mockSaveOllamaConfig = vi.fn();
const mockValidateAndSaveProviderKey = vi.fn();

vi.mock("../../ai/AISubsystem", () => ({
  loadSelectedProvider: vi.fn().mockResolvedValue("gemini"),
  loadAIProviderStatus: vi.fn().mockResolvedValue("ready"),
  loadProviderModels: vi.fn().mockResolvedValue({
    embeddingModel: "gemini-embedding-001",
    chatModel: "gemini-2.0-flash",
  }),
  loadOllamaBaseUrl: vi.fn().mockResolvedValue("http://localhost:11434"),
  fetchOllamaModels: vi.fn().mockResolvedValue(["llama3:latest"]),
  createConfiguredProvider: (...args: unknown[]) =>
    mockCreateConfiguredProvider(...args),
  saveSelectedProvider: (...args: unknown[]) =>
    mockSaveSelectedProvider(...args),
  saveProviderModels: (...args: unknown[]) => mockSaveProviderModels(...args),
  validateAndSaveProviderKey: (...args: unknown[]) =>
    mockValidateAndSaveProviderKey(...args),
  saveOllamaConfig: (...args: unknown[]) => mockSaveOllamaConfig(...args),
}));

vi.mock("./desktopAgentBridge", () => ({
  createDesktopInspectionBackend: () => ({
    listPaths: vi.fn().mockResolvedValue({ files: [], folders: [] }),
    readNote: vi.fn().mockResolvedValue(""),
    searchFts: vi.fn().mockResolvedValue([]),
    getStructure: vi
      .fn()
      .mockResolvedValue({ folders: [], tags: [], totalNotes: 0 }),
  }),
  createDesktopMutationBackend: () => ({
    readNote: vi.fn().mockResolvedValue(null),
    writeNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    moveNote: vi.fn().mockResolvedValue(undefined),
  }),
  createDesktopWebSearchBackend: () => ({
    search: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  readNote: vi.fn().mockRejectedValue(new Error("File not found")),
  writeNote: vi.fn().mockResolvedValue(undefined),
}));

describe("Agent Settings & Runtime Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates and saves model when user changes provider and model in settings panel", async () => {
    const onProviderChanged = vi.fn();
    const onModelChanged = vi.fn();

    render(
      <AgentSettingsPanel
        isOpen={true}
        onClose={vi.fn()}
        currentProvider="gemini"
        onProviderChanged={onProviderChanged}
        currentModel="gemini-2.0-flash"
        onModelChanged={onModelChanged}
        webSearchEnabled={true}
        onToggleWebSearch={vi.fn()}
        autoApply={false}
        onToggleAutoApply={vi.fn()}
      />,
    );

    // Switch to Local Ollama
    const ollamaBtn = screen.getByText("Local Ollama");
    await act(async () => {
      fireEvent.click(ollamaBtn);
    });

    // Change model select
    const select = screen.getByLabelText("Select AI Model");
    expect(screen.getByText("llama3:latest")).toBeTruthy();
    fireEvent.change(select, { target: { value: "llama3:latest" } });

    // Test & Save Connection
    const saveBtn = screen.getByText("Test & Save Connection");
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(mockSaveSelectedProvider).toHaveBeenCalledWith("ollama");
    expect(mockSaveOllamaConfig).toHaveBeenCalledWith(
      "http://localhost:11434",
      "embeddinggemma",
      "llama3:latest",
    );
    expect(onProviderChanged).toHaveBeenCalledWith("ollama");
    expect(onModelChanged).toHaveBeenCalledWith("llama3:latest");
    expect(screen.getByText("Successfully connected and saved!")).toBeTruthy();
  });

  it("propagates selected model to createConfiguredProvider during execution", async () => {
    const completeMock = vi.fn().mockResolvedValue({
      content: "Execution completed with chosen model",
      toolCalls: [],
    });
    mockCreateConfiguredProvider.mockResolvedValue({
      complete: completeMock,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        providerId: "openrouter",
        model: "anthropic/claude-3.5-haiku",
        webSearchEnabled: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("Tell me about my notes");
    });

    expect(mockCreateConfiguredProvider).toHaveBeenCalledWith(
      "openrouter",
      "anthropic/claude-3.5-haiku",
    );
    expect(completeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: expect.arrayContaining([
          expect.objectContaining({ name: "web_search" }),
        ]),
      }),
    );
  });

  it("omits web_search tool when webSearchEnabled is false", async () => {
    const completeMock = vi.fn().mockResolvedValue({
      content: "Done",
      toolCalls: [],
    });
    mockCreateConfiguredProvider.mockResolvedValue({
      complete: completeMock,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        providerId: "gemini",
        model: "gemini-1.5-pro",
        webSearchEnabled: false,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("Summarize");
    });

    const toolsArg = completeMock.mock.calls[0][0].tools;
    const hasWebSearch = toolsArg.some(
      (t: { name: string }) => t.name === "web_search",
    );
    expect(hasWebSearch).toBe(false);
  });

  it("autonomously executes inspection tool calls and feeds results back to model", async () => {
    const completeMock = vi
      .fn()
      .mockResolvedValueOnce({
        content: "",
        toolCalls: [
          {
            id: "call_read_1",
            name: "read_note",
            arguments: { path: "Notes/Tasks.md" },
          },
        ],
      })
      .mockResolvedValueOnce({
        content:
          "Here is your summary of accomplishments: You finished design, and need to write tests.",
        toolCalls: [],
      });

    mockCreateConfiguredProvider.mockResolvedValue({
      complete: completeMock,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        providerId: "ollama",
        model: "llama3:latest",
        vaultName: "my-vault",
      }),
    );

    await act(async () => {
      await result.current.sendMessage("Review my notes and generate a summary");
    });

    expect(completeMock).toHaveBeenCalledTimes(2);

    const firstCallMessages = completeMock.mock.calls[0][0].messages;
    expect(firstCallMessages[0].role).toBe("system");
    expect(firstCallMessages[0].content).toContain("FULL, DEFAULT, UNRESTRICTED PERMISSION");
    expect(firstCallMessages[0].content).toContain("my-vault");

    const secondCallMessages = completeMock.mock.calls[1][0].messages;
    const toolMsg = secondCallMessages.find(
      (m: { role: string }) => m.role === "tool",
    );
    expect(toolMsg).toBeDefined();
    expect(toolMsg.name).toBe("read_note");

    const assistantMsg = result.current.messages.find(
      (m) => m.role === "assistant",
    );
    expect(assistantMsg?.content).toContain(
      "Here is your summary of accomplishments",
    );
  });
});

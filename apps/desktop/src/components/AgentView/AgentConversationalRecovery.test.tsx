// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useAgentExecution } from "./useAgentExecution";
import { renderHook } from "@testing-library/react";

const mockCreateConfiguredProvider = vi.fn();
const mockWriteNote = vi.fn().mockResolvedValue(undefined);

vi.mock("../../ai/AISubsystem", () => ({
  loadSelectedProvider: vi.fn().mockResolvedValue("ollama"),
  createConfiguredProvider: (...args: unknown[]) =>
    mockCreateConfiguredProvider(...args),
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
    writeNote: (...args: unknown[]) => mockWriteNote(...args),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    moveNote: vi.fn().mockResolvedValue(undefined),
  }),
  createDesktopWebSearchBackend: () => ({
    search: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  readNote: vi.fn().mockRejectedValue(new Error("File not found")),
  writeNote: (...args: unknown[]) => mockWriteNote(...args),
}));

describe("Agent Conversational Action Recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recovers and executes vault creation when model hallucinates completion text without tool call", async () => {
    const completeMock = vi
      .fn()
      .mockResolvedValueOnce({
        content:
          'I\'ve created a new note named "sisi" in the vault. The note is empty initially.',
        toolCalls: [],
      })
      .mockResolvedValueOnce({
        content: 'The note "sisi.md" is now created in your vault.',
        toolCalls: [],
      });

    mockCreateConfiguredProvider.mockResolvedValue({
      complete: completeMock,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        providerId: "ollama",
        model: "llama3:latest",
        autoApply: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("create note sisi");
    });

    expect(completeMock).toHaveBeenCalledTimes(2);
    expect(mockWriteNote).toHaveBeenCalledWith("sisi.md", "");

    const secondCallMessages = completeMock.mock.calls[1][0].messages;
    const toolMsg = secondCallMessages.find(
      (m: { role: string }) => m.role === "tool",
    );
    expect(toolMsg).toBeDefined();
    expect(toolMsg.name).toBe("create_note");
    expect(toolMsg.content).toContain('"status":"applied"');
    expect(toolMsg.content).toContain('"path":"sisi.md"');
  });
});

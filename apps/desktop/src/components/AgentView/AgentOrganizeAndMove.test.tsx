// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";

const mockComplete = vi.fn();
const mockMoveNote = vi.fn().mockResolvedValue(undefined);
const mockCreateFolder = vi.fn().mockResolvedValue(undefined);
const mockWriteNote = vi.fn().mockResolvedValue(undefined);
const mockReadNote = vi.fn().mockImplementation((path: string) => {
  if (path === "ideas.md") return Promise.resolve("# My Great Ideas\n1. Project Apollo");
  return Promise.resolve(null);
});

vi.mock("../../ai/AISubsystem", () => ({
  loadSelectedProvider: vi.fn().mockResolvedValue("ollama"),
  createConfiguredProvider: vi.fn().mockImplementation(() => ({
    complete: mockComplete,
  })),
}));

vi.mock("../../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      vaultPath: "/test/vault",
      allNotePaths: ["ideas.md", "meeting.md"],
      allFolderPaths: [],
    }),
  },
}));

vi.mock("./desktopAgentBridge", () => ({
  createDesktopInspectionBackend: () => ({
    listPaths: vi.fn().mockResolvedValue({ files: ["ideas.md", "meeting.md"], folders: [] }),
    readNote: (...args: unknown[]) => mockReadNote(...args),
  }),
  createDesktopMutationBackend: () => ({
    writeNote: (...args: unknown[]) => mockWriteNote(...args),
    readNote: (...args: unknown[]) => mockReadNote(...args),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    renameNote: vi.fn().mockResolvedValue(undefined),
    moveNote: (...args: unknown[]) => mockMoveNote(...args),
    createFolder: (...args: unknown[]) => mockCreateFolder(...args),
  }),
  createDesktopWebSearchBackend: () => ({
    search: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  writeNote: (...args: unknown[]) => mockWriteNote(...args),
  createFolder: (...args: unknown[]) => mockCreateFolder(...args),
  moveNote: (...args: unknown[]) => mockMoveNote(...args),
  readNote: (...args: unknown[]) => mockReadNote(...args),
}));

describe("Agent Organize Existing Files Into Folder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identifies organize intent, injects existing notes into prompt, creates folder and moves file", async () => {
    // Call 0: Rewrite step
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Create folder Work and put ideas.md in it",
        intent: "organize",
        target: "Work",
        constraints: [],
        ambiguities: [],
      }),
    });

    // Call 1: Model tool calls: create_folder then move_note
    mockComplete.mockResolvedValueOnce({
      content: "I will create folder Work and move ideas.md into it.",
      toolCalls: [
        {
          id: "call_folder_1",
          name: "create_folder",
          arguments: { path: "Work" },
        },
        {
          id: "call_move_1",
          name: "move_note",
          arguments: { fromPath: "ideas.md", toPath: "Work" },
        },
      ],
    });

    // Call 2: Model final response
    mockComplete.mockResolvedValueOnce({
      content: "Folder Work created and ideas.md moved into it.",
      toolCalls: [],
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        providerId: "ollama",
        model: "llama3:latest",
        rewriteEnabled: true,
        autoApply: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("create a folder named Work and put ideas.md in it");
    });

    // Verify system prompt in the main turn contained the existing notes in the vault
    const mainTurnPayload = mockComplete.mock.calls[1][0];
    const systemPrompt = mainTurnPayload.messages[0].content;
    expect(systemPrompt).toContain("EXISTING NOTES IN VAULT:");
    expect(systemPrompt).toContain("ideas.md");

    // Verify create_folder was executed directly
    expect(mockCreateFolder).toHaveBeenCalledWith("Work");

    // Verify move_note was staged (move is a destructive action requiring confirmation per ADR-0221)
    expect(result.current.stagedChanges.length).toBe(1);
    const stagedMove = result.current.stagedChanges[0];
    expect(stagedMove.toolName).toBe("move_note");
    expect(stagedMove.plan.changeRecord.fromPath).toBe("ideas.md");
    expect(stagedMove.plan.changeRecord.path).toBe("Work/ideas.md");
    expect(stagedMove.status).toBe("pending");

    // Apply the staged move
    await act(async () => {
      await result.current.handleApplyChange(stagedMove);
    });

    // Verify moveNote backend was invoked with normalized destination
    expect(mockMoveNote).toHaveBeenCalledWith("ideas.md", "Work/ideas.md");
  });
});

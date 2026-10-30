// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";

const mockComplete = vi.fn();
const mockWriteNote = vi.fn();
const mockDeleteNote = vi.fn();

vi.mock("../../ai/AISubsystem", () => ({
  loadSelectedProvider: vi.fn().mockResolvedValue("gemini"),
  createConfiguredProvider: vi.fn().mockImplementation(() => ({
    complete: mockComplete,
  })),
}));

vi.mock("../../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      vaultPath: "/test/vault",
      allNotePaths: ["notes.md"],
      allFolderPaths: [],
    }),
  },
}));

vi.mock("./desktopAgentBridge", () => ({
  createDesktopInspectionBackend: () => ({
    listPaths: vi.fn().mockResolvedValue({ files: [], folders: [] }),
    readNote: vi.fn().mockResolvedValue(""),
  }),
  createDesktopMutationBackend: () => ({
    writeNote: (...args: unknown[]) => mockWriteNote(...args),
    readNote: vi.fn().mockResolvedValue(""),
    deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
    renameNote: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
  }),
  createDesktopWebSearchBackend: () => ({
    search: vi.fn().mockResolvedValue([]),
  }),
}));

describe("Agent Clarify Rule Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks ONE short clarifying question instead of acting when target is vague or ambiguous", async () => {
    // 1st call: rewrite step receives vague prompt and outputs ambiguities
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "that note about the thing from last week",
        intent: "read_note",
        target: null,
        constraints: ["last week"],
        ambiguities: ["Unspecified note title", "Vague target reference"],
      }),
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("that note about the thing from last week");
    });

    // Verify only the rewrite call occurred, NO tool execution or second model call
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockWriteNote).not.toHaveBeenCalled();
    expect(mockDeleteNote).not.toHaveBeenCalled();

    // Verify assistant responded with ONE clarifying question
    expect(result.current.messages.length).toBe(2);
    const assistantMsg = result.current.messages[1];
    expect(assistantMsg.role).toBe("assistant");
    expect(assistantMsg.content).toContain("Could you specify which note you are referring to?");
  });
});

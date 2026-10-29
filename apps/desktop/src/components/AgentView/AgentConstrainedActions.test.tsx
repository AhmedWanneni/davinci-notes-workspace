// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";

const mockComplete = vi.fn();
const mockDeleteNote = vi.fn();
const mockWriteNote = vi.fn();

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
      allNotePaths: ["Work/Meeting.md", "Personal/Ideas.md"],
      allFolderPaths: ["Work", "Personal"],
    }),
  },
}));

vi.mock("./desktopAgentBridge", () => ({
  createDesktopInspectionBackend: () => ({
    listPaths: vi.fn().mockResolvedValue({ files: [], folders: [] }),
    readNote: vi.fn().mockResolvedValue("Existing content"),
  }),
  createDesktopMutationBackend: () => ({
    writeNote: (...args: unknown[]) => mockWriteNote(...args),
    readNote: vi.fn().mockResolvedValue("Existing content"),
    deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
    renameNote: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
  }),
  createDesktopWebSearchBackend: () => ({
    search: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  writeNote: vi.fn().mockResolvedValue(undefined),
  readNote: vi.fn().mockResolvedValue({ content: "Existing content" }),
}));

describe("Agent Constrained Actions & Destructive Confirmation Gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unknown actions not in allowed list without executing them", async () => {
    mockComplete.mockResolvedValueOnce({
      content: "Running arbitrary script",
      toolCalls: [
        {
          id: "call_bad_1",
          name: "system_shell_exec",
          arguments: { command: "rm -rf /" },
        },
      ],
    });

    mockComplete.mockResolvedValueOnce({
      content: "I cannot execute that.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        autoApply: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("run this shell script");
    });

    // Verify system_shell_exec was rejected and not executed
    expect(mockDeleteNote).not.toHaveBeenCalled();
    expect(mockWriteNote).not.toHaveBeenCalled();

    // Verify rejection error was passed back in history to model
    const secondCallToolMsg = mockComplete.mock.calls[1][0].messages[3];
    expect(secondCallToolMsg.role).toBe("tool");
    expect(secondCallToolMsg.content).toContain("Rejected action");
    expect(secondCallToolMsg.content).toContain("is not in the allowed actions list");
  });

  it("gates destructive delete_note behind user confirmation even when autoApply is true", async () => {
    mockComplete.mockResolvedValueOnce({
      content: "Deleting work notes.",
      toolCalls: [
        {
          id: "call_del_1",
          name: "delete_note",
          arguments: { path: "Work/Meeting.md" },
        },
      ],
    });

    mockComplete.mockResolvedValueOnce({
      content: "Action staged for confirmation.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        autoApply: true, // autoApply is enabled!
      }),
    );

    await act(async () => {
      await result.current.sendMessage("delete everything about work");
    });

    // Verify deleteNote was NOT called on filesystem
    expect(mockDeleteNote).not.toHaveBeenCalled();

    // Verify it was staged with status: 'pending'
    expect(result.current.stagedChanges.length).toBe(1);
    expect(result.current.stagedChanges[0].toolName).toBe("delete_note");
    expect(result.current.stagedChanges[0].status).toBe("pending");
    expect(result.current.stagedChanges[0].plan.changeRecord.path).toBe("Work/Meeting.md");
  });
});

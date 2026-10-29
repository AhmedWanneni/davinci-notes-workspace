// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";

const mockComplete = vi.fn();

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
      allNotePaths: ["ideas.md"],
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
    writeNote: vi.fn().mockResolvedValue(undefined),
    readNote: vi.fn().mockResolvedValue(""),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    renameNote: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
  }),
  createDesktopWebSearchBackend: () => ({
    search: vi.fn().mockResolvedValue([]),
  }),
}));

describe("Agent Rewrite Step Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes rewrite step when rewriteEnabled is true and populates lastStructuredRequest", async () => {
    // 1st call: rewrite step
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Find notes about rust",
        intent: "search_vault",
        target: "rust",
        constraints: [],
        ambiguities: [],
      }),
    });

    // 2nd call: main agent ReAct execution
    mockComplete.mockResolvedValueOnce({
      content: "Here are your rust notes.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
      }),
    );

    const start = performance.now();
    await act(async () => {
      await result.current.sendMessage("find my rust notes");
    });
    const duration = performance.now() - start;

    expect(mockComplete).toHaveBeenCalledTimes(2);
    expect(result.current.lastStructuredRequest).toEqual({
      goal: "Find notes about rust",
      intent: "search_vault",
      target: "rust",
      constraints: [],
      ambiguities: [],
    });
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it("retries rewrite step once on malformed JSON before proceeding", async () => {
    // 1st call: malformed JSON
    mockComplete.mockResolvedValueOnce({
      content: "I didn't format this as json",
    });

    // 2nd call: successful retry of rewrite step
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Read project plan",
        intent: "read_note",
        target: "Plan.md",
        constraints: [],
        ambiguities: [],
      }),
    });

    // 3rd call: main agent execution
    mockComplete.mockResolvedValueOnce({
      content: "Here is your plan.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("open the project plan");
    });

    // 2 rewrite calls + 1 main call = 3 total calls
    expect(mockComplete).toHaveBeenCalledTimes(3);
    expect(result.current.lastStructuredRequest?.intent).toBe("read_note");
    expect(result.current.lastStructuredRequest?.target).toBe("Plan.md");
  });
});

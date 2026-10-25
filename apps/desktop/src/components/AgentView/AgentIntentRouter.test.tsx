// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";

const mockComplete = vi.fn();

vi.mock("../../vault/vaultCommands", () => ({
  writeNote: vi.fn().mockResolvedValue(undefined),
  readNote: vi.fn().mockResolvedValue({ content: "" }),
}));

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

describe("Agent Intent Router Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes create_note intent and provides scoped creation prompt & tools", async () => {
    // 1st call: rewrite step returns create_note
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Create a note for recipes",
        intent: "create_note",
        target: "recipes.md",
        constraints: [],
        ambiguities: [],
      }),
    });

    // 2nd call: main agent call with structured tool call
    mockComplete.mockResolvedValueOnce({
      content: "Creating your note.",
      toolCalls: [
        {
          id: "call_create_1",
          name: "create_note",
          arguments: { path: "recipes.md", content: "" },
        },
      ],
    });

    // 3rd call: confirmation after tool result
    mockComplete.mockResolvedValueOnce({
      content: "Created recipes.md.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("create a note for recipes");
    });

    expect(mockComplete).toHaveBeenCalledTimes(3);

    // Verify 2nd call used the scoped create_note system prompt and tools
    const mainCallPayload = mockComplete.mock.calls[1][0];
    const systemPrompt = mainCallPayload.messages[0].content;
    expect(systemPrompt).toContain("creating notes, folders, and content");
    expect(systemPrompt).not.toContain("FULL, DEFAULT, UNRESTRICTED PERMISSION");

    const toolNames = mainCallPayload.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("create_note");
    expect(toolNames).toContain("create_folder");
    expect(toolNames).not.toContain("delete_note");
  });

  it("routes search_vault intent and omits mutation tools", async () => {
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Search vault for meeting notes",
        intent: "search_vault",
        target: "meeting",
        constraints: [],
        ambiguities: [],
      }),
    });

    mockComplete.mockResolvedValueOnce({
      content: "Found 2 matching notes.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("find meeting notes");
    });

    const mainCallPayload = mockComplete.mock.calls[1][0];
    const toolNames = mainCallPayload.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("search_vault");
    expect(toolNames).toContain("list_vault_tree");
    expect(toolNames).not.toContain("create_note");
    expect(toolNames).not.toContain("edit_note");
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";
import { AGENT_MEMORY_PATH } from "@app/ai-agent";

const mockComplete = vi.fn();
const mockWriteNote = vi.fn();
const mockReadNote = vi.fn();
const mockSearch = vi.fn();

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
      allFolderPaths: ["books"],
    }),
  },
}));

vi.mock("./desktopAgentBridge", () => ({
  createDesktopInspectionBackend: () => ({
    listPaths: vi.fn().mockResolvedValue({ files: [], folders: [] }),
    readNote: (...args: unknown[]) => mockReadNote(...args),
  }),
  createDesktopMutationBackend: () => ({
    writeNote: (...args: unknown[]) => mockWriteNote(...args),
    readNote: (...args: unknown[]) => mockReadNote(...args),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    renameNote: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
  }),
  createDesktopWebSearchBackend: () => ({
    search: (...args: unknown[]) => mockSearch(...args),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  writeNote: vi.fn().mockResolvedValue(undefined),
  readNote: vi.fn().mockResolvedValue({ content: "" }),
}));

describe("Agent Search Content In Note & Long-Term Memory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("populates search results into the created note even when model passes empty content", async () => {
    mockSearch.mockResolvedValueOnce([
      { title: "Dune by Frank Herbert", snippet: "Sci-fi epic on Arrakis", url: "https://dune.org" },
      { title: "Foundation by Isaac Asimov", snippet: "Galactic empire collapse", url: "https://foundation.org" },
    ]);

    // Turn 1: Rewrite step
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Search for sci-fi books and save to books/scifi.md",
        intent: "create_note",
        target: "books/scifi.md",
        constraints: [],
        ambiguities: [],
      }),
    });

    // Turn 2: Model calls web_search
    mockComplete.mockResolvedValueOnce({
      content: "Searching for sci-fi books...",
      toolCalls: [
        {
          id: "call_web_1",
          name: "web_search",
          arguments: { query: "sci-fi books" },
        },
      ],
    });

    // Turn 3: Model calls create_note with EMPTY content
    mockComplete.mockResolvedValueOnce({
      content: "Creating the note.",
      toolCalls: [
        {
          id: "call_create_1",
          name: "create_note",
          arguments: { path: "books/scifi.md", content: "" }, // <--- empty content from weak model!
        },
      ],
    });

    // Turn 4: Final confirmation
    mockComplete.mockResolvedValueOnce({
      content: "Note created with book list.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
        webSearchEnabled: true,
        autoApply: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("search for sci-fi books and put them in note books/scifi.md");
    });

    // Verify search was invoked
    expect(mockSearch).toHaveBeenCalledWith("sci-fi books", 5);

    // Verify note was written WITH the search content, NOT empty!
    expect(mockWriteNote).toHaveBeenCalled();
    const writeCalls = mockWriteNote.mock.calls;
    const noteCall = writeCalls.find((c) => c[0] === "books/scifi.md");
    expect(noteCall).toBeDefined();
    const writtenBody = String(noteCall![1]);
    expect(writtenBody).toContain("Dune by Frank Herbert");
    expect(writtenBody).toContain("Sci-fi epic on Arrakis");
    expect(writtenBody).toContain("Foundation by Isaac Asimov");
  });

  it("stores facts to long-term memory via save_memory tool and injects them into system prompt", async () => {
    let savedMemoryJson = "";
    mockReadNote.mockImplementation((path) => {
      if (path === AGENT_MEMORY_PATH) return Promise.resolve(savedMemoryJson);
      return Promise.resolve("");
    });
    mockWriteNote.mockImplementation((path, content) => {
      if (path === AGENT_MEMORY_PATH) savedMemoryJson = content;
      return Promise.resolve();
    });

    // 1st Turn: user asks to remember a preference
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "Remember that user loves Rust",
        intent: "chat",
        target: null,
        constraints: [],
        ambiguities: [],
      }),
    });

    mockComplete.mockResolvedValueOnce({
      content: "I will remember that.",
      toolCalls: [
        {
          id: "call_mem_1",
          name: "save_memory",
          arguments: { content: "User loves Rust programming", category: "preference" },
        },
      ],
    });

    mockComplete.mockResolvedValueOnce({
      content: "I remembered that you love Rust.",
      toolCalls: undefined,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        rewriteEnabled: true,
        autoApply: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage("remember that I love Rust programming");
    });

    // Verify memory was saved
    expect(savedMemoryJson).toContain("User loves Rust programming");

    // 2nd Turn: Subsequent prompt must have memory injected
    mockComplete.mockResolvedValueOnce({
      content: JSON.stringify({
        goal: "What language do I like?",
        intent: "chat",
        target: null,
        constraints: [],
        ambiguities: [],
      }),
    });

    mockComplete.mockResolvedValueOnce({
      content: "You love Rust!",
      toolCalls: undefined,
    });

    await act(async () => {
      await result.current.sendMessage("what language do I like?");
    });

    // Verify 2nd turn system prompt contained the remembered fact
    const secondTurnPayload = mockComplete.mock.calls[4][0];
    const systemPrompt = secondTurnPayload.messages[0].content;
    expect(systemPrompt).toContain("AGENT LONG-TERM MEMORY");
    expect(systemPrompt).toContain("User loves Rust programming");
  });
});

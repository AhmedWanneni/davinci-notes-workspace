// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useAgentExecution } from "./useAgentExecution";
import { renderHook } from "@testing-library/react";

const mockCreateConfiguredProvider = vi.fn();
const mockWriteNote = vi.fn().mockResolvedValue(undefined);
const mockCreateFolder = vi.fn().mockResolvedValue(undefined);
const mockSearch = vi
  .fn()
  .mockResolvedValue([{ title: "1984", snippet: "Classic dystopian book" }]);

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
    createFolder: (...args: unknown[]) => mockCreateFolder(...args),
  }),
  createDesktopWebSearchBackend: () => ({
    search: (...args: unknown[]) => mockSearch(...args),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  readNote: vi.fn().mockRejectedValue(new Error("File not found")),
  writeNote: (...args: unknown[]) => mockWriteNote(...args),
  createFolder: (...args: unknown[]) => mockCreateFolder(...args),
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

  it("creates a note file (not a folder) when user says 'create a file named sisi'", async () => {
    const completeMock = vi
      .fn()
      .mockResolvedValueOnce({
        content:
          'I\'ve created a new file named "sisi" in the vault. The note is empty initially.',
        toolCalls: [],
      })
      .mockResolvedValueOnce({
        content: 'The file "sisi.md" is now created in your vault.',
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
      await result.current.sendMessage("create a file named sisi");
    });

    expect(completeMock).toHaveBeenCalledTimes(2);
    expect(mockWriteNote).toHaveBeenCalledWith("sisi.md", "");
  });

  it("handles multi-step compound request: creates folder, searches web, and never creates note named 'having'", async () => {
    const completeMock = vi
      .fn()
      .mockResolvedValueOnce({
        content:
          "I will create a folder named books and search the web for books, then add the note.",
        toolCalls: [],
      })
      .mockResolvedValueOnce({
        content:
          'I have created the folder "books", searched the web, and created "books/Books.md" with the book list.',
        toolCalls: [
          {
            id: "call_final_note",
            name: "create_note",
            arguments: {
              path: "books/Books.md",
              content: "# Book List\n1. 1984 by George Orwell",
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        content: "Everything is completed.",
        toolCalls: [],
      });

    mockCreateConfiguredProvider.mockResolvedValue({
      complete: completeMock,
    });

    const { result } = renderHook(() =>
      useAgentExecution({
        providerId: "ollama",
        model: "llama3:latest",
        webSearchEnabled: true,
        autoApply: true,
      }),
    );

    await act(async () => {
      await result.current.sendMessage(
        "create a folder named books and search for books in internet and under that folder create note hacing the list of the books.",
      );
    });

    // Verify folder 'books' was created
    expect(mockCreateFolder).toHaveBeenCalledWith("books");

    // Verify web search was called with 'books'
    expect(mockSearch).toHaveBeenCalledWith("books", 5);

    // Verify note was created under 'books/Books.md'
    expect(mockWriteNote).toHaveBeenCalledWith(
      "books/Books.md",
      "# Book List\n1. 1984 by George Orwell",
    );

    // Verify NO note named 'having.md' or 'hacing.md' was ever created
    const writeCalls = mockWriteNote.mock.calls.map((c) => String(c[0]));
    expect(writeCalls.some((p) => p.includes("having"))).toBe(false);
    expect(writeCalls.some((p) => p.includes("hacing"))).toBe(false);
  });
});

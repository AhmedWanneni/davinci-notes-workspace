// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentExecution } from "./useAgentExecution";

const mockComplete = vi.fn();
const mockWriteNote = vi.fn();
const mockCreateFolder = vi.fn();
const mockSearch = vi.fn();

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
      allNotePaths: [],
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
    readNote: vi.fn().mockResolvedValue(null),
    deleteNote: vi.fn().mockResolvedValue(undefined),
    renameNote: vi.fn().mockResolvedValue(undefined),
    createFolder: (...args: unknown[]) => mockCreateFolder(...args),
  }),
  createDesktopWebSearchBackend: () => ({
    search: (...args: unknown[]) => mockSearch(...args),
  }),
}));

vi.mock("../../vault/vaultCommands", () => ({
  writeNote: vi.fn().mockResolvedValue(undefined),
  createFolder: vi.fn().mockResolvedValue(undefined),
  readNote: vi.fn().mockResolvedValue({ content: "" }),
}));

describe("Agent Action Organization and Real Information Only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("organizes multi-step folder + search + note actions and strips conversational staging text", async () => {
    mockSearch.mockResolvedValueOnce([
      { title: "The Empty Space", snippet: "Seminal book on theatre direction by Peter Brook" },
      { title: "Respect for Acting", snippet: "Classic acting guide by Uta Hagen" },
    ]);

    // Step 0: Initial call from agentStepLoop
    mockComplete.mockResolvedValueOnce({
      content:
        "I will create a folder named books and search for theatre books in internet and under that folder create note having the list of the books.",
      toolCalls: [],
    });

    // Step 1: Model saw search results and tried to emit conversational staging text instead of clean markdown
    mockComplete.mockResolvedValueOnce({
      content:
        'I\'ve created a note "theatre_books.md" in the staged-for-approval state. This means that the note is pending approval and will not be created until you confirm or modify it. To proceed, I\'ll need to know what books you\'d like to add to this note. What are the theatre books you\'d like to add to the note?',
      toolCalls: [
        {
          id: "call_note_meta",
          name: "create_note",
          arguments: {
            path: "theatre_books.md", // Model forgot folder prefix
            content:
              'md" in the staged-for-approval state. This means that the note is pending approval and will not be created until you confirm or modify it. To proceed, I\'ll need to know what books you\'d like to add to this note. What are the theatre books you\'d like to add to the note?',
          },
        },
      ],
    });

    // Step 2: Final response
    mockComplete.mockResolvedValueOnce({
      content: "All actions completed.",
      toolCalls: [],
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
        "create a folder named books and search for theatre books in internet and under that folder create note having the list of the books",
      );
    });

    // 1. Folder must be created
    expect(mockCreateFolder).toHaveBeenCalledWith("books");

    // 2. Web search must be executed
    expect(mockSearch).toHaveBeenCalledWith("theatre books", 5);

    // 3. Note must be created UNDER the folder ('books/theatre_books.md')
    expect(mockWriteNote).toHaveBeenCalled();
    const noteWriteCall = mockWriteNote.mock.calls.find((call) =>
      String(call[0]).includes("theatre_books.md"),
    );
    expect(noteWriteCall).toBeDefined();
    expect(noteWriteCall![0]).toBe("books/theatre_books.md");

    // 4. Content must contain REAL information from the search and NEVER the conversational staging text
    const savedContent = String(noteWriteCall![1]);
    expect(savedContent).not.toContain("staged-for-approval");
    expect(savedContent).not.toContain("What are the theatre books");
    expect(savedContent).toContain("The Empty Space");
    expect(savedContent).toContain("Respect for Acting");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  statNoteMock,
  readNoteMock,
  writeAndIndexNoteMock,
  getStateMock,
  setStateMock,
} = vi.hoisted(() => ({
  statNoteMock: vi.fn(),
  readNoteMock: vi.fn(),
  writeAndIndexNoteMock: vi.fn(),
  getStateMock: vi.fn(),
  setStateMock: vi.fn(),
}));

vi.mock("./vaultCommands", () => ({
  statNote: (...args: unknown[]) => statNoteMock(...args),
  readNote: (...args: unknown[]) => readNoteMock(...args),
}));

vi.mock("./performSaveNote", () => ({
  writeAndIndexNote: (...args: unknown[]) => writeAndIndexNoteMock(...args),
}));

vi.mock("./saveQueue", () => ({
  queuePerPath: (_path: string, task: () => Promise<unknown>) => task(),
}));

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => getStateMock(),
    setState: (updater: unknown) => setStateMock(updater),
  },
}));

import { appendToNoteInVault, mergeIntoNote } from "./appendToNoteInVault";

/** The content `appendToNoteInVault` asked the canonical writer to write. */
function written(): string {
  return writeAndIndexNoteMock.mock.calls[0]?.[1] as string;
}

describe("appendToNoteInVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAndIndexNoteMock.mockResolvedValue(undefined);
    statNoteMock.mockResolvedValue({ exists: false, mtime: 0, size: 0 });
    readNoteMock.mockResolvedValue({ path: "x.md", content: "", mtime: 0 });
    getStateMock.mockReturnValue({
      allNotePaths: ["Clippings/Old.md"],
      notesContent: {},
      graph: null,
      tagIndex: null,
    });
    setStateMock.mockImplementation((updater: unknown) =>
      typeof updater === "function"
        ? (updater as (state: unknown) => unknown)(getStateMock())
        : updater,
    );
  });

  it("creates the note when the target does not exist", async () => {
    await expect(
      appendToNoteInVault("Clippings/New.md", "# Fresh\n"),
    ).resolves.toBe("Clippings/New.md");

    expect(written()).toBe("# Fresh\n");
    expect(readNoteMock).not.toHaveBeenCalled();
    expect(writeAndIndexNoteMock).toHaveBeenCalledWith(
      "Clippings/New.md",
      "# Fresh\n",
      {
        allNotePaths: ["Clippings/Old.md", "Clippings/New.md"],
        graph: null,
        tagIndex: null,
      },
      expect.any(Function),
    );
  });

  it("appends to a note read from disk with one blank line at the seam", async () => {
    statNoteMock.mockResolvedValue({ exists: true, mtime: 1, size: 10 });
    readNoteMock.mockResolvedValue({
      path: "Clippings/Old.md",
      content: "# Old\n\nExisting.",
      mtime: 1,
    });

    await appendToNoteInVault("Clippings/Old.md", "# Clip\n");

    expect(written()).toBe("# Old\n\nExisting.\n\n# Clip\n");
  });

  it("prefers the in-memory buffer so unsaved edits survive the clip", async () => {
    readNoteMock.mockResolvedValue({
      path: "Clippings/Old.md",
      content: "stale on-disk copy",
      mtime: 1,
    });
    getStateMock.mockReturnValue({
      allNotePaths: ["Clippings/Old.md"],
      notesContent: { "Clippings/Old.md": "# Old\n\nunsaved typing" },
      graph: null,
      tagIndex: null,
    });

    await appendToNoteInVault("Clippings/Old.md", "clip");

    expect(readNoteMock).not.toHaveBeenCalled();
    expect(written()).toBe("# Old\n\nunsaved typing\n\nclip");
  });

  it("prepends above the existing body but below the frontmatter", async () => {
    getStateMock.mockReturnValue({
      allNotePaths: ["Daily.md"],
      notesContent: {
        "Daily.md": "---\ntags:\n  - daily\n---\n\n## Task\n\n- one\n",
      },
      graph: null,
      tagIndex: null,
    });

    await appendToNoteInVault("Daily.md", "## Log\n\n- clipped", "top");

    expect(written()).toBe(
      "---\ntags:\n  - daily\n---\n\n## Log\n\n- clipped\n\n## Task\n\n- one\n",
    );
  });

  it("preserves a CRLF note and normalises the seam to one blank line", async () => {
    getStateMock.mockReturnValue({
      allNotePaths: ["Win.md"],
      notesContent: { "Win.md": "line one\r\nline two\r\n\r\n\r\n" },
      graph: null,
      tagIndex: null,
    });

    await appendToNoteInVault("Win.md", "clip\r\n");

    expect(written()).toBe("line one\r\nline two\r\n\r\nclip\r\n");
  });

  it("updates the store with the merged content and the new path", async () => {
    await appendToNoteInVault("Clippings/New.md", "clip");

    const next = setStateMock.mock.results[0]?.value as {
      allNotePaths: string[];
      notesContent: Record<string, string>;
    };
    expect(next.allNotePaths).toEqual(["Clippings/Old.md", "Clippings/New.md"]);
    expect(next.notesContent["Clippings/New.md"]).toBe("clip");
  });

  it("never truncates an existing note", async () => {
    const existing = "# Old\n\nA paragraph.\n\n- a list\n";
    getStateMock.mockReturnValue({
      allNotePaths: ["Old.md"],
      notesContent: { "Old.md": existing },
      graph: null,
      tagIndex: null,
    });

    await appendToNoteInVault("Old.md", "clip");

    expect(written().startsWith(existing.trimEnd())).toBe(true);
  });
});

describe("mergeIntoNote", () => {
  it("treats a note that is only frontmatter as empty body", () => {
    expect(mergeIntoNote("---\ntags: [x]\n---\n", "clip", "top", "\n")).toBe(
      "---\ntags: [x]\n---\n\nclip",
    );
  });

  it("does not mistake an interior rule for frontmatter", () => {
    expect(mergeIntoNote("# T\n\n---\nclip\n", "block", "top", "\n")).toBe(
      "block\n\n# T\n\n---\nclip\n",
    );
  });

  it("leaves an unterminated leading rule in the body", () => {
    expect(mergeIntoNote("---\nnot closed\n", "clip", "top", "\n")).toBe(
      "clip\n\n---\nnot closed\n",
    );
  });
});

// @vitest-environment jsdom
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { noteEmbedExtension } from "./noteEmbedExtension";
import { notifyNoteEmbedUpdate } from "./noteEmbedUpdateStore";
import type { NoteEmbedOptions } from "./noteEmbedTypes";

describe("note embed live updates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  function createView(doc: string, optionsPartial: Partial<NoteEmbedOptions> = {}) {
    const options: NoteEmbedOptions = {
      isReadOnly: true,
      notePaths: ["Notes/Alpha.md", "Notes/Beta.md"],
      noteContents: {
        "Notes/Alpha.md": "# Alpha\nInitial alpha body.",
        "Notes/Beta.md": "# Beta\nInitial beta body.",
      },
      ...optionsPartial,
    };

    return new EditorView({
      state: EditorState.create({
        doc,
        extensions: [noteEmbedExtension(options)],
      }),
      parent: document.body,
    });
  }

  it("updates embed content once after debounced notification without modifying host document", () => {
    const initialHostDoc = "Host Header\n![[Alpha]]\nHost Footer";
    const view = createView(initialHostDoc);

    const initialHostDocLength = view.state.doc.length;
    expect(view.state.doc.toString()).toBe(initialHostDoc);

    const embed = document.querySelector(".cm-note-embed");
    expect(embed).not.toBeNull();
    expect(embed?.textContent).toContain("Initial alpha body");

    // Send rapid updates
    notifyNoteEmbedUpdate("Notes/Alpha.md", "# Alpha\nUpdated text 1.");
    vi.advanceTimersByTime(50);
    notifyNoteEmbedUpdate("Notes/Alpha.md", "# Alpha\nUpdated text 2.");
    vi.advanceTimersByTime(50);
    notifyNoteEmbedUpdate("Notes/Alpha.md", "# Alpha\nFinal updated text.");

    // Before debounce expiration, text should not have updated yet
    expect(embed?.textContent).toContain("Initial alpha body");

    // Advance past the 200ms debounce
    vi.advanceTimersByTime(250);

    // Embed content is updated
    expect(embed?.textContent).toContain("Final updated text");
    expect(embed?.textContent).not.toContain("Initial alpha body");

    // Host document is completely untouched
    expect(view.state.doc.toString()).toBe(initialHostDoc);
    expect(view.state.doc.length).toBe(initialHostDocLength);

    view.destroy();
  });

  it("reloads content using loadNoteContent when no content payload is supplied", async () => {
    const loadNoteContent = vi.fn().mockResolvedValue("# Alpha\nLoaded from disk.");
    const view = createView("![[Alpha]]", {
      noteContents: { "Notes/Alpha.md": "# Alpha\nCached text." },
      loadNoteContent,
    });

    const embed = document.querySelector(".cm-note-embed");
    expect(embed?.textContent).toContain("Cached text");

    notifyNoteEmbedUpdate("Notes/Alpha.md");
    vi.advanceTimersByTime(100);
    expect(loadNoteContent).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(loadNoteContent).toHaveBeenCalledWith("Notes/Alpha.md");

    // Wait for promise resolution
    await Promise.resolve();
    expect(embed?.textContent).toContain("Loaded from disk");

    view.destroy();
  });
});

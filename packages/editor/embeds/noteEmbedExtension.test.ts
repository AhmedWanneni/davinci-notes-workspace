// @vitest-environment jsdom
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { noteEmbedExtension } from "./noteEmbedExtension";
import type { NoteEmbedOptions } from "./noteEmbedTypes";

describe("note embed extension", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  function createView(doc: string, optionsPartial: Partial<NoteEmbedOptions> = {}) {
    const options: NoteEmbedOptions = {
      isReadOnly: true,
      notePaths: ["Notes/Alpha.md", "Notes/Beta.md", "Notes/Gamma.md", "Notes/Delta.md"],
      noteContents: {
        "Notes/Alpha.md": "# Alpha\nAlpha body text.\n\n## Section One\nSection one content.",
        "Notes/Beta.md": "# Beta\nBeta body text.",
        "Notes/Gamma.md": "# Gamma\nGamma body text.",
        "Notes/Delta.md": "# Delta\nDelta body text.",
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

  it("renders a note embed with header and content", () => {
    const onLinkClick = vi.fn();
    const view = createView("![[Alpha]]", { onLinkClick });

    const embed = document.querySelector(".cm-note-embed");
    expect(embed).not.toBeNull();
    const title = embed?.querySelector(".cm-note-embed__title");
    expect(title?.textContent).toBe("Alpha");

    title?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onLinkClick).toHaveBeenCalledWith("Notes/Alpha.md");
    view.destroy();
  });

  it("renders heading section embed ![[Alpha#Section One]]", () => {
    const onLinkClick = vi.fn();
    const view = createView("![[Alpha#Section One]]", { onLinkClick });

    const embed = document.querySelector(".cm-note-embed");
    expect(embed).not.toBeNull();
    const title = embed?.querySelector(".cm-note-embed__title");
    expect(title?.textContent).toBe("Alpha > Section One");

    title?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onLinkClick).toHaveBeenCalledWith("Notes/Alpha.md#Section One");
    view.destroy();
  });

  it("renders heading not found placeholder when heading is missing", () => {
    const view = createView("![[Alpha#MissingHeading]]");

    const placeholder = document.querySelector(".cm-note-embed-box");
    expect(placeholder?.textContent).toContain("Heading not found: #MissingHeading in [[Notes/Alpha.md]]");
    view.destroy();
  });

  it("renders note not found placeholder when note is missing", () => {
    const view = createView("![[NonExistent]]");

    const placeholder = document.querySelector(".cm-note-embed-box");
    expect(placeholder?.textContent).toContain("Note not found: ![[NonExistent]]");
    view.destroy();
  });

  it("renders ambiguous placeholder when multiple notes match", () => {
    const view = createView("![[Dup]]", {
      notePaths: ["Folder1/Dup.md", "Folder2/Dup.md"],
    });

    const placeholder = document.querySelector(".cm-note-embed-box");
    expect(placeholder?.textContent).toContain("Multiple notes match: Dup");
    view.destroy();
  });

  it("detects circular embeds and terminates recursion (A->A, A->B->A, A->B->C->A)", () => {
    // A -> A
    const viewAA = createView("![[Alpha]]", {
      sourcePath: "Notes/Alpha.md",
      embedChain: ["Notes/Alpha.md"],
    });
    expect(document.querySelector(".cm-note-embed-circular")?.textContent).toBe("Circular embed");
    viewAA.destroy();

    // A -> B -> A
    const viewABA = createView("![[Alpha]]", {
      sourcePath: "Notes/Alpha.md",
      embedChain: ["Notes/Alpha.md", "Notes/Beta.md"],
    });
    expect(document.querySelector(".cm-note-embed-circular")?.textContent).toBe("Circular embed");
    viewABA.destroy();

    // A -> B -> C -> A
    const viewABCA = createView("![[Alpha]]", {
      sourcePath: "Notes/Alpha.md",
      embedChain: ["Notes/Alpha.md", "Notes/Beta.md", "Notes/Gamma.md"],
    });
    expect(document.querySelector(".cm-note-embed-circular")?.textContent).toBe("Circular embed");
    viewABCA.destroy();
  });

  it("enforces depth limit: depth >= 3 renders as a plain link", () => {
    const onLinkClick = vi.fn();
    const viewDepth4 = createView("![[Delta]]", {
      sourcePath: "Notes/Alpha.md",
      embedChain: ["Notes/Alpha.md", "Notes/Beta.md", "Notes/Gamma.md"],
      onLinkClick,
    });

    const plainLink = document.querySelector<HTMLAnchorElement>(".cm-note-embed-plain-link");
    expect(plainLink).not.toBeNull();
    expect(plainLink?.textContent).toBe("[[Delta]]");

    plainLink?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onLinkClick).toHaveBeenCalledWith("Delta");
    viewDepth4.destroy();
  });

  it("caps large notes to 25 lines and provides a Show more toggle", () => {
    const longLines = Array.from({ length: 40 }, (_, i) => `Line ${i + 1}`).join("\n");
    const view = createView("![[Alpha]]", {
      noteContents: { "Notes/Alpha.md": longLines },
    });

    const toggle = document.querySelector<HTMLButtonElement>(".cm-note-embed__show-more");
    expect(toggle).not.toBeNull();
    expect(toggle?.textContent).toBe("Show more (15 more lines)");

    // Click show more
    toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(toggle?.textContent).toBe("Show less");

    // Click show less
    toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(toggle?.textContent).toBe("Show more (15 more lines)");
    view.destroy();
  });

  it("lazy loads note content via IntersectionObserver", async () => {
    let intersectCallback: IntersectionObserverCallback | null = null;
    class MockIntersectionObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn();
      root = null;
      rootMargin = "";
      thresholds = [];
      constructor(cb: IntersectionObserverCallback) {
        intersectCallback = cb;
      }
    }

    const OriginalIntersectionObserver = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    const loadNoteContent = vi.fn().mockResolvedValue("# Async Note Content");
    const view = createView("![[Alpha]]", {
      noteContents: {},
      loadNoteContent,
    });

    // Content not yet loaded, showing loading text
    expect(loadNoteContent).not.toHaveBeenCalled();
    expect(document.querySelector(".cm-note-embed__loading")?.textContent).toBe("Loading embed...");

    // Trigger intersection
    intersectCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      new MockIntersectionObserver(() => {}) as unknown as IntersectionObserver,
    );

    await vi.waitFor(() => {
      expect(loadNoteContent).toHaveBeenCalledWith("Notes/Alpha.md");
      expect(document.querySelector(".cm-note-embed__editor-host")).not.toBeNull();
    });

    globalThis.IntersectionObserver = OriginalIntersectionObserver;
    view.destroy();
  });

  it("reveals source syntax when cursor is on the embed line in editable mode", () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: "![[Alpha]]\nSecond line",
        selection: EditorSelection.cursor(15),
        extensions: [
          noteEmbedExtension({
            notePaths: ["Notes/Alpha.md"],
            noteContents: { "Notes/Alpha.md": "Hello" },
            isReadOnly: false,
          }),
        ],
      }),
      parent: document.body,
    });

    expect(document.querySelector(".cm-note-embed")).not.toBeNull();

    // Move cursor inside first line
    view.dispatch({ selection: EditorSelection.cursor(3) });
    expect(document.querySelector(".cm-note-embed")).toBeNull();

    // Move cursor back to second line
    view.dispatch({ selection: EditorSelection.cursor(15) });
    expect(document.querySelector(".cm-note-embed")).not.toBeNull();
    view.destroy();
  });

  it("bypasses non-note targets like images and pdfs", () => {
    const view = createView("![[image.png]]\n![[document.pdf]]");
    expect(document.querySelector(".cm-note-embed")).toBeNull();
    expect(document.querySelector(".cm-note-embed-box")).toBeNull();
    view.destroy();
  });
});

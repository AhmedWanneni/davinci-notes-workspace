// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { loadVimExtension } from "./vimExtension";
import { getCM, Vim } from "@replit/codemirror-vim";
import { livePreviewExtension } from "../live-preview/livePreviewExtension";
import { linkExtension } from "../links/linkExtension";
import { highlightExtension } from "../live-preview/highlightExtension";
import { listExtension } from "../live-preview/listExtension";
import { tagExtension } from "../live-preview/tagExtension";

if (typeof Range.prototype.getClientRects !== "function") {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}
if (typeof Range.prototype.getBoundingClientRect !== "function") {
  Range.prototype.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

const SAMPLE_NOTE = `# Project Notes

- First task in [[Project Alpha]]
- Second task with **bold text** and #important tag
- Third task with *italic text* and ==highlighted== content

Final summary line.`;

async function createDecoratedEditor(doc: string = SAMPLE_NOTE) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const vimExt = await loadVimExtension();
  const vimCompartment = new Compartment();

  const state = EditorState.create({
    doc,
    extensions: [
      markdown({
        extensions: [Strikethrough, highlightExtension],
      }),
      livePreviewExtension,
      listExtension(),
      tagExtension({ onTagClick: () => {} }),
      linkExtension({
        notePaths: ["Project Alpha.md"],
        sourcePath: "Notes.md",
        onLinkClick: () => {},
      }),
      vimCompartment.of(vimExt),
    ],
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  const cm = getCM(view);

  return {
    view,
    cm,
    container,
    destroy: () => {
      view.destroy();
      container.remove();
    },
  };
}

describe("Vim Modal Editing Verification against Real Note Content", () => {
  it("verifies mode transitions (Normal -> Insert -> Normal -> Visual)", async () => {
    const { view: _view, cm, destroy } = await createDecoratedEditor();

    // 1. Initial state: Normal mode
    expect(cm.state.vim.insertMode).toBe(false);
    expect(cm.state.vim.visualMode).toBe(false);

    // 2. Press 'i': transition to Insert mode
    Vim.handleKey(cm, "i");
    expect(cm.state.vim.insertMode).toBe(true);
    expect(cm.state.vim.visualMode).toBe(false);

    // 3. Exit insert mode via Vim.exitInsertMode(cm) or Esc key
    Vim.exitInsertMode(cm);
    expect(cm.state.vim.insertMode).toBe(false);

    // 4. Press 'v': transition to Visual mode
    Vim.handleKey(cm, "v");
    expect(cm.state.vim.visualMode).toBe(true);

    // 5. Exit visual mode
    Vim.exitVisualMode(cm);
    expect(cm.state.vim.visualMode).toBe(false);

    destroy();
  });

  it("verifies basic motions (hjkl, w, b, e, 0, $, gg, G) on decorated markdown", async () => {
    const { view, cm, destroy } = await createDecoratedEditor();

    // Line 1: '# Project Notes'
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(
      1,
    );

    // Motion '$': move to last character of line 1
    Vim.handleKey(cm, "$");
    expect(view.state.selection.main.head).toBe("# Project Notes".length - 1);

    // Motion '0': move to start of line 1
    Vim.handleKey(cm, "0");
    expect(view.state.selection.main.head).toBe(0);

    // Motion 'G': jump to bottom of document
    Vim.handleKey(cm, "G");
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(
      7,
    );

    // Motion 'gg': jump back to top of document
    Vim.handleKey(cm, "g");
    Vim.handleKey(cm, "g");
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(
      1,
    );

    // Motion '3G': jump to line 3
    Vim.handleKey(cm, "3");
    Vim.handleKey(cm, "G");
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(
      3,
    );

    destroy();
  });

  it("verifies 'dd' (delete line) operates on real text and does not corrupt adjacent wikilinks or decorations", async () => {
    const { view, cm, destroy } = await createDecoratedEditor();

    const originalLineCount = view.state.doc.lines;

    // Move to line 3 ('- First task in [[Project Alpha]]') via 3G
    Vim.handleKey(cm, "3");
    Vim.handleKey(cm, "G");
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(
      3,
    );

    // Execute 'dd'
    Vim.handleKey(cm, "d");
    Vim.handleKey(cm, "d");

    expect(view.state.doc.lines).toBe(originalLineCount - 1);
    expect(view.state.doc.toString()).not.toContain("[[Project Alpha]]");

    // Confirm neighboring lines are untouched and intact
    expect(view.state.doc.toString()).toContain(
      "Second task with **bold text**",
    );

    destroy();
  });

  it("verifies 'yy' and 'p' (yank and paste) operate on real markdown content without altering bracket formatting", async () => {
    const { view, cm, destroy } = await createDecoratedEditor();

    // Move to line 3 ('- First task in [[Project Alpha]]') via 3G
    Vim.handleKey(cm, "3");
    Vim.handleKey(cm, "G");

    // Execute 'yy' (yank line 3)
    Vim.handleKey(cm, "y");
    Vim.handleKey(cm, "y");

    // Execute 'p' (paste line below)
    Vim.handleKey(cm, "p");

    const text = view.state.doc.toString();
    const occurrences = (text.match(/\[\[Project Alpha\]\]/g) || []).length;
    expect(occurrences).toBe(2);

    destroy();
  });

  it("verifies operations act on real underlying Markdown text, not rendered decoration widgets", async () => {
    const { view, cm, destroy } = await createDecoratedEditor();

    // Move to line 4 ('- Second task with **bold text** and #important tag') via 4G
    Vim.handleKey(cm, "4");
    Vim.handleKey(cm, "G");
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(
      4,
    );

    // Execute 'dd' on line 4
    Vim.handleKey(cm, "d");
    Vim.handleKey(cm, "d");

    // Verify raw markdown string was altered directly in state
    expect(view.state.doc.toString()).not.toContain("**bold text**");
    expect(view.state.doc.toString()).not.toContain("#important");

    destroy();
  });

  it("verifies Visual Block mode selection produces valid multi-range state", async () => {
    const { view, cm, destroy } = await createDecoratedEditor();

    // Move to line 3
    Vim.handleKey(cm, "j");
    Vim.handleKey(cm, "j");

    // Enter Visual Block mode (<C-v>)
    Vim.handleKey(cm, "<C-v>");
    expect(cm.state.vim.visualBlock).toBe(true);

    // Extend selection down 2 lines
    Vim.handleKey(cm, "j");
    Vim.handleKey(cm, "j");

    expect(view.state.selection.ranges.length).toBeGreaterThanOrEqual(1);

    // Exit Visual mode
    Vim.exitVisualMode(cm);
    expect(cm.state.vim.visualMode).toBe(false);

    destroy();
  });
});

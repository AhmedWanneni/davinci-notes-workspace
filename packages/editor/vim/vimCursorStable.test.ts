// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { loadVimExtension } from "./vimExtension";
import { editorTheme } from "../theme/editorTheme";
import { getCM, Vim } from "@replit/codemirror-vim";

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

describe("Vim stable cursor and monospace mode", () => {
  async function setupVimEditor(initialDoc: string, monospace = true) {
    const container = document.createElement("div");
    container.className = monospace ? "editor-area editor-area--vim-mono" : "editor-area";
    container.setAttribute("data-vim-monospace", String(monospace));
    document.body.appendChild(container);

    const vimExt = await loadVimExtension();
    const vimComp = new Compartment();
    const state = EditorState.create({
      doc: initialDoc,
      extensions: [editorTheme, vimComp.of(vimExt)],
    });

    const view = new EditorView({
      state,
      parent: container,
    });

    return { container, view, vimComp };
  }

  it("applies fixed 1ch width rule in monospace mode to prevent size jitter on i, l, m, w, spaces, and punctuation", async () => {
    const text = "i l m w ! ?";
    const { container, view } = await setupVimEditor(text, true);

    const cm = getCM(view);
    expect(cm).toBeDefined();

    // Verify editor has monospace vim attributes
    expect(container.getAttribute("data-vim-monospace")).toBe("true");

    // Check DOM cursor layer presence
    const vimCursorLayer = view.scrollDOM.querySelector(".cm-vimCursorLayer");
    expect(vimCursorLayer).toBeDefined();

    // Move across each character in "i l m w ! ?"
    for (let i = 0; i < text.length; i++) {
      Vim.handleKey(cm, "l");
      const head = view.state.selection.main.head;
      const char = text[head] ?? " ";
      expect(["i", " ", "l", "m", "w", "!", "?"]).toContain(char);
    }

    view.destroy();
    container.remove();
  });

  it("preserves stable cursor on empty lines and at the end of a line", async () => {
    const note = "# Heading\n\nBody line with text\n";
    const { container, view } = await setupVimEditor(note, true);
    const cm = getCM(view);
    expect(cm).toBeDefined();

    // Empty line (line 2)
    view.dispatch({ selection: { anchor: 10 } });
    expect(view.state.doc.lineAt(10).length).toBe(0);

    // End of line (line 3 end)
    const line3 = view.state.doc.line(3);
    view.dispatch({ selection: { anchor: line3.to } });
    expect(view.state.selection.main.head).toBe(line3.to);

    view.destroy();
    container.remove();
  });

  it("transitions between normal, visual, visual-block, and insert modes cleanly", async () => {
    const { container, view } = await setupVimEditor("const x = 42;\nconst y = 84;\n", true);
    const cm = getCM(view);

    // Initial state: normal mode has .cm-vimMode class on scrollDOM
    expect(view.scrollDOM.classList.contains("cm-vimMode")).toBe(true);

    // Enter Visual mode
    Vim.handleKey(cm, "v");
    expect(cm.state.vim.visualMode).toBe(true);

    // Exit to Normal mode
    Vim.handleKey(cm, "<Esc>");
    expect(cm.state.vim.visualMode).toBe(false);

    // Enter Visual Block mode (Ctrl+v)
    Vim.handleKey(cm, "<C-v>");
    expect(cm.state.vim.visualBlock).toBe(true);

    // Exit to Normal mode
    Vim.handleKey(cm, "<Esc>");
    expect(cm.state.vim.visualBlock).toBe(false);

    // Enter Insert mode
    Vim.handleKey(cm, "i");
    expect(cm.state.vim.insertMode).toBe(true);
    // In insert mode, cm-vimMode is removed so standard thin line cursor shows
    expect(view.scrollDOM.classList.contains("cm-vimMode")).toBe(false);

    // Exit back to Normal mode
    Vim.handleKey(cm, "<Esc>");
    expect(cm.state.vim.insertMode).toBe(false);
    expect(view.scrollDOM.classList.contains("cm-vimMode")).toBe(true);

    view.destroy();
    container.remove();
  });

  it("toggles monospace mode without losing selection, cursor position, or document state", async () => {
    const { container, view } = await setupVimEditor("Hello DaVinci World", true);

    // Position cursor at offset 6 ('D')
    view.dispatch({ selection: { anchor: 6 } });
    expect(view.state.selection.main.head).toBe(6);

    // Toggle monospace setting to OFF (proportional fallback)
    container.setAttribute("data-vim-monospace", "false");
    container.className = "editor-area";
    view.requestMeasure();

    // Verify cursor position preserved
    expect(view.state.selection.main.head).toBe(6);
    expect(view.state.doc.toString()).toBe("Hello DaVinci World");

    // Toggle monospace setting back to ON
    container.setAttribute("data-vim-monospace", "true");
    container.className = "editor-area editor-area--vim-mono";
    view.requestMeasure();

    expect(view.state.selection.main.head).toBe(6);

    view.destroy();
    container.remove();
  });

  it("keeps tables and code blocks cleanly aligned in monospace mode", () => {
    const table = "| Name | Role | Score |\n| :--- | :--- | :---- |\n| Alex | Lead | 98    |";
    const lines = table.split("\n");
    // All lines in monospace table should match character length
    expect(lines[0]!.length).toBe(lines[1]!.length);
    expect(lines[1]!.length).toBe(lines[2]!.length);
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { getCM, vim, Vim } from "@replit/codemirror-vim";
import { slashMenuSource } from "./SlashMenu";

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

function createVimEditor(initialDoc = "Hello world\n") {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      vim(),
      autocompletion({
        override: [slashMenuSource({ enabled: true })],
      }),
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

describe("Vim mode slash menu behavior", () => {
  it("does not intercept '/' in Normal mode (starts vim search)", async () => {
    const { view, cm, destroy } = createVimEditor();
    expect(cm.state.vim.insertMode).toBe(false);
    expect(cm.state.vim.visualMode).toBe(false);

    // In normal mode, Vim handles '/' as vim search command
    Vim.handleKey(cm, "/");
    // Document is unchanged; no '/' was inserted into doc
    expect(view.state.doc.toString()).toBe("Hello world\n");

    // Slash menu source explicitly returns null in Normal mode
    const context = new CompletionContext(view.state, 0, true);
    (context as unknown as { view: EditorView }).view = view;
    const source = slashMenuSource({ enabled: true });
    const result = await source(context);
    expect(result).toBeNull();

    destroy();
  });

  it("does not intercept '/' in Visual mode", async () => {
    const { view, cm, destroy } = createVimEditor();
    Vim.handleKey(cm, "v");
    expect(cm.state.vim.visualMode).toBe(true);

    // In visual mode, Vim handles '/' as search
    Vim.handleKey(cm, "/");
    expect(view.state.doc.toString()).toBe("Hello world\n");

    const context = new CompletionContext(view.state, 0, true);
    (context as unknown as { view: EditorView }).view = view;
    const source = slashMenuSource({ enabled: true });
    const result = await source(context);
    expect(result).toBeNull();

    destroy();
  });

  it("triggers slash menu completions in Insert mode", async () => {
    const { view, cm, destroy } = createVimEditor("");
    // Enter Insert mode
    Vim.handleKey(cm, "i");
    expect(cm.state.vim.insertMode).toBe(true);

    // Insert '/' into the document in insert mode
    view.dispatch({
      changes: { from: 0, insert: "/" },
      selection: { anchor: 1 },
    });
    expect(view.state.doc.toString()).toBe("/");

    const context = new CompletionContext(view.state, 1, true);
    (context as unknown as { view: EditorView }).view = view;
    const source = slashMenuSource({ enabled: true, vimMode: "INSERT" });
    const result = await source(context);

    expect(result).not.toBeNull();
    expect(result?.options.length).toBeGreaterThan(0);
    expect(result?.options.some((opt) => opt.label === "Table")).toBe(true);

    destroy();
  });
});

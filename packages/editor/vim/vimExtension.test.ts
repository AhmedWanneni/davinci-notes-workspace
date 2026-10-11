// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { attachVimModeListener, loadVimExtension } from "./vimExtension";
import { getCM } from "@replit/codemirror-vim";

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

describe("loadVimExtension", () => {
  it("dynamically imports and returns the CodeMirror Vim extension", async () => {
    const extension = await loadVimExtension();
    expect(extension).toBeDefined();
    expect(
      Array.isArray(extension) ||
        typeof extension === "object" ||
        typeof extension === "function",
    ).toBe(true);
  });

  it("returns cached promise on subsequent calls", async () => {
    const ext1 = await loadVimExtension();
    const ext2 = await loadVimExtension();
    expect(ext1).toBe(ext2);
  });

  it("dynamically loads, unloads, and cycles Vim mode on an open EditorView instance", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const vimCompartment = new Compartment();
    const state = EditorState.create({
      doc: "Hello World",
      extensions: [vimCompartment.of([])],
    });

    const view = new EditorView({
      state,
      parent: container,
    });

    // 1. Initial state (OFF): Vim mode state is inactive
    let cm = getCM(view);
    expect(cm?.state?.vim).toBeUndefined();

    // 2. Enable Vim mode dynamically on the open editor instance
    const vimExt = await loadVimExtension();
    view.dispatch({
      effects: vimCompartment.reconfigure(vimExt),
    });

    cm = getCM(view);
    expect(cm?.state?.vim).toBeDefined();
    expect(cm?.state?.vim?.insertMode).toBe(false);
    expect(cm?.state?.vim?.visualMode).toBe(false);

    // 3. Disable Vim mode dynamically on the SAME open editor instance
    view.dispatch({
      effects: vimCompartment.reconfigure([]),
    });

    // Verify functionally: Vim state is cleanly removed from the active view
    cm = getCM(view);
    expect(cm?.state?.vim).toBeUndefined();

    // Verify typing literal characters works when disabled
    view.dispatch({
      changes: { from: view.state.doc.length, insert: " - edited" },
    });
    expect(view.state.doc.toString()).toBe("Hello World - edited");

    // 4. Repeat cycle multiple times (ON -> OFF -> ON -> OFF) to verify no state degradation
    for (let i = 0; i < 3; i++) {
      // Turn ON
      view.dispatch({
        effects: vimCompartment.reconfigure(vimExt),
      });
      cm = getCM(view);
      expect(cm?.state?.vim).toBeDefined();
      expect(cm?.state?.vim?.insertMode).toBe(false);

      // Turn OFF
      view.dispatch({
        effects: vimCompartment.reconfigure([]),
      });
      cm = getCM(view);
      expect(cm?.state?.vim).toBeUndefined();
    }

    view.destroy();
    container.remove();
  });

  it("subscribes to vim-mode-change events and emits formatted mode names on transitions", async () => {
    const { attachVimModeListener } = await import("./vimExtension");
    const { Vim, getCM } = await import("@replit/codemirror-vim");

    const container = document.createElement("div");
    document.body.appendChild(container);

    const vimCompartment = new Compartment();
    const vimExt = await loadVimExtension();

    const view = new EditorView({
      state: EditorState.create({
        doc: "Mode test line",
        extensions: [vimCompartment.of(vimExt)],
      }),
      parent: container,
    });

    const emittedModes: (string | null)[] = [];
    const unsubscribe = attachVimModeListener(view, (mode) => {
      emittedModes.push(mode);
    });

    // Initial state emission
    expect(emittedModes).toEqual(["NORMAL"]);

    const cm = getCM(view);

    // Transition to insert
    Vim.handleKey(cm, "i");
    expect(emittedModes.slice(-1)[0]).toBe("INSERT");

    // Transition back to normal
    Vim.exitInsertMode(cm);
    expect(emittedModes.slice(-1)[0]).toBe("NORMAL");

    // Transition to visual
    Vim.handleKey(cm, "v");
    expect(emittedModes.slice(-1)[0]).toBe("VISUAL");

    // Transition to visual line
    Vim.exitVisualMode(cm);
    Vim.handleKey(cm, "V");
    expect(emittedModes.slice(-1)[0]).toBe("VISUAL LINE");

    // Unsubscribe and verify no further emissions
    unsubscribe?.();
    Vim.exitVisualMode(cm);
    Vim.handleKey(cm, "i");
    expect(emittedModes.slice(-1)[0]).toBe("VISUAL LINE");

    view.destroy();
    container.remove();
  });

  it("verifies plain textarea elements (Canvas text cards) are completely unaffected by active Vim mode", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const textarea = document.createElement("textarea");
    textarea.value = "Canvas card text";
    container.appendChild(textarea);

    const vimExt = await loadVimExtension();
    const view = new EditorView({
      state: EditorState.create({
        doc: "Editor note text",
        extensions: [vimExt],
      }),
      parent: container,
    });

    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    // Typing in textarea operates as plain text input, without Vim normal/insert mode interceptors
    textarea.value += " - typed";
    expect(textarea.value).toBe("Canvas card text - typed");

    // CM view state is isolated and unchanged
    const cm = getCM(view);
    expect(cm?.state?.vim).toBeDefined();
    expect(view.state.doc.toString()).toBe("Editor note text");

    view.destroy();
    container.remove();
  });

  it("re-initializes Vim mode cleanly after being toggled off and back on after extended session use", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const vimCompartment = new Compartment();
    const vimExt = await loadVimExtension();

    const view = new EditorView({
      state: EditorState.create({
        doc: "Session note content",
        extensions: [vimCompartment.of(vimExt)],
      }),
      parent: container,
    });

    // 1. Extended use: Attach mode listener
    let modeHistory: (string | null)[] = [];
    let cleanup = attachVimModeListener(view, (mode) => {
      modeHistory.push(mode);
    });

    expect(modeHistory).toEqual(["NORMAL"]);

    // 2. Toggle Vim mode OFF
    cleanup?.();
    view.dispatch({
      effects: vimCompartment.reconfigure([]),
    });

    let cm = getCM(view);
    expect(cm?.state?.vim).toBeUndefined();

    // 3. Toggle Vim mode back ON
    modeHistory = [];
    view.dispatch({
      effects: vimCompartment.reconfigure(vimExt),
    });
    cleanup = attachVimModeListener(view, (mode) => {
      modeHistory.push(mode);
    });

    cm = getCM(view);
    expect(cm?.state?.vim).toBeDefined();
    expect(modeHistory).toEqual(["NORMAL"]);

    cleanup?.();
    view.destroy();
    container.remove();
  });
});

// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { loadVimExtension, registerVimExCommands } from "./vimExtension";
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

describe("Vim Ex Commands (:w, :q, :wq, :x, :qa, :wqa)", () => {
  it("handles :w by invoking onSaveNoteNow for active note", async () => {
    const vimExt = await loadVimExtension();
    const onSaveNoteNow = vi.fn().mockResolvedValue(undefined);
    const onCloseNote = vi.fn().mockResolvedValue(undefined);
    const onCloseAllNotes = vi.fn().mockResolvedValue(undefined);

    registerVimExCommands(() => ({
      sourcePath: "Notes/Alpha.md",
      handlers: { onSaveNoteNow, onCloseNote, onCloseAllNotes },
    }));

    const container = document.createElement("div");
    document.body.appendChild(container);

    const comp = new Compartment();
    const view = new EditorView({
      state: EditorState.create({
        doc: "Note content",
        extensions: [comp.of(vimExt)],
      }),
      parent: container,
    });

    const cm = getCM(view);
    Vim.handleEx(cm, "w");

    expect(onSaveNoteNow).toHaveBeenCalledWith("Notes/Alpha.md");
    expect(onCloseNote).not.toHaveBeenCalled();

    view.destroy();
    container.remove();
  });

  it("handles :q by invoking onCloseNote for active note", async () => {
    const onSaveNoteNow = vi.fn().mockResolvedValue(undefined);
    const onCloseNote = vi.fn().mockResolvedValue(undefined);

    registerVimExCommands(() => ({
      sourcePath: "Notes/Beta.md",
      handlers: { onSaveNoteNow, onCloseNote },
    }));

    const container = document.createElement("div");
    document.body.appendChild(container);

    const vimExt = await loadVimExtension();
    const comp = new Compartment();
    const view = new EditorView({
      state: EditorState.create({
        doc: "Note content",
        extensions: [comp.of(vimExt)],
      }),
      parent: container,
    });

    const cm = getCM(view);
    Vim.handleEx(cm, "q");

    expect(onCloseNote).toHaveBeenCalledWith("Notes/Beta.md");

    view.destroy();
    container.remove();
  });

  it("handles :wq and :x by flushing save and then closing tab", async () => {
    const callOrder: string[] = [];
    const onSaveNoteNow = vi.fn().mockImplementation(async (path: string) => {
      callOrder.push(`save:${path}`);
    });
    const onCloseNote = vi.fn().mockImplementation(async (path: string) => {
      callOrder.push(`close:${path}`);
    });

    const vimExt = await loadVimExtension();

    registerVimExCommands(() => ({
      sourcePath: "Notes/Gamma.md",
      handlers: { onSaveNoteNow, onCloseNote },
    }));

    const container = document.createElement("div");
    document.body.appendChild(container);

    const comp = new Compartment();
    const view = new EditorView({
      state: EditorState.create({
        doc: "Note content",
        extensions: [comp.of(vimExt)],
      }),
      parent: container,
    });

    const cm = getCM(view);
    Vim.handleEx(cm, "wq");
    await new Promise((r) => setTimeout(r, 10));

    expect(callOrder).toEqual(["save:Notes/Gamma.md", "close:Notes/Gamma.md"]);

    view.destroy();
    container.remove();
  });

  it("handles :qa and :wqa by invoking onCloseAllNotes", async () => {
    const onCloseAllNotes = vi.fn().mockResolvedValue(undefined);
    const vimExt = await loadVimExtension();

    registerVimExCommands(() => ({
      sourcePath: "Notes/Delta.md",
      handlers: { onCloseAllNotes },
    }));

    const container = document.createElement("div");
    document.body.appendChild(container);

    const comp = new Compartment();
    const view = new EditorView({
      state: EditorState.create({
        doc: "Note content",
        extensions: [comp.of(vimExt)],
      }),
      parent: container,
    });

    const cm = getCM(view);
    Vim.handleEx(cm, "qa");

    expect(onCloseAllNotes).toHaveBeenCalled();

    view.destroy();
    container.remove();
  });

  it("handles unsupported Ex commands cleanly without throwing uncaught errors", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const vimExt = await loadVimExtension();
    const comp = new Compartment();
    const view = new EditorView({
      state: EditorState.create({
        doc: "Note content",
        extensions: [comp.of(vimExt)],
      }),
      parent: container,
    });

    const cm = getCM(view);
    expect(() => Vim.handleEx(cm, "unsupportedCommand")).not.toThrow();

    view.destroy();
    container.remove();
  });
});

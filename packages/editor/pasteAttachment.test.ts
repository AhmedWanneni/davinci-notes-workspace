// @vitest-environment jsdom
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import { handleAttachmentPaste, handleIncomingFiles, pastedFileName } from "./pasteAttachment";

describe("attachment paste handling", () => {
  it("leaves text paste to CodeMirror", () => {
    const onFile = vi.fn();
    const view = new EditorView({ state: EditorState.create({ doc: "text" }) });
    const event = new Event("paste", { bubbles: true });
    Object.defineProperty(event, "clipboardData", { value: { files: [] } });
    expect(handleAttachmentPaste(event, view, onFile)).toBe(false);
    expect(onFile).not.toHaveBeenCalled();
    view.destroy();
  });

  it("handles file paste asynchronously and inserts returned syntax", async () => {
    const onFile = vi.fn(async () => "![[image.png]]");
    const view = new EditorView({
      state: EditorState.create({ doc: "hello", selection: { anchor: 5 } }),
    });
    const file = new File([new Uint8Array([1])], "image.png", { type: "image/png" });
    const event = new Event("paste", { bubbles: true });
    Object.defineProperty(event, "clipboardData", { value: { files: [file] } });
    handleAttachmentPaste(event, view, onFile);
    await vi.waitFor(() => expect(view.state.doc.toString()).toBe("hello![[image.png]]"));
    expect(onFile).toHaveBeenCalledWith(file, 5);
    view.destroy();
  });

  it("names nameless clipboard screenshots from their MIME type", () => {
    const file = new File([new Uint8Array([1])], "", { type: "image/png" });
    expect(pastedFileName(file)).toMatch(/^pasted-\d+\.png$/);
  });

  it("reports structured write failures without inserting a reference", async () => {
    const onError = vi.fn();
    const view = new EditorView({ state: EditorState.create({ doc: "text" }) });
    const file = new File([new Uint8Array([1])], "run.exe", { type: "application/octet-stream" });
    const event = new Event("paste", { bubbles: true });
    Object.defineProperty(event, "clipboardData", { value: { files: [file] } });
    handleAttachmentPaste(event, view, async () => {
      throw Object.assign(new Error("Attachment format is not supported."), { code: "unsupported-format" });
    }, onError);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(
      "Attachment unsupported-format: Attachment format is not supported.",
    ));
    expect(view.state.doc.toString()).toBe("text");
    view.destroy();
  });

  it("keeps successful files when one dropped file fails", async () => {
    const onFile = vi.fn(async (file: File) => {
      if (file.name === "bad.exe") throw Object.assign(new Error("unsupported"), { code: "unsupported-format" });
      return `![[${file.name}]]`;
    });
    const errors = vi.fn();
    const view = new EditorView({ state: EditorState.create({ doc: "" }) });
    const files = [
      new File(["a"], "one.png"),
      new File(["b"], "bad.exe"),
      new File(["c"], "three.pdf"),
    ];
    await handleIncomingFiles(files, 0, view, onFile, errors);
    expect(view.state.doc.toString()).toBe("![[one.png]]\n![[three.pdf]]");
    expect(errors).toHaveBeenCalledWith("Attachment unsupported-format: unsupported");
    view.destroy();
  });
});

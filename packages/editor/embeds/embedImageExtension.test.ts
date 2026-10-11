// @vitest-environment jsdom
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import { embedImageExtension } from "./embedImageExtension";

function createView(doc: string) {
  return new EditorView({
    state: EditorState.create({
      doc,
      extensions: [embedImageExtension({ notePaths: ["attachments/photo.png"], isReadOnly: true })],
    }),
    parent: document.body,
  });
}

describe("embed image extension", () => {
  it("renders a resolved image and dimension syntax", async () => {
    const view = createView("![[photo.png|640x480]]");
    await vi.waitFor(() => expect(document.querySelector(".cm-file-image-embed")).not.toBeNull());
    const image = document.querySelector<HTMLImageElement>(".cm-file-image-embed img");
    expect(image?.src).toContain("attachments/photo.png");
    expect(image?.width).toBe(640);
    expect(image?.height).toBe(480);
    view.destroy();
  });

  it("renders width-only syntax with automatic height", async () => {
    const view = createView("![[photo.png|100]]");
    await vi.waitFor(() => expect(document.querySelector(".cm-file-image-embed")).not.toBeNull());
    const image = document.querySelector<HTMLImageElement>(".cm-file-image-embed img");
    expect(image?.width).toBe(100);
    expect(image?.style.height).toBe("auto");
    view.destroy();
  });

  it("renders missing and ambiguous placeholders", async () => {
    const missing = createView("![[missing.png]]");
    await vi.waitFor(() => expect(document.querySelector(".cm-file-image-placeholder")).not.toBeNull());
    expect(document.querySelector(".cm-file-image-placeholder")?.textContent).toContain("Missing image");
    missing.destroy();
    const ambiguous = new EditorView({
      state: EditorState.create({
        doc: "![[photo.png]]",
        extensions: [embedImageExtension({ notePaths: ["a/photo.png", "b/photo.png"], isReadOnly: true })],
      }),
      parent: document.body,
    });
    await vi.waitFor(() => expect(document.querySelector(".cm-file-image-placeholder")?.textContent).toContain("Multiple files"));
    ambiguous.destroy();
  });

  it("reveals source while the cursor is on the embed line and rerenders after leaving", async () => {
    const view = new EditorView({
      state: EditorState.create({
        doc: "![[photo.png]]\ntext",
        selection: EditorSelection.cursor(16),
        extensions: [embedImageExtension({ notePaths: ["attachments/photo.png"] })],
      }),
      parent: document.body,
    });
    await vi.waitFor(() => expect(document.querySelector(".cm-file-image-embed")).not.toBeNull());
    await vi.waitFor(() => expect(document.querySelector(".cm-file-image-embed")).not.toBeNull());
    view.dispatch({ selection: EditorSelection.cursor(3) });
    expect(document.querySelector(".cm-file-image-embed")).toBeNull();
    view.dispatch({ selection: EditorSelection.cursor(view.state.doc.length) });
    expect(document.querySelector(".cm-file-image-embed")).not.toBeNull();
    view.destroy();
  });
});

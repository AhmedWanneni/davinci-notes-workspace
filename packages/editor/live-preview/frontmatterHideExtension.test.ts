// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { frontmatterHideExtension } from "./frontmatterHideExtension";

describe("frontmatterHideExtension", () => {
  it("hides YAML frontmatter in the rendered editor without removing note text", () => {
    const doc = "---\ntitle: Note\ntags: [work]\n---\nBody text";
    const view = new EditorView({
      state: EditorState.create({ doc, extensions: [frontmatterHideExtension()] }),
      parent: document.createElement("div"),
    });

    expect(view.state.doc.toString()).toBe(doc);
    expect(view.dom.querySelector(".cm-frontmatter-hidden")?.getAttribute("aria-hidden")).toBe("true");
    expect(view.dom.textContent).not.toContain("title: Note");
    expect(view.dom.textContent).toContain("Body text");
    view.destroy();
  });

  it("leaves documents without frontmatter visible", () => {
    const view = new EditorView({
      state: EditorState.create({ doc: "Body text", extensions: [frontmatterHideExtension()] }),
      parent: document.createElement("div"),
    });
    expect(view.dom.textContent).toContain("Body text");
    expect(view.dom.querySelector(".cm-frontmatter-hidden")).toBeNull();
    view.destroy();
  });

  it("does not hide note body when the note starts with a horizontal rule --- followed by markdown", () => {
    const doc = "---\n# Heading\nParagraph text\n---";
    const view = new EditorView({
      state: EditorState.create({ doc, extensions: [frontmatterHideExtension()] }),
      parent: document.createElement("div"),
    });
    expect(view.dom.textContent).toContain("# Heading");
    expect(view.dom.textContent).toContain("Paragraph text");
    expect(view.dom.querySelector(".cm-frontmatter-hidden")).toBeNull();
    view.destroy();
  });

  it("moves cursor out of hidden frontmatter into the visible note body", () => {
    const doc = "---\ntitle: Note\n---\nVisible line";
    const view = new EditorView({
      state: EditorState.create({ doc, extensions: [frontmatterHideExtension()] }),
      parent: document.createElement("div"),
    });
    view.dispatch({ selection: { anchor: 0 } });
    expect(view.state.doc.lineAt(view.state.selection.main.head).number).toBe(4);
    view.destroy();
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createEditorPluginAdapter } from "./pluginEditorAdapter";

describe("plugin editor adapter", () => {
  let view: EditorView | undefined;

  afterEach(() => view?.destroy());

  it("keeps the plugin-facing surface limited to its documented methods", () => {
    const host = document.createElement("div");
    document.body.append(host);
    view = new EditorView({ state: EditorState.create(), parent: host });
    expect(Object.keys(createEditorPluginAdapter(view)).sort()).toEqual([
      "destroy",
      "emitContentChange",
      "getContent",
      "getSelection",
      "insertText",
      "onContentChange",
      "setContent",
      "setSelection",
    ]);
  });

  it("changes the real editor and emits real document changes", () => {
    const host = document.createElement("div");
    document.body.append(host);
    view = new EditorView({
      state: EditorState.create({ doc: "hello" }),
      parent: host,
    });
    const editor = createEditorPluginAdapter(view);
    const changes: string[] = [];
    editor.onContentChange((content) => changes.push(content));
    editor.setSelection({ from: 5, to: 5 });
    editor.insertText(" world");

    expect(editor.getContent()).toBe("hello world");
    expect(view.state.doc.toString()).toBe("hello world");
    expect(changes).toEqual([]);
    editor.emitContentChange(view.state.doc.toString());
    expect(changes).toEqual(["hello world"]);
    editor.destroy();
  });
});

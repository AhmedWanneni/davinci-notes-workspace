// @vitest-environment jsdom
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { Strikethrough } from "@lezer/markdown";
import { syntaxHighlighting } from "@codemirror/language";
import { syntaxTree } from "@codemirror/language";
import { afterEach, describe, expect, it } from "vitest";
import { editorHighlightStyle } from "./editorHighlightStyle";
import { htmlInlineExtension } from "./htmlInlineExtension";
import { htmlInlineTheme } from "./htmlInlineTheme";
import { livePreviewExtension } from "./livePreviewExtension";

let view: EditorView | undefined;
let host: HTMLDivElement | undefined;
afterEach(() => { view?.destroy(); view = undefined; host?.remove(); host = undefined; });

function createView(value: string, withMarkdown = false) {
  host = document.createElement("div");
  document.body.append(host);
  const extensions = [htmlInlineTheme, htmlInlineExtension()];
  if (withMarkdown) extensions.push(markdown({ extensions: [Strikethrough] }), syntaxHighlighting(editorHighlightStyle), livePreviewExtension);
  view = new EditorView({ state: EditorState.create({ doc: value, extensions }), parent: host });
  return view;
}

describe("htmlInlineExtension", () => {
  it("renders underline and strikethrough beside Markdown formatting", () => {
    const current = createView("**bold** <u>under</u> <s>gone</s> **bold**");
    expect(current.dom.querySelector(".cm-inline-html u")?.textContent).toBe("under");
    expect(current.dom.querySelector(".cm-inline-html s")?.textContent).toBe("gone");
    expect(current.dom.textContent).toContain("bold");
  });

  it("passes the cursive-style example through the real sanitizer", () => {
    const current = createView('<span style="font-family: cursive">your text</span>');
    expect(current.dom.querySelector(".cm-inline-html span")?.textContent).toBe("your text");
    expect(current.dom.querySelector(".cm-inline-html span")?.getAttribute("style")).toBe("");
  });

  it("hides HTML comments like native Markdown comments", () => {
    const current = createView("visible <!-- hidden --> %%also hidden%% visible");
    expect(current.dom.querySelector(".cm-inline-html")?.textContent).toBe("");
    expect(current.dom.textContent).toContain("visible");
  });

  it.each(["u", "s", "span", "div"])("keeps Markdown literal inside <%s>", (tag) => {
    const source = tag === "div" ? `x <${tag}>**bold** and \`code\`</${tag}>` : `<${tag}>**bold** and \`code\`</${tag}>`;
    const current = createView(source);
    const element = current.dom.querySelector(`.cm-inline-html ${tag}`);
    expect(element?.textContent).toContain("**bold**");
    expect(element?.textContent).toContain("`code`");
  });

  it("processes Markdown outside the inline HTML range", () => {
    const current = createView("**bold** <u>under</u> **again**", true);
    expect(current.dom.querySelector(".cm-inline-html u")?.textContent).toBe("under");
    expect(current.dom.textContent).toContain("bold");
    let strongNode = false;
    syntaxTree(current.state).iterate({ enter: (node) => { if (node.name === "StrongEmphasis") strongNode = true; } });
    expect(strongNode).toBe(true);
  });
});

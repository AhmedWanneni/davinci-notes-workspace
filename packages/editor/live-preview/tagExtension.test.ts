// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { performance } from "node:perf_hooks";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Strikethrough } from "@lezer/markdown";
import { syntaxHighlighting } from "@codemirror/language";
import { highlightExtension } from "./highlightExtension";
import { editorHighlightStyle } from "../theme/editorHighlightStyle";
import { codeBlockLanguage } from "../blocks/code/codeBlockExtension";
import { livePreviewExtension } from "./livePreviewExtension";
import { linkExtension } from "../links/linkExtension";
import { listExtension } from "./listExtension";
import { tableExtension } from "../blocks/table/tableExtension";
import { tagExtension } from "./tagExtension";
import { tagTheme } from "../theme/tagTheme";
import { htmlBlockExtension } from "../blocks/html/htmlBlockExtension";
import { htmlBlockTheme } from "../blocks/html/htmlBlockTheme";
import { htmlInlineExtension } from "../blocks/html/htmlInlineExtension";
import { htmlInlineTheme } from "../blocks/html/htmlInlineTheme";

let currentView: EditorView | null = null;
let host: HTMLDivElement | null = null;

function createView(value: string, onTagClick = vi.fn()) {
  currentView?.destroy();
  currentView = null;
  host?.remove();
  host = null;

  host = document.createElement("div");
  document.body.appendChild(host);

  const state = EditorState.create({
    doc: value,
    extensions: [
      tagTheme,
      htmlBlockTheme,
      htmlInlineTheme,
      EditorView.lineWrapping,
      markdown({
        extensions: [Strikethrough, highlightExtension],
        codeLanguages: codeBlockLanguage,
      }),
      syntaxHighlighting(editorHighlightStyle),
      livePreviewExtension,
      listExtension(),
      tableExtension(),
      linkExtension({
        notePaths: ["note.md"],
        sourcePath: "current.md",
        onLinkClick: () => {},
      }),
      tagExtension({ onTagClick }),
      htmlBlockExtension(),
      htmlInlineExtension(),
    ],
  });

  currentView = new EditorView({ state, parent: host });
  return { view: currentView, onTagClick };
}

afterEach(() => {
  currentView?.destroy();
  currentView = null;
  host?.remove();
  host = null;
});

describe("tagExtension", () => {
  it("renders valid tags with canonical casing and click affordance", () => {
    const onTagClick = vi.fn();
    const { view } = createView("#Tag #TAG #1984 #", onTagClick);

    const tags = [...view.dom.querySelectorAll<HTMLElement>(".cm-tag")];
    expect(tags.map((element) => element.textContent)).toEqual(["#Tag", "#Tag"]);
    expect(getComputedStyle(tags[0]!).cursor).toBe("pointer");

    tags[0]!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onTagClick).toHaveBeenCalledWith("tag");
  });

  it("excludes inline code and fenced code", () => {
    const { view } = createView("plain #tag `#code`\n\n```js\n#block\n```");

    expect(view.dom.querySelectorAll(".cm-tag")).toHaveLength(1);
    expect(view.dom.textContent).toContain("#code");
    expect(view.dom.textContent).toContain("#block");
  });

  it("treats tag-looking text inside sanitized HTML as opaque", () => {
    const { view } = createView("<div>literal #not-a-tag</div> <span>#also-not-a-tag</span>");

    expect(view.dom.querySelectorAll(".cm-tag")).toHaveLength(0);
  });

  it("renders tags in headings, lists, and blockquotes", () => {
    expect(createView("# Heading #head").view.dom.querySelectorAll(".cm-tag")).toHaveLength(1);
    expect(createView("- item #list").view.dom.querySelectorAll(".cm-tag")).toHaveLength(1);
    expect(createView("> quote #quote").view.dom.querySelectorAll(".cm-tag")).toHaveLength(1);
  });

  it("renders tags in table cells and links", () => {
    const table = createView("| cell #cell | other |\n| --- | --- |\n| body | value |").view;
    expect(table.dom.querySelectorAll(".cm-tag")).toHaveLength(1);
    expect(table.dom.querySelector(".cm-table-cell")).not.toBeNull();

    const formatting = createView("*italic #italic* **bold #bold** [link #link](note.md) ==highlight==").view;
    expect(
      [...formatting.dom.querySelectorAll<HTMLElement>(".cm-tag")].map(
        (element) => element.textContent,
      ),
    ).toEqual(["#italic", "#bold", "#link"]);
    expect(formatting.dom.querySelector(".cm-link")).not.toBeNull();
  });

  it("keeps typing latency under 5ms on a large tagged document", () => {
    let doc = "# Tag benchmark\n\n";
    for (let i = 0; i < 1000; i++) {
      if (i % 100 === 0) {
        doc += "```js\nconst code = '#code';\n```\n";
      } else if (i % 20 === 0) {
        doc += `This line ${i} has #tag${i} and [link #link${i}](note.md).\n`;
      } else if (i % 20 === 5) {
        doc += `- item #item${i}\n`;
      } else if (i % 20 === 10) {
        doc += `> quote #quote${i}\n`;
      } else {
        doc += `Normal text line ${i} with #tag${i} and **bold**.\n`;
      }
    }

    const { view } = createView(doc, () => {});
    for (let i = 0; i < 5; i++) {
      view.dispatch({ changes: { from: view.state.doc.length, insert: "a" } });
    }

    const iterations = 100;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      view.dispatch({ changes: { from: view.state.doc.length, insert: "a" } });
    }
    const latency = (performance.now() - start) / iterations;

    expect(latency).toBeLessThan(5);
  });
});

// @vitest-environment jsdom
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { htmlBlockExtension, findHtmlBlocks } from "./htmlBlockExtension";
import { htmlBlockTheme } from "./htmlBlockTheme";

let view: EditorView | undefined;
let host: HTMLDivElement | undefined;
afterEach(() => { view?.destroy(); view = undefined; host?.remove(); host = undefined; });

function createView(value: string) {
  host = document.createElement("div");
  document.body.append(host);
  view = new EditorView({
    state: EditorState.create({
      doc: value,
      selection: { anchor: value.length },
      extensions: [htmlBlockTheme, htmlBlockExtension()],
    }),
    parent: host!,
  });
  return view;
}

describe("htmlBlockExtension", () => {
  it("renders a contiguous table block through the sanitizer", () => {
    const current = createView("<table>\n<tr><td>Safe</td></tr>\n</table>");
    expect(current.dom.querySelector(".cm-html-block table td")?.textContent).toBe("Safe");
    expect(current.dom.querySelector(".cm-html-block table")).not.toBeNull();
    expect(current.dom.querySelector(".cm-line .cm-html-block")).toBeNull();
  });

  it("keeps multiline HTML tight by hiding source continuation lines", () => {
    const current = createView("<div>\n      hello world\n</div>");
    const block = current.dom.querySelector(".cm-html-block");

    expect(block?.textContent?.trim()).toBe("hello world");
    expect(current.dom.querySelector(".cm-line .cm-html-block")).toBeNull();
  });

  it("preserves allowlisted table styles for inline CSS precedence", () => {
    const current = createView('<table style="color: green"><tr><td>Styled</td></tr></table>');
    expect(current.dom.querySelector(".cm-html-block table")?.getAttribute("style"))
      .toContain("color: green");
  });

  it("reveals the source when the cursor enters the block range", () => {
    const current = createView("before\n<div>hello</div>\nafter");
    const block = current.state.doc.line(2);
    expect(current.dom.querySelector(".cm-html-block")).not.toBeNull();

    current.dispatch({ selection: EditorSelection.cursor(block.from + 5) });
    expect(current.dom.querySelector(".cm-html-block")).toBeNull();

    current.dispatch({ selection: EditorSelection.cursor(0) });
    expect(current.dom.querySelector(".cm-html-block")).not.toBeNull();
  });

  it("re-sanitizes edited source when leaving source mode", () => {
    const current = createView("before\n<div>Safe</div>\nafter");
    const block = current.state.doc.line(2);
    current.dispatch({ selection: EditorSelection.cursor(block.from + 5) });
    current.dispatch({ changes: { from: block.from + 5, to: block.from + 9, insert: "<script>alert(1)</script>" } });

    expect(current.dom.querySelector(".cm-html-block")).toBeNull();
    current.dispatch({ selection: EditorSelection.cursor(0) });
    expect(current.dom.querySelector(".cm-html-block script")).toBeNull();
    expect(current.dom.querySelector(".cm-html-block")?.textContent).not.toContain("alert");
  });

  it("breaks the block at the documented blank line", () => {
    const current = createView("<table>\n<tr>\n\n<td>Broken</td>\n</tr>\n</table>");
    expect(current.dom.querySelector(".cm-html-block")).toBeNull();
    expect(findHtmlBlocks(current.state)).toHaveLength(0);
  });

  it("sanitizes again after a safe block is edited", () => {
    const current = createView("<div>Safe</div>");
    current.dispatch({ changes: { from: 5, to: 9, insert: "<script>alert(1)</script>" } });
    expect(current.dom.querySelector("script")).toBeNull();
    expect(current.dom.querySelector(".cm-html-block")?.textContent).not.toContain("alert");
  });

  it("keeps Markdown syntax literal inside a block HTML element", () => {
    const current = createView("<div>**bold** and `code`</div>");
    const block = current.dom.querySelector(".cm-html-block");
    expect(block?.textContent).toContain("**bold**");
    expect(block?.textContent).toContain("`code`");
    expect(block?.querySelector("strong, code")).toBeNull();
  });
});

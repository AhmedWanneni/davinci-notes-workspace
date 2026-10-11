// @vitest-environment jsdom
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { performance } from "node:perf_hooks";
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

  it("uses a click-to-load placeholder for iframe blocks", () => {
    const current = createView('<iframe src="https://www.youtube.com/embed/abc"></iframe>');
    expect(current.dom.querySelector(".cm-iframe-placeholder")?.textContent).toContain("youtube.com");
    expect(current.dom.querySelector("iframe")).toBeNull();
  });

  it("renders YouTube image syntax as a thumbnail facade", () => {
    const current = createView("![](https://www.youtube.com/watch?v=dQw4w9WgXcQ)");
    expect(current.dom.querySelector(".cm-youtube-facade")).not.toBeNull();
    expect(current.dom.querySelector(".cm-youtube-facade img")?.getAttribute("src"))
      .toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(current.dom.querySelector(".cm-youtube-facade__play")).not.toBeNull();
    expect(current.dom.querySelector("iframe")).toBeNull();
  });

  it("mounts the policy-sanitized iframe only after facade activation", () => {
    const current = createView("![](https://www.youtube.com/watch?v=9bZkp7q19f0)");
    current.dom.querySelector<HTMLButtonElement>(".cm-youtube-facade")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: false }));
    const iframe = current.dom.querySelector<HTMLIFrameElement>("iframe");
    expect(iframe?.src).toBe("https://www.youtube.com/embed/9bZkp7q19f0?autoplay=1");
    expect(iframe?.getAttribute("sandbox")).toContain("allow-scripts");
    expect(iframe?.getAttribute("allow")).toContain("autoplay 'src'");
    expect(iframe?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("replaces a failed thumbnail with a readable fallback", () => {
    const current = createView("![](https://www.youtube.com/watch?v=jNQXAC9IVRw)");
    const image = current.dom.querySelector<HTMLImageElement>(".cm-youtube-facade img")!;
    image.dispatchEvent(new Event("error"));
    expect(current.dom.querySelector(".cm-youtube-facade img")).toBeNull();
    expect(current.dom.querySelector(".cm-youtube-facade__fallback")?.textContent)
      .toBe("Video thumbnail unavailable");
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

  it("keeps integrated HTML attack vectors out of the rendered DOM", () => {
    const current = createView('<div onclick="alert(1)" style="background:url(javascript:evil)"><script>alert(1)</script><span>#safe</span></div>');
    const block = current.dom.querySelector(".cm-html-block");
    expect(block?.querySelector("script")).toBeNull();
    expect(block?.querySelector("[onclick]")).toBeNull();
    expect(block?.innerHTML).not.toMatch(/javascript:|alert\(1\)/i);
  });

  it("renders many unloaded embed placeholders within the editor budget", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.reject(new Error("must not fetch")));
    const source = Array.from({ length: 25 }, (_, index) =>
      index % 2 === 0
        ? `<iframe src="https://example${index}.test/embed"></iframe>`
        : `![](https://x.com/user/status/${String(index).padStart(11, "1")})`,
    ).join("\n");
    const started = performance.now();
    const current = createView(source);
    const elapsed = performance.now() - started;
    expect(current.dom.querySelectorAll(".cm-iframe-placeholder")).toHaveLength(25);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(elapsed).toBeLessThan(1000);
    fetchSpy.mockRestore();
  });
});

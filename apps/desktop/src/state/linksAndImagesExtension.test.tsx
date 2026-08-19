// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  imageExtension,
  linkExtension,
  livePreviewExtension,
  MarkdownView,
  Strikethrough,
  syntaxHighlighting,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView, highlightActiveLine } from "@codemirror/view";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

interface TestEditorOptions {
  notePaths?: string[];
  sourcePath?: string;
  onLinkClick?: (target: string) => void;
  onExternalLinkClick?: (url: string) => void;
  selectionPos?: number;
}

function createTestEditor(doc: string, options: TestEditorOptions = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const onLinkClick = options.onLinkClick || vi.fn();
  const onExternalLinkClick = options.onExternalLinkClick || vi.fn();

  const view = new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.cursor(options.selectionPos ?? 0),
      extensions: [
        editorTheme,
        highlightActiveLine(),
        markdown({ extensions: [Strikethrough, highlightExtension] }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        imageExtension(),
        linkExtension({
          notePaths: options.notePaths || ["TargetNote.md", "specs/gamma.md"],
          sourcePath: options.sourcePath || "ActiveNote.md",
          onLinkClick,
          onExternalLinkClick,
        }),
      ],
    }),
    parent: container,
  });

  return {
    container,
    view,
    onLinkClick,
    onExternalLinkClick,
    destroy() {
      view.destroy();
      document.body.removeChild(container);
    },
  };
}

describe("Links & Images Extension (Phase 4)", () => {
  it("renders resolved and unresolved wikilinks with hidden syntax and dispatches click", () => {
    const onLinkClick = vi.fn();
    const doc =
      "Line 1\n[[TargetNote]] and [[NonExistent]] and [[TargetNote|Alias Text]]\nLine 3";
    const {
      container,
      onLinkClick: clickSpy,
      destroy,
    } = createTestEditor(doc, {
      onLinkClick,
      selectionPos: 0,
    });

    const wikilinks = container.querySelectorAll(".cm-wikilink");
    expect(wikilinks.length).toBe(3);

    // Resolved link check
    expect(wikilinks[0].classList.contains("cm-wikilink-resolved")).toBe(true);
    expect(wikilinks[0].textContent).toBe("TargetNote");

    // Unresolved link check (broken-link state)
    expect(wikilinks[1].classList.contains("cm-wikilink-unresolved")).toBe(
      true,
    );
    expect(wikilinks[1].textContent).toBe("NonExistent");

    // Alias check
    expect(wikilinks[2].classList.contains("cm-wikilink-resolved")).toBe(true);
    expect(wikilinks[2].textContent).toBe("Alias Text");

    // Click dispatch test
    (wikilinks[0] as HTMLElement).click();
    expect(clickSpy).toHaveBeenCalledWith("TargetNote");

    (wikilinks[1] as HTMLElement).click();
    expect(clickSpy).toHaveBeenCalledWith("NonExistent");

    destroy();
  });

  it("renders markdown internal links with indexer resolution and broken-link indicator", () => {
    const onLinkClick = vi.fn();
    const doc =
      "Line 1\n[My Spec](specs/gamma.md) and [Broken Spec](missing.md)\nLine 3";
    const {
      container,
      onLinkClick: clickSpy,
      destroy,
    } = createTestEditor(doc, {
      onLinkClick,
      selectionPos: 0,
    });

    const links = container.querySelectorAll(".cm-link-internal");
    expect(links.length).toBe(2);

    expect(links[0].classList.contains("cm-link-resolved")).toBe(true);
    expect(links[0].textContent).toBe("My Spec");

    expect(links[1].classList.contains("cm-link-unresolved")).toBe(true);
    expect(links[1].textContent).toBe("Broken Spec");

    // Click test
    (links[0] as HTMLElement).click();
    expect(clickSpy).toHaveBeenCalledWith("specs/gamma.md");

    destroy();
  });

  it("renders external links and autolinks and opens external browser on click", () => {
    const onExternalLinkClick = vi.fn();
    const doc =
      "Line 1\n[Tauri Docs](https://tauri.app) and <https://example.com/api> and [Encoded Space](https://example.com/a%20b) and [Angle Space](<https://example.com/foo bar>)\nLine 3";
    const {
      container,
      onExternalLinkClick: extSpy,
      destroy,
    } = createTestEditor(doc, {
      onExternalLinkClick,
      selectionPos: 0,
    });

    const extLinks = container.querySelectorAll(".cm-link-external");
    expect(extLinks.length).toBe(4);

    expect(extLinks[0].textContent).toBe("Tauri Docs");
    expect(extLinks[1].textContent).toBe("https://example.com/api");
    expect(extLinks[2].textContent).toBe("Encoded Space");
    expect(extLinks[3].textContent).toBe("Angle Space");

    // Click external link
    (extLinks[0] as HTMLElement).click();
    expect(extSpy).toHaveBeenCalledWith("https://tauri.app");

    (extLinks[3] as HTMLElement).click();
    expect(extSpy).toHaveBeenCalledWith("https://example.com/foo bar");

    destroy();
  });

  it("renders external images with width and height dimension syntax", () => {
    const doc =
      "Line 1\n![Logo|640x480](https://example.com/logo.png)\n![Banner|300](https://example.com/banner.png)\n![Plain](https://example.com/plain.png)\nLine 5";
    const { container, destroy } = createTestEditor(doc, { selectionPos: 0 });

    const imageEmbeds = container.querySelectorAll(".cm-image-embed");
    expect(imageEmbeds.length).toBe(3);

    const img1 = imageEmbeds[0].querySelector("img");
    expect(img1).not.toBeNull();
    expect(img1?.src).toBe("https://example.com/logo.png");
    expect(img1?.alt).toBe("Logo");
    expect(img1?.style.width).toBe("640px");
    expect(img1?.style.height).toBe("480px");
    expect(img1?.getAttribute("loading")).toBe("lazy");
    expect(img1?.getAttribute("decoding")).toBe("async");

    const img2 = imageEmbeds[1].querySelector("img");
    expect(img2?.style.width).toBe("300px");
    expect(img2?.style.height).toBe("auto");

    const img3 = imageEmbeds[2].querySelector("img");
    expect(img3?.alt).toBe("Plain");
    expect(img3?.style.width).toBe("");

    destroy();
  });

  it("renders images with dimension-only syntax without alt text and space-escaped URLs", () => {
    const doc =
      "Line 1\n![800x600](https://example.com/pic1.jpg)\n![400](<https://example.com/pic with space.jpg>)\nLine 4";
    const { container, destroy } = createTestEditor(doc, { selectionPos: 0 });

    const imageEmbeds = container.querySelectorAll(".cm-image-embed");
    expect(imageEmbeds.length).toBe(2);

    const img1 = imageEmbeds[0].querySelector("img");
    expect(img1?.style.width).toBe("800px");
    expect(img1?.style.height).toBe("600px");

    const img2 = imageEmbeds[1].querySelector("img");
    expect(decodeURI(img2?.src ?? "")).toBe(
      "https://example.com/pic with space.jpg",
    );
    expect(img2?.style.width).toBe("400px");

    destroy();
  });

  it("reveals raw markdown on the active line during editing and re-renders off-active-line", () => {
    const doc = "Line 1\n![Photo|200](https://example.com/photo.png)\nLine 3";
    const { container, view, destroy } = createTestEditor(doc, {
      selectionPos: 0,
    });

    // Initially cursor on line 1: image on line 2 is rendered as widget
    expect(container.querySelectorAll(".cm-image-embed").length).toBe(1);

    // Move cursor to line 2 (offset 10)
    view.dispatch({ selection: EditorSelection.cursor(10) });

    // Image widget should be replaced with raw markdown on active line
    expect(container.querySelectorAll(".cm-image-embed").length).toBe(0);
    expect(container.textContent).toContain(
      "![Photo|200](https://example.com/photo.png)",
    );

    // Move cursor back to line 1
    view.dispatch({ selection: EditorSelection.cursor(0) });
    expect(container.querySelectorAll(".cm-image-embed").length).toBe(1);

    destroy();
  });

  it("maintains compatibility with Phase 3 inline formatting and combined forms", () => {
    const doc =
      "Line 1\n**[[TargetNote]]** and *[Internal Link](specs/gamma.md)* and ==[External Link](https://example.com)== and ~~[Strike Link](https://example.com)~~\nLine 3";
    const { container, destroy } = createTestEditor(doc, { selectionPos: 0 });

    const wikilink = container.querySelector(".cm-wikilink");
    expect(wikilink).not.toBeNull();
    expect(wikilink?.textContent).toBe("TargetNote");

    const internalLink = container.querySelector(".cm-link-internal");
    expect(internalLink).not.toBeNull();
    expect(internalLink?.textContent).toBe("Internal Link");

    const extLinks = container.querySelectorAll(".cm-link-external");
    expect(extLinks.length).toBe(2);

    destroy();
  });

  it("renders all links and images in read-only MarkdownView", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const onLinkClick = vi.fn();
    const content =
      "[[TargetNote]] and [My Spec](specs/gamma.md) and [Tauri](https://tauri.app) and ![Photo|150](https://example.com/p.png)";

    await act(async () => {
      root.render(
        <MarkdownView
          value={content}
          notePaths={["TargetNote.md", "specs/gamma.md"]}
          sourcePath={"Source.md"}
          onLinkClick={onLinkClick}
        />,
      );
    });

    const wikilink = container.querySelector(".cm-wikilink");
    expect(wikilink).not.toBeNull();
    expect(wikilink?.textContent).toBe("TargetNote");

    const intLink = container.querySelector(".cm-link-internal");
    expect(intLink).not.toBeNull();
    expect(intLink?.textContent).toBe("My Spec");

    const extLink = container.querySelector(".cm-link-external");
    expect(extLink).not.toBeNull();
    expect(extLink?.textContent).toBe("Tauri");

    const imgEmbed = container.querySelector(".cm-image-embed img");
    expect(imgEmbed).not.toBeNull();
    expect((imgEmbed as HTMLImageElement)?.style.width).toBe("150px");

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});

// @vitest-environment jsdom
import {
  editorHighlightStyle,
  editorTheme,
  highlightExtension,
  linkExtension,
  livePreviewExtension,
  Strikethrough,
  syntaxHighlighting,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView, highlightActiveLine } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import { TauriExternalUrlAdapter } from "../adapters/TauriExternalUrlAdapter";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

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

describe("Link click behavior (does not change to md code)", () => {
  it("prevents mousedown default on wikilinks while allowing click to navigate", () => {
    const onLinkClick = vi.fn();
    const doc = "Here is a link to [[TargetNote]] in text.";
    const { container, onLinkClick: clickSpy, destroy } = createTestEditor(
      doc,
      { onLinkClick, selectionPos: 0 },
    );

    const wikilink = container.querySelector(".cm-wikilink") as HTMLElement;
    expect(wikilink).not.toBeNull();
    expect(wikilink.textContent).toBe("TargetNote");

    // Simulate mouse interaction: mousedown -> click
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    wikilink.dispatchEvent(mouseDownEvent);
    expect(mouseDownEvent.defaultPrevented).toBe(true);

    // Link syntax markers must remain hidden
    const brackets = container.querySelectorAll(".cm-wikilink-brackets");
    for (const bracket of brackets) {
      expect(bracket.classList.contains("cm-marker-hidden")).toBe(true);
    }

    // Now dispatch click to verify navigation still fires
    wikilink.click();
    expect(clickSpy).toHaveBeenCalledWith("TargetNote");

    // The link remains rendered and did not morph into raw markdown code
    expect(wikilink.textContent).toBe("TargetNote");

    destroy();
  });

  it("prevents mousedown default on external links and dispatches onExternalLinkClick", () => {
    const onExternalLinkClick = vi.fn();
    const doc = "External [Google Website](https://google.com) reference.";
    const {
      container,
      onExternalLinkClick: extSpy,
      destroy,
    } = createTestEditor(doc, {
      onExternalLinkClick,
      selectionPos: 0,
    });

    const extLink = container.querySelector(
      ".cm-link-external",
    ) as HTMLElement;
    expect(extLink).not.toBeNull();
    expect(extLink.textContent).toBe("Google Website");

    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    extLink.dispatchEvent(mouseDownEvent);
    expect(mouseDownEvent.defaultPrevented).toBe(true);

    // Markers must be hidden
    const hiddenTargets = container.querySelectorAll(".cm-link-target-hidden");
    for (const target of hiddenTargets) {
      expect(target.classList.contains("cm-marker-hidden")).toBe(true);
    }

    extLink.click();
    expect(extSpy).toHaveBeenCalledWith("https://google.com");
    expect(extLink.textContent).toBe("Google Website");

    destroy();
  });

  it("keeps link syntax hidden even when cursor is on the active line", () => {
    const doc = "Line 1\n[[TargetNote]] and [Gamma](specs/gamma.md)\nLine 3";
    // Cursor placed on line 2 (offset 10)
    const { container, destroy } = createTestEditor(doc, {
      selectionPos: 10,
    });

    const wikilink = container.querySelector(".cm-wikilink");
    expect(wikilink).not.toBeNull();
    expect(wikilink?.textContent).toBe("TargetNote");

    const intLink = container.querySelector(".cm-link-internal");
    expect(intLink).not.toBeNull();
    expect(intLink?.textContent).toBe("Gamma");

    // Brackets and link targets should have cm-marker-hidden
    const hiddenMarkers = container.querySelectorAll(
      ".cm-wikilink-brackets.cm-marker-hidden, .cm-link-target-hidden.cm-marker-hidden",
    );
    expect(hiddenMarkers.length).toBeGreaterThanOrEqual(2);

    destroy();
  });

  it("TauriExternalUrlAdapter delegates to open_bookmark_url for web links", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    const adapter = new TauriExternalUrlAdapter();
    await adapter.openUrl("https://example.com");

    expect(vi.mocked(invoke)).toHaveBeenCalledWith("open_bookmark_url", {
      url: "https://example.com",
    });
  });

  it("TauriExternalUrlAdapter falls back to open_external_url if open_bookmark_url rejects", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("bookmark error"));
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    const adapter = new TauriExternalUrlAdapter();
    await adapter.openUrl("https://meet.google.com/abc-defg-hij");

    expect(vi.mocked(invoke)).toHaveBeenCalledWith("open_bookmark_url", {
      url: "https://meet.google.com/abc-defg-hij",
    });
    expect(vi.mocked(invoke)).toHaveBeenCalledWith("open_external_url", {
      url: "https://meet.google.com/abc-defg-hij",
    });
  });
});
